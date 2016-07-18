<?php

define( 'EV_LOGIN', 'ev-login' );
define( 'EV_LOGOUT', 'ev-logout' );
register_event_type( EV_LOGIN );
register_event_type( EV_LOGOUT );

function conn_close( $cid, $reason = 'Server hangup' ) {
	return conn::close( $cid, $reason );
}

function conn_send( $cid, $data ) {
	return conn::send( $cid, $data );
}

function conn_find_user( $user ) {
	return conn::find_user( $user );
}

/*
 * Returns contents of the cid register.
 */
function info_conn() {
	return conn::info();
}

schedule( 30, 'conn::clean' );

class conn
{
	/*
	 * Registered interfaces and their count.
	 */
	private static $boxes = array();
	private static $N = 0;

	/*
	 * cid => conn_client.
	 */
	private static $clients = array();

	/*
	 * Register an interface. The interface is an object with
	 * "poll", "send" and "close" functions.
	 */
	static function register_interface( $c )
	{
		self::$boxes[] = $c;
		$iid = self::$N++;

		$c->assign( $iid, 'conn::on_connect', 'conn::on_disconnect',
			'conn::on_receive' );
		return $iid;
	}

	static function connect()
	{
		foreach( self::$boxes as $iid => $c )
		{
			if( !$c->connect() ) {
				fatal( "connect call failed for interface #$iid" );
			}
		}
	}

	/*
	 * Poll all the interfaces. $max_time specifies how much time can be
	 * spent total on all the interfaces, in milliseconds.
	 */
	static function poll( $max_time )
	{
		foreach( self::$boxes as $c ) {
			$c->poll( $max_time / self::$N );
		}
	}

	/*
	 * Close a connection. Returns false if there is no such connection.
	 */
	static function close( $cid, $reason )
	{
		$c = self::get_client( $cid );
		if( !$c ) {
			warning( "close: no connection '$cid'" );
			return false;
		}

		$iid = $c->iid;
		return self::$boxes[$iid]->close( $cid, $reason );
	}

	/*
	 * Report a disconnect from interface #$iid.
	 * Reason may be error message or a reason to actively close.
	 */
	static function on_disconnect( $iid, $cid, $reason )
	{
		$c = self::get_client( $cid );
		if( !$c ) {
			warning( "no connection '$cid'" );
			return;
		}

		$user = $c->user;

		if( $user ) {
			logmsg( "$cid $user disconnected ($reason)", $user->sid, $user->id );
		}
		else {
			logmsg( "$cid disconnected ($reason)" );
		}

		if( $c->buffer != '' ) {
			warning( "Discarding data from connection $cid: $c->buffer" );
		}

		if( $user ) {
			announce_event( $user->sid, EV_LOGOUT, array( 'user' => $user ) );
		}
		unset( self::$clients[$cid] );
	}

	/*
	 * Send data to the given connection. $data is a string.
	 * Returns false if there is no such connection.
	 */
	static function send( $cid, $data )
	{
		$c = self::get_client( $cid );
		if( !$c ) {
			warning( "send: no connection '$cid'" );
			return false;
		}
		$iid = $c->iid;
		_timer::in();
		$r = self::$boxes[$iid]->send( $cid, $data );
		_timer::out( "conn::send" );
		return $r;
	}

	static function find_user( $user )
	{
		foreach( self::$clients as $client )
		{
			$u2 = $client->user;
			if( !$u2 ) continue;
			/*
			 * If this is the same object, return true.
			 */
			if( $u2 == $user ) return $client;
			/*
			 * If not, try matching as a pattern.
			 */
			if( $user->type && $user->type != $u2->type ) continue;
			if( $user->id && $user->id != $u2->id ) continue;
			if( $user->sid && $user->sid != $u2->sid ) continue;
			return $client;
		}
		return null;
	}

	static function find_users( $type, $sid, $id = null )
	{
		$list = array();
		foreach( self::$clients as $client )
		{
			$user = $client->user;
			if( !$user ) continue;
			if( $sid && $user->sid != $sid ) continue;
			if( $type && $user->type != $type ) continue;
			if( $id && $user->id != $id ) continue;
			$list[] = $client;
		}
		return $list;
	}

	static function on_connect( $iid, $cid )
	{
		logmsg( "$cid connected" );
		$c = new conn_client();
		$c->iid = $iid;
		$c->time_connected = time();
		$c->t = time();
		$c->cid = $cid;
		self::$clients[$cid] = $c;
		return $c;
	}

	/*
	 * Report received data from interface #$iid.
	 */
	static function on_receive( $iid, $cid, $data )
	{
		$c = self::get_client( $cid );
		/*
		 * Imitations have future time, so we shouldn't overwrite
		 * that.
		 */
		$now = time();
		if( $c->t < $now ) {
			$c->t = $now;
		}

		/*
		 * Append the data to the buffer.
		 */
		$c->buffer .= $data;

		/*
		 * Process all messages built up in the buffer.
		 */
		while( $msg = $c->pop_message() ) {
			_timer::in();
			receive_message( $c, $msg );
			_timer::out( "procmsg $msg" );
		}
	}

	/*
	 * Close timed out connections.
	 */
	static function clean()
	{
		$timeout = 60;
		$now = time();
		foreach( self::$clients as $c )
		{
			if( $now - $c->t < $timeout ) {
				continue;
			}
			self::close( $c->cid, "Inactivity timeout ($timeout s)" );
		}
	}

	static function info()
	{
		$table = array();
		foreach( self::$clients as $cid => $client )
		{
			$table[] = array(
				'cid' => $cid,
				'user' => $client->user,
				'time_connected' => $client->time_connected,
				'RTT' => $client->rtt
			);
		}
		return $table;
	}

	private static function get_client( $cid )
	{
		if( !isset( self::$clients[$cid] ) ) {
			return null;
		}
		return self::$clients[$cid];
	}
}
?>
