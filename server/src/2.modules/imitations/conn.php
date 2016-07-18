<?php
/*
 * Connections interface for imitations. Redirects all outgoing data
 * to the imitations module. "Receives" all incoming data from
 * imitation buffers.
 */
class conn_imitations
{
	private $iid;
	private $on_connect;
	private $on_receive;
	private $on_disconnect;
	private $have_data = false;

	/*
	 * cid => imitation.
	 */
	private $imitations = array();

	function assign( $iid, $on_connect, $on_disconnect, $on_receive )
	{
		$this->iid = $iid;
		$this->on_connect = $on_connect;
		$this->on_disconnect = $on_disconnect;
		$this->on_receive = $on_receive;
	}

	function poll( $timeout )
	{
		if( !$this->have_data ) return;
		$this->have_data = false;
		/*
		 * Check all imitation buffers and send all data up.
		 */
		foreach( $this->imitations as $cid => $im )
		{
			$str = $im->popdata();
			if( $str ) {
				call_user_func( $this->on_receive, $this->iid, $cid, $str );
			}
		}
	}

	function _add_connection( $taxi_id )
	{
		$sid = get_taxi_service( $taxi_id );

		logmsg( "Connect fake: #$taxi_id", $sid, $taxi_id );

		$cid = $this->taxi_cid( $taxi_id );
		if( isset( $this->imitations[$cid] ) ) {
			warning( "Imitation #$taxi_id is already connected" );
			return null;
		}
		$im = new imitation();
		$im->taxi_id = $taxi_id;
		$this->imitations[$cid] = $im;

		/*
		 * Hack through the internals and set the user and the 't'
		 * value directly.
		 */
		$client = call_user_func( $this->on_connect, $this->iid, $cid );
		$client->user = new conn_user( T_TAXI, $taxi_id, $sid );
		$client->mode = 'msg';
		announce_event( $sid, EV_LOGIN, array( 'user' => $client->user ) );
		/*
		 * Set 't' far in future to avoid autocleaning.
		 */
		$client->t = time() + 2000000;
		return true;
	}

	function _disconnect( $taxi_id )
	{
		$sid = get_taxi_service( $taxi_id );
		logmsg( "Disconnect fake: #$taxi_id", $sid, $taxi_id );
		$cid = $this->taxi_cid( $taxi_id );
		if( !isset( $this->imitations[$cid] ) ) {
			warning( "No taxi_id #$taxi_id in imitations" );
			return;
		}
		conn_close( $cid, '' );
	}

	private function taxi_cid( $taxi_id )
	{
		return "fake-#$taxi_id";
	}

	function close( $cid, $reason = 'Unknown' )
	{
		if( !isset( $this->imitations[$cid] ) ) {
			warning( "No connection '$cid' in conn_fake" );
			return false;
		}
		$taxi_id = $this->imitations[$cid]->taxi_id;

		call_user_func( $this->on_disconnect, $this->iid, $cid, $reason );
		unset( $this->imitations[$cid] );
		return true;
	}

	function send( $cid, $data )
	{
		if( !isset( $this->imitations[$cid] ) ) {
			warning( "No connection '$cid' in conn_fake" );
			return false;
		}
		$im = $this->imitations[$cid];

		$message = message::parse_from_json( $data );
		/*
		 * If process_message returns true, it means the reply has
		 * been put into the buffer.
		 */
		if( $im->process_message( $message ) ) {
			$this->have_data = true;
		}
		return strlen( $data );
	}

	function connect()
	{
		$R = DB::getValues( "SELECT acc_id FROM taxi_drivers
			WHERE deleted = 0 AND is_fake = 1
			AND is_online = 1" );
		foreach( $R as $taxi_id )
		{
			if( session_needed( $taxi_id ) )
			{
				DB::exec( "UPDATE taxi_drivers
					SET is_online = 0
					WHERE acc_id = %d", $taxi_id );
				continue;
			}
			$this->_add_connection( $taxi_id );
		}
		return true;
	}
}

?>
