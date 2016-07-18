<?php

$NS = 'taxi_base_pos::';
add_cmdfunc( T_TAXI, 'position', $NS.'msg_position' );
add_cmdfunc( T_TAXI, 'taxi-login', $NS.'msg_login' );

define( 'EV_TAXI_POSITION', 'taxi-position' );
register_event_type( EV_TAXI_POSITION );

create_cache( 'taxi-position', 300 );

/*
 * Returns coordinates of the given driver.
 */
function get_taxi_position( $taxi_id ) {
	return taxi_base_pos::get_taxi_position( $taxi_id );
}

/*
 * An object representing position of a taxi.
 */
class taxi_position
{
	public $lat;
	public $lon;
	public $t;

	public $speed = 0;
	public $dr = 0;

	function __construct( $lat, $lon, $t = null )
	{
		if( !$t ) $t = time();

		$this->lat = floatval($lat);
		$this->lon = floatval($lon);
		$this->t = $t;
	}

	function __toString() {
		return sprintf("%.6f;%.6f (%d s ago)",
			$this->lat, $this->lon, time() - $this->t);
	}
}

class taxi_base_pos
{
	static function msg_login( $message, $user )
	{
		/*
		 * If this is a fresh login, reset coordinates.
		 */
		if( !$message->data( 'relogin' ) )
		{
			DB::updateRecord( 'taxi_drivers',
				array( 'latitude' => null, 'longitude' => null ),
				array( 'driver_id' => $user->id )
			);
		}
	}

	static function msg_position( $message, $user )
	{
		$taxi_id = $user->id;
		$lat = $message->data('latitude');
		$lon = $message->data('longitude');
		if( $message->timestamp )
		{
			$client = conn_find_user( $user );
			if( !$client ) {
				error( "Could not find client for user $user" );
				return false;
			}
			$t = $message->timestamp + $client->time_delta;
		}
		else {
			$t = time();
		}

		if( !$lat || !$lon ) {
			driver_error( $message->cid, "No coordinates in position" );
			return false;
		}

		$pos = new taxi_position( $lat, $lon, $t );
		$prev = get_cache( 'taxi-position', $taxi_id );
		set_cache( 'taxi-position', $taxi_id, $pos );

		if( $prev ) {
			self::calc_speed( $pos, $prev );
		}

		/*
		 * Update the database.
		 */
		taxi_drivers::update_position( $taxi_id, $lat, $lon );
		if( service_option( $user->sid, 'gps_tracking' ) ) {
			taxi_logs::save_driver_pos( $taxi_id, $lat, $lon, $t );
		}

		$data = array(
			'pos' => $pos,
			'taxi_id' => intval( $taxi_id )
		);
		announce_event( $user->sid, EV_TAXI_POSITION, $data );
	}

	private static function calc_speed( $next, $prev )
	{
		$dt = $next->t - $prev->t;
		if( $dt <= 0 ) {
			warning( "Invalid position time delta: $dt" );
			return;
		}

		if( $dt > 30 ) {
			logmsg( "Ignoring previous position, dt=$dt" );
			return;
		}

		$dr = haversine_distance( $prev->lat, $prev->lon,
			$next->lat, $next->lon );
		$v = $dr / $dt;
		$kmph = $v / 3.6;

		if( $kmph > 150 ) {
			warning( "Speed value is too big: $kmph km/h ($prev->lat, $prev->lon)->($next->lat, $next->lon)" );
			return;
		}

		$next->dr = $dr;
		$next->speed = $v;
	}

	static function get_taxi_position( $taxi_id )
	{
		return get_cache( 'taxi-position', $taxi_id );
	}
}

?>
