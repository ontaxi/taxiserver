<?php

init( function()
{
	$ns = 'disp_sessions::';
	listen_events( null, EV_SESSION_OPENED, $ns.'ev_session_opened' );
	listen_events( null, EV_SESSION_CLOSED, $ns.'ev_session_closed' );
	listen_events( null, EV_SESSION_REQUEST, $ns.'ev_session_request' );
	add_cmdfunc( T_DISPATCHER, 'open-session', $ns.'msg_open_session' );
	add_cmdfunc( T_DISPATCHER, 'close-session', $ns.'msg_close_session' );
});

class disp_sessions
{
	static function ev_session_opened( $event )
	{
		disp_broadcast( $event->sid, null, 'session-opened', array(
			'driver_id' => intval( $event->data['taxi_id'] ),
			'session_id' => intval( $event->data['session_id'] ),
			'car_id' => intval( $event->data['car_id'] ),
			'time_started' => intval( $event->data['time_started'] )
		));
	}

	static function ev_session_closed( $event )
	{
		disp_broadcast( $event->sid, null, 'session-closed', array(
			'driver_id' => intval( $event->data['taxi_id'] ),
			'session_id' => intval( $event->data['session_id'] )
		));
	}

	static function ev_session_request( $event )
	{
		$data = array(
			'driver_id' => intval( $event->data['taxi_id'] ),
			'odometer' => intval( $event->data['odometer'] )
		);
		disp_broadcast( $event->sid, null, 'session-requested', $data );
	}

	static function msg_open_session( $msg, $user )
	{
		$driver_id = disp_get_driver_id( $msg, $user );
		if( !$driver_id ) {
			return disp_error( $msg->cid, "Wrong driver id" );
		}

		$odometer = intval( $msg->data( 'odometer' ) );
		$err = open_157_session( $driver_id, $odometer, $user->id );
		return disp_error( $msg->cid, $err );
	}

	static function msg_close_session( $msg, $user )
	{
		$driver_id = disp_get_driver_id( $msg, $user );
		if( !$driver_id ) {
			return disp_error( $msg->cid, "Wrong driver id" );
		}

		$odometer = $msg->data( 'odometer' );

		close_157_session( $driver_id, $odometer, $user->id );
		return disp_result( $msg->cid, true );
	}
}
?>
