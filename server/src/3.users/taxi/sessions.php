<?php
/*
 * Taxi protocol for the sessions module.
 */
init( function()
{
	$NS = 'proto_taxi_sessions::';

	listen_events( null, EV_SESSION_OPENED, $NS.'ev_session_opened' );
	listen_events( null, EV_SESSION_CLOSED, $NS.'ev_session_closed' );
	listen_events( null, EV_ORDER_STARTED, $NS.'ev_order_started' );
	listen_events( null, EV_TAXI_POSITION, $NS.'ev_taxi_position' );

	add_cmdfunc( T_TAXI, 'open-session', $NS.'msg_open_session' );
	add_cmdfunc( T_TAXI, 'close-session', $NS.'msg_close_session' );

	add_cmdfunc( T_TAXI, 'taxi-login', $NS.'msg_taxi_login' );
	add_cmdfunc( T_TAXI, 'decline-order', $NS.'msg_decline_order' );
	add_cmdfunc( T_TAXI, 'accept-order', $NS.'msg_accept_order' );
});

class proto_taxi_sessions
{
	static function ev_session_opened( $event )
	{
		$taxi_id = $event->data['taxi_id'];
		$m = new message( 'session-opened' );
		return send_to_taxi( $taxi_id, $m );
	}

	static function ev_session_closed( $event )
	{
		$taxi_id = $event->data['taxi_id'];
		$m = new message( 'session-closed' );
		return send_to_taxi( $taxi_id, $m );
	}

	/*
	 * "open-session" request: send a dialog to dispatchers for them
	 * to decide.
	 */
	static function msg_open_session( $msg, $user )
	{
		$taxi_id = $user->id;
		$odometer = $msg->data( 'odometer' );
		if( !session_needed( $taxi_id ) ) {
			return;
		}
		request_157_session( $taxi_id, $odometer );
	}

	/*
	 * "close-session": close current session.
	 */
	static function msg_close_session( $msg, $user )
	{
		$taxi_id = $user->id;
		$odometer = $msg->data( 'odometer' );
		logmsg( "Driver closes session", $user->sid, $user->id );
		close_157_session( $taxi_id, $odometer );
	}

	/*
	 * Send session status on taxi login.
	 */
	static function msg_taxi_login( $msg, $user )
	{
		$taxi_id = $user->id;
		if( !service_option( $user->sid, 'sessions' ) ) {
			return;
		}

		$open = service_sessions::get_taxi_session( $taxi_id ) ?
			'1' : '0';
		$m = new message( 'session-status' );
		$m->data( 'open', $open );
		send_to_taxi( $taxi_id, $m );
	}

	static function msg_decline_order( $msg, $user )
	{
		$taxi_id = $user->id;
		$order_id = $msg->data( 'order_id' );
		record_157_session_order( $taxi_id, $order_id );
		update_157_session( $taxi_id );
	}

	// TODO: use assign event here.
	static function msg_accept_order( $msg, $user )
	{
		$taxi_id = $user->id;
		$order_id = $msg->data( 'order_id' );
		record_157_session_order( $taxi_id, $order_id );
		update_157_session( $taxi_id );
	}

	static function ev_taxi_position( $event )
	{
		$pos = $event->data['pos'];
		$taxi_id = $event->data['taxi_id'];

		if( $pos->dr <= 0 ) {
			return;
		}

		// TODO: get_taxi_session which checks service option first.
		// and then uses caching.
		$sid = service_sessions::get_taxi_session( $taxi_id );
		if( !$sid ) {
			return;
		}
		service_sessions::increment_distance( $sid, $pos->dr );
	}

	static function ev_order_started( $event )
	{
		if( !service_option( $event->sid, 'sessions' ) ) {
			return;
		}
		$order = $event->data['order'];
		record_157_session_order( $order->taxi_id(), $order->id() );
	}
}
?>
