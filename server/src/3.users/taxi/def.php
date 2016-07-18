<?php

define( 'T_TAXI', 'taxi' );

define( "EV_TAXI_BUSY", "ev-taxi-busy" );
register_event_type( EV_TAXI_BUSY );

create_cache( 'taxi_service' );

/*
 * Returns service id for the given taxi.
 */
function get_taxi_service( $driver_id )
{
	if( !$driver_id ) {
		return null;
	}

	$sid = get_cache( 'taxi_service', $driver_id );
	if( $sid ) {
		return $sid;
	}

	$sid = DB::getValue( "SELECT service_id
		FROM taxi_accounts
		WHERE acc_id = %d AND `type` = 'driver'", $driver_id );
	if( !$sid ) {
		return null;
	}

	set_cache( 'taxi_service', $driver_id, $sid );
	return $sid;
}

/*
 * Returns true if the given account identifier belongs to a driver.
 */
function is_driver( $acc_id ) {
	return get_taxi_service( $acc_id ) != null;
}

function get_taxi_call_id( $taxi_id ) {
	return taxi_drivers::get_call_id( $taxi_id );
}

function driver_car_id( $driver_id ) {
	$id = DB::getValue( "
		SELECT car_id
		FROM taxi_drivers
		WHERE acc_id = %d", $driver_id );
	return $id;
}

/*
 * Send a message to the given taxi.
 */
function send_to_taxi( $taxi_id, $message, $important = false ) {
	$u = new conn_user( T_TAXI, $taxi_id, null );
	return send_message( $u, $message, $important );
}

/*
 * Broadcast a message to all online drivers of a given service.
 */
function taxi_broadcast( $sid, $message ) {
	$c = 0;
	$R = conn::find_users( T_TAXI, $sid );
	foreach( $R as $r ) {
		if( write_message( $r->cid, $message )) {
			$c++;
		}
	}
	return $c;
}

/*
 * Send a text to the taxi.
 */
function send_text_to_taxi( $taxi_id, $text ) {
	$m = new message( 'message', array( 'text' => $text ) );
	return send_to_taxi( $taxi_id, $m );
}

/*
 * Mark the given driver as busy or not. A driver is considered busy
 * if they cannot react to new dialogs from dispatchers.
 */
function set_driver_busy( $driver_id, $busy )
{
	DB::exec( "UPDATE taxi_drivers
		SET accept_new_orders = %d
		WHERE acc_id = %d", $busy? 0 : 1, $driver_id );

	$sid = get_taxi_service( $driver_id );
	$data = array(
		"taxi_id" => $driver_id,
		"busy" => $busy
	);
	announce_event( $sid, EV_TAXI_BUSY, $data );
}

function driver_error( $cid, $msg ) {
	write_message( $cid, new message( 'error', array( 'errstr' => $msg ) ) );
	warning( "driver error: $msg" );
	return false;
}

?>
