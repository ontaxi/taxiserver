<?php
init( function()
{
	$ns = 'proto_disp_imitations::';
	add_cmdfunc( T_DISPATCHER, 'set-imitation-online',
		$ns.'msg_set_imitation_online' );
});

class proto_disp_imitations
{
	static function msg_set_imitation_online( $msg, $user )
	{
		$taxi_id = $msg->data( 'taxi_id' );
		$online = $msg->data( 'online' );

		if( get_taxi_service( $taxi_id ) != $user->sid ) {
			return disp_error( $msg->cid, "Wrong driver id" );
		}

		if( service_option( $user->sid, 'sessions' ) )
		{
			$err = self::fix_session( $taxi_id, $online, $user );
			if( $err != null ) {
				return disp_error( $msg->cid, $err );
			}
		}

		set_imitation_online( $taxi_id, $online );
		return disp_result( $msg->cid, true );
	}

	private static function fix_session( $taxi_id, $online, $user )
	{
		if( $online ) {
			return open_157_session( $taxi_id, 0, $user->id );
		}

		close_157_session( $taxi_id, 0, $user->id );
		return null;
	}
}

?>
