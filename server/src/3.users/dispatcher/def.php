<?php

/*
 * Dispatcher user type.
 */
define( 'T_DISPATCHER', 'dispatcher' );

function disp_error( $cid, $error )
{
	$m = new message( "result", array(
		"errstr" => $error
	));
	$bytes = write_message( $cid, $m );

	if( $error ) {
		warning( "dispatcher error: $error" );
	}
	return $bytes;
}

function disp_result( $cid, $ok )
{
	$err = $ok ? null : "unspecified error";
	return disp_error( $cid, $err );
}

function disp_get_driver_id( $msg, $user )
{
	$taxi_id = $msg->data( 'driver_id' );
	if( !$taxi_id ) {
		warning( "Missing driver_id" );
		return null;
	}

	if( get_taxi_service( $taxi_id ) != $user->sid ) {
		warning( "Taxi ownership mismatch" );
		return null;
	}

	return intval( $taxi_id );
}

?>
