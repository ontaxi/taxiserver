<?php
init( function()
{
	$NS = 'disp_proto_bans::';
	add_cmdfunc( T_DISPATCHER, 'ban-taxi', $NS.'msg_ban_taxi' );
	add_cmdfunc( T_DISPATCHER, 'unban-taxi', $NS.'msg_unban_taxi' );
	listen_events( null, EV_TAXI_BANNED, $NS.'ev_taxi_banned' );
	listen_events( null, EV_TAXI_UNBANNED, $NS.'ev_taxi_unbanned' );
});

class disp_proto_bans
{
	static function msg_ban_taxi( $msg, $user )
	{
		$driver_id = disp_get_driver_id( $msg, $user );
		$seconds = $msg->data( 'seconds' );
		$reason = $msg->data( 'reason' );

		$ok = $driver_id && ban_taxi( $driver_id, $seconds, $reason );
		return disp_result( $msg->cid, $ok );
	}

	static function msg_unban_taxi( $msg, $user )
	{
		$driver_id = disp_get_driver_id( $msg, $user );
		$ok = $driver_id && unban_taxi( $driver_id );
		return disp_result( $msg->cid, $ok );
	}

	static function ev_taxi_banned( $event )
	{
		$data = array(
			'driver_id' => $event->data['taxi_id'],
			'until' => $event->data['until'],
			'reason' => $event->data['reason']
		);
		disp_broadcast( $event->sid, null, 'driver-blocked', $data );
	}

	static function ev_taxi_unbanned( $event )
	{
		$data = array(
			'driver_id' => $event->data['taxi_id']
		);
		disp_broadcast( $event->sid, null, 'driver-unblocked', $data );
	}
}

?>
