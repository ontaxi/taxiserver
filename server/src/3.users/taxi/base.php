<?php

function get_taxi_lag( $taxi_id ) {
	return taxi_base::get_taxi_lag( $taxi_id );
}

init( function()
{
	$ns = 'taxi_base::';

	DB::exec( "UPDATE taxi_drivers
		SET is_online = 0 WHERE is_fake = 0" );

	add_auth_func( $ns.'auth' );
	add_cmdfunc_first( T_TAXI, 'taxi-login', $ns.'msg_taxi_login' );
	add_cmdfunc( T_TAXI, 'taxi-logout', $ns.'msg_taxi_logout' );
	add_cmdfunc( T_TAXI, 'ping', $ns.'msg_ping' );
	add_cmdfunc( T_TAXI, 'get-route-2', $ns.'msg_get_route' );
	add_cmdfunc( T_TAXI, 'get-ban-info', $ns.'msg_get_ban_info' );
	add_cmdfunc_first( T_TAXI, '*', $ns.'msg_check_command' );

	listen_events( null, EV_LOGIN, $ns.'ev_loginout' );
	listen_events( null, EV_LOGOUT, $ns.'ev_loginout' );
	listen_events( null, EV_TAXI_BANNED, $ns.'ev_taxi_ban' );
	listen_events( null, EV_TAXI_UNBANNED, $ns.'ev_taxi_ban' );
});


class taxi_base
{
	private static $allowed_commands = array(
		'taxi-login',
		'taxi-logout',
		'ping',
		'position',
		'get-route-2',
		'road-message',
		'get-road-messages',
		'get-ban-info',
		'cancel-order',
		'order-started',
		'order-finished'
	);

	/*
	 * Authorisation function for taxi.
	 */
	static function auth( $cid, $str )
	{
		/*
		 * Authorisation message should be a "taxi-login" message.
		 */
		$message = message::parse_from_json( $str );
		if( !$message || $message->command != 'taxi-login' ) {
			return null;
		}

		$login = $message->data( "login" );
		$password = $message->data( "password" );

		$acc_id = taxi_accounts::check( 'driver', $login, $password );
		$r = DB::getRecord( "SELECT driver_id, call_id, service_id
			FROM taxi_accounts JOIN taxi_drivers USING (acc_id)
			WHERE acc_id = %d AND is_fake = 0", $acc_id );

		if( !$r ) {
			$m = new message( 'login-failed' );
			write_message( $cid, $m );
			return false;
		}

		$taxi_id = $acc_id;
		$call_id = $r['call_id'];
		$sid = $r['service_id'];

		/*
		 * Write login event to the log.
		 */
		$relogin = $message->data( 'relogin' );
		if( $relogin === null ) {
			driver_error( $cid, 'Missing `relogin` field in taxi-login' );
			$relogin = 0;
		}
		if( !$relogin ) {
			taxi_logs::log_in( $acc_id, $cid );
		}

		$m = new message( 'login-ok', array( 'time' => time() ) );
		write_message( $cid, $m );

		/*
		 * Check if this driver has an abandoned connection.
		 */
		$user = new conn_user( T_TAXI, $taxi_id, $sid );
		self::check_old_connections( $user, $cid );
		return $user;
	}

	/*
	 * Make sure the taxi doesn't have old connections.
	 */
	private static function check_old_connections( $user, $new_cid )
	{
		/*
		 * Because taxi clients can't reliably detect when their OS
		 * changes connections, they may open a new connection and leave
		 * the previous one open too. In that case we close it.
		 *
		 * This is such a common situation that we don't even send a
		 * warning anymore.
		 */
		$clients = conn::find_users( $user->type, $user->sid, $user->id );
		foreach( $clients as $client )
		{
			$old_cid = $client->cid;
			if( $old_cid == $new_cid ) {
				continue;
			}
			logmsg( "#$user->id switched connection from $old_cid to $new_cid",
				$user->sid, $user->id );
			conn_close( $old_cid, "Switched connection" );
		}
	}

	/*
	 * "taxi-login" message.
	 */
	static function msg_taxi_login( $message, $user )
	{
		$taxi_id = $user->id;
		$login = $message->data( 'login' );
		$version = $message->data( 'version' );
		if( !$version ) {
			$version = 'Unknown';
		}

		/*
		 * Make sure this message gets processed only once for each
		 * connection.
		 */
		if( $user->data( 'login' ) ) {
			warning( "Repeated taxi-login from $user" );
			return false;
		}
		$user->data( 'login', 1 );


		DB::exec( "UPDATE taxi_drivers
			SET client_version = '%s',
				last_ping_time = NOW()
			WHERE acc_id = %d", $version, $taxi_id );

		set_driver_busy( $taxi_id, false );

		/*
		 * It is possible that a driver doesn't have a car assigned
		 * in the database.
		 */
		$car_id = driver_car_id( $taxi_id );
		if( !$car_id )
		{
			warning( "Empty car_id for #$taxi_id" );
			send_text_to_taxi( $taxi_id, 'Администратор не назначил вам автомобиль.' );
			return false;
		}
	}

	/*
	 * "taxi-logout" message.
	 */
	static function msg_taxi_logout( $message, $user )
	{
		$taxi_id = $user->id;
		conn_close( $message->cid, "Taxi logout" );
		service_log( $user->sid, '{t} завершил работу.', $user->id );
	}

	/*
	 * Return taxi network lag from the register.
	 */
	static function get_taxi_lag( $taxi_id )
	{
		$client = conn_find_user( new conn_user( T_TAXI, $taxi_id, null ) );
		if( !$client ) return null;
		return $client->rtt;
	}
	/*
	 * Save taxi network lag to the register.
	 */
	static function save_taxi_lag( $taxi_id, $rtt )
	{
		$client = conn_find_user( new conn_user( T_TAXI, $taxi_id, null ) );
		if( !$client ) {
			error( "save_taxi_lag: can't find client for #$taxi_id" );
			return;
		}
		$client->rtt = $rtt;
	}

	static function msg_ping( $message, $user )
	{
		$taxi_id = $user->id;
		/*
		 * Update "last_ping_time" in the database.
		 */
		taxi_drivers::touch_taxi( $taxi_id );

		$time = $message->data( 'time' );
		$lag = $message->data( 'lag' );
		if( $lag === null || $time === null ) {
			return driver_error( $message->cid, "Missing `time` or `lag` field" );
		}
		self::save_taxi_lag( $taxi_id, $lag );

		$pong = new message( 'pong', array( 'time' => $time ) );
		return send_to_taxi( $taxi_id, $pong );
	}

	static function msg_get_route( $message, $user )
	{
		$taxi_id = $user->id;
		$m = $message;
		$lat1 = $m->data( 'latitude1' );
		$lon1 = $m->data( 'longitude1' );
		$lat2 = $m->data( 'latitude2' );
		$lon2 = $m->data( 'longitude2' );
		$data = mod_routes::get_route( $lat1, $lon1, $lat2, $lon2 );
		if( !$data ) {
			debmsg( "No response from routes" );
			return false;
		}

		$data = array(
			'distance' => $data['route_summary']['total_distance'],
			'points' => $data['route_geometry'],
			'positions' => array(
				array(
					'lat' => $lat1,
					'lng' => $lon1
				),
				array(
					'lat' => $lat2,
					'lng' => $lon2
				)
			)
		);

		return send_to_taxi( $taxi_id, new message( 'route-2', $data ) );
	}

	/*
	 * Send ban info to the taxi.
	 */
	private static function send_ban_info( $taxi_id )
	{
		$time = remaining_ban_time( $taxi_id );
		return send_to_taxi( $taxi_id, new message( 'ban-info', array(
			'remaining_time' => $time ) )
		);
	}

	static function ev_taxi_ban( $event )
	{
		$taxi_id = $event->data['taxi_id'];
		self::send_ban_info( $taxi_id );
	}

	/*
	 * "get-ban-info" message.
	 */
	static function msg_get_ban_info( $message, $user )
	{
		$taxi_id = $user->id;
		return self::send_ban_info( $taxi_id );
	}

	/*
	 * Catches all messages and, if the taxi is blocked, blocks those
	 * messages which are not allowed .
	 */
	static function msg_check_command( $message, $user )
	{
		$taxi_id = $user->id;

		if( !taxi_is_banned( $taxi_id ) ) {
			return true;
		}

		$cmd = $message->command;

		if( $cmd == 'taxi-login' ) {
			$ban_time = remaining_ban_time( $taxi_id );
			return self::send_ban_info( $taxi_id, $ban_time );
		}

		/*
		 * If the command is not allowed, block it by returning false.
		 */
		if( !in_array( $cmd, self::$allowed_commands ) ) {
			logmsg( "Blocked command $cmd from #$taxi_id",
				$user->sid, $user->id );
			return false;
		}

		return true;
	}

	static function ev_loginout( $event )
	{
		$user = $event->data['user'];
		if( $user->type != T_TAXI ) {
			return;
		}

		$online = ($event->type == EV_LOGIN) ? 1 : 0;
		DB::exec( "UPDATE taxi_drivers
			SET is_online = %d
			WHERE acc_id = %d", $online, $user->id );
		$msg = $online ? '{t} подключился к серверу.' : '{t} отключился от сервера.';
		service_log( $user->sid, $msg, $user->id );
	}
}

?>
