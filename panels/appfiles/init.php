<?php
set_time_limit( 20 );

define( 'IMAGE_ACCEPTABLE_EXTENSIONS', '.png, .jpg, .jpeg, .gif' );
define( 'IMAGE_MAX_SIZE', 1 << 20 );

require APPLICATION_PATH.'/classes/taxiserver/classes.php';
add_classes_dir( APPLICATION_PATH.'/classes/taxiserver' );
add_classes_dir( APPLICATION_PATH.'/lib/taxi-clients' );

lib( 'macros' );
lib( 'filler' );
lib( 'str' );

function sid() {
	return user::get_data( 'service_id' );
}

function disp_cmd( $disp_id, $sid, $cmd, $data, &$err )
{
	$err = null;

	$addr = setting( 'taxi_server_addr' );
	$client = new dispatcher_client();
	$ok = @$client->connect( $addr );
	if( !$ok ) {
		$err = 'Could not connect';
		return false;
	}
	if( !$client->login( $disp_id, $sid ) ) {
		$err = 'Could not login';
		return false;
	}
	if( !$client->cmd( $cmd, $data ) ) {
		$err = $client->error();
		return false;
	}
	return true;
}

?>
