<?php
init( function()
{
	$NS = 'proto_dispatcher::';
	add_auth_func( $NS.'auth' );
	add_cmdfunc( T_DISPATCHER, 'auth-dispatcher', $NS.'msg_auth_dispatcher' );
	add_cmdfunc( T_DISPATCHER, 'send-text', $NS.'msg_send_text' );
	listen_events( null, EV_TAXI_POSITION, $NS.'ev_taxi_position' );
	listen_events( null, EV_TAXI_ALARM_ON, $NS.'ev_taxi_alarm_on' );
	listen_events( null, EV_TAXI_ALARM_OFF, $NS.'ev_taxi_alarm_off' );
	listen_events( null, EV_LOGIN, $NS.'ev_loginout' );
	listen_events( null, EV_LOGOUT, $NS.'ev_loginout' );
	listen_events( null, EV_TAXI_BUSY, $NS.'ev_taxi_busy' );

	$S = DB::getValues( "SELECT service_id FROM taxi_services" );
	foreach( $S as $sid ) {
		disp_broadcast( $sid, null, 'sync' );
	}
});

class proto_dispatcher
{
	static function auth( $cid, $str )
	{
		if( strpos( $cid, '127.0.0.1' ) !== 0 ) {
			return null;
		}

		$m = message::parse_from_json( $str );
		if( !$m ) {
			return null;
		}

		if( $m->command != 'auth-dispatcher' ) {
			return null;
		}

		// TODO: do authorisation by name and password
		$sid = $m->data( 'sid' );
		$id = $m->data( 'id' );
		$u = new conn_user( T_DISPATCHER, $id, $sid );

		disp_result( $cid, true );
		return $u;
	}

	static function msg_auth_dispatcher( $cmd, $user ) {
		// nothing
	}

	static function msg_send_text( $msg, $user )
	{
		$cid = $msg->cid;
		$taxi_id = disp_get_driver_id( $msg, $user );
		$text = trim( $msg->data( 'text' ) );
		if( !$taxi_id ) {
			return disp_error( $cid, "Unknown taxi" );
		}
		if( !$text ) {
			return disp_error( $cid, "No text to send" );
		}
		if( !send_text_to_taxi( $taxi_id, $text ) ) {
			return disp_error( $cid, "Could not send the text" );
		}
		return disp_result( $cid, true );
	}

	static function ev_taxi_position( $event )
	{
		$taxi_id = $event->data['taxi_id'];
		$pos = $event->data['pos'];
		$data = array(
			'driver_id' => $taxi_id,
			'latitude' => $pos->lat,
			'longitude' => $pos->lon
		);
		disp_broadcast( $event->sid, null, 'driver-position', $data );
	}

	static function ev_taxi_alarm_on( $event )
	{
		$taxi_id = $event->data['taxi_id'];
		disp_broadcast( $event->sid, null, 'driver-alarm-on', array(
			'driver_id' => $taxi_id
		));
	}

	static function ev_taxi_alarm_off( $event )
	{
		$taxi_id = $event->data['taxi_id'];
		disp_broadcast( $event->sid, null, 'driver-alarm-off', array(
			'driver_id' => $taxi_id
		));
	}

	static function ev_loginout( $event )
	{
		$user = $event->data['user'];
		if( $user->type != T_TAXI ) {
			return;
		}

		$online = ($event->type == EV_LOGIN) ? 1 : 0;
		disp_broadcast( $user->sid, null, 'driver-changed', array(
			'driver_id' => $user->id,
			'diff' => array(
				'is_online' => $online
			)
		));
	}

	static function ev_taxi_busy( $event )
	{
		disp_broadcast( $event->sid, null, 'driver-busy', array(
			'driver_id' => $event->data["taxi_id"],
			'busy' => $event->data["busy"]
		));
	}
}
?>
