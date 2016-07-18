<?php

init(function()
{
	schedule( 60, 'disp_channels::clean' );
});

function disp_broadcast( $sid, $loc_id, $cmd, $data = array() ) {
	return disp_channels::broadcast( $sid, $loc_id, $cmd, $data );
}

class disp_channels
{
	/*
	 * Puts a message to the channel.
	 */
	static function broadcast( $sid, $loc_id, $type, $data = array() )
	{
		if( !$sid ) return false;

		$message = array(
			'type' => $type,
			'data' => $data
		);

		$id = DB::insertRecord( 'taxi_channels', array(
			'channel_id' => $sid,
			'loc_id' => $loc_id,
			'message' => json_encode( $message )
		));
		debmsg( "Dispatchers broadcast ($id): $type" );
	}

	static function send( $acc_id, $type, $data = array() )
	{
		$msg = array( 'type' => $type, 'data' => $data );
		$id = DB::insertRecord( 'taxi_channels', array(
			'acc_id' => $acc_id,
			'message' => json_encode( $msg )
		));
		debmsg( "Dispatcher send ($id): $type" );
	}

	static function clean()
	{
		$max = DB::getValue( "SELECT MAX(message_id) FROM taxi_channels" );
		if( !$max ) {
			return;
		}
		$max -= 60;
		DB::exec( "DELETE FROM taxi_channels
			WHERE message_id < $max" );
	}
}

?>
