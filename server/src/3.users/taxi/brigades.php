<?php

init( function() {
	$ns = 'taxi_proto_brigs::';
	listen_events( null, EV_TAXI_POSITION, $ns.'ev_taxi_position' );
	add_cmdfunc( T_TAXI, 'taxi-login', $ns.'msg_taxi_login' );
	listen_events( null, EV_LOGOUT, $ns.'ev_logout' );
});

class taxi_proto_brigs
{
	/*
	 * Position events for any single driver may be too frequent, so
	 * we use throttles here to ensure sending period for a single
	 * driver at least this amount of seconds.
	 */
	const MIN_PERIOD = 30;
	private static $throttles = array();

	static function msg_taxi_login( $msg, $user )
	{
		$driver_id = $user->id;

		/*
		 * Notify the driver's brigs about the new driver.
		 */
		$brigs = self::online_driver_brigs( $driver_id );
		if( !empty( $brigs ) )
		{
			$m = new message( 'driver-online', array(
				'id' => intval( $driver_id ),
				'call_id' => get_taxi_call_id( $driver_id )
			));
			foreach( $brigs as $brig_id ) {
				send_to_taxi( $brig_id, $m );
			}
		}

		/*
		 * If this driver is a brig too, set up updates for them.
		 */
		if( self::is_brig( $driver_id ) )
		{
			/*
			 * Set up a throttle to limit updates frequency.
			 */
			self::$throttles[$driver_id] = new throttle( self::MIN_PERIOD );
			/*
			 * Send all known positions of the drivers in the brigade.
			 */
			self::send_positions( $driver_id );
		}
	}

	private static function send_positions( $driver_id )
	{
		$list = DB::getRecords( "SELECT
			acc_id AS id,
			call_id,
			latitude,
			longitude
			FROM taxi_drivers JOIN taxi_accounts USING (acc_id)
			-- same group as the given driver, but not the driver
			WHERE group_id = (SELECT group_id
				FROM taxi_drivers WHERE acc_id = $driver_id)
			AND acc_id <> $driver_id
			-- online
			AND is_online" );
		cast::table( $list, array(
			'id' => 'int',
			'call_id' => 'str',
			'latitude' => 'flt',
			'longitude' => 'flt'
		));
		$m = new message( 'driver-positions', $list );
		send_to_taxi( $driver_id, $m );
	}

	static function ev_logout( $event )
	{
		if( $event->data['user']->type != T_TAXI ) {
			return;
		}
		$driver_id = $event->data['user']->id;

		/*
		 * Remove the throttle if this driver was a brig.
		 */
		if( isset( self::$throttles[$driver_id] ) ) {
			unset( self::$throttles[$driver_id] );
		}

		/*
		 * Send "driver-offline" to brigs.
		 */
		$brigs = self::online_driver_brigs( $driver_id );
		if( !empty( $brigs ) )
		{
			$m = new message( 'driver-offline', array(
				'id' => intval( $driver_id )
			));
			foreach( $brigs as $brig_id ) {
				send_to_taxi( $brig_id, $m );
			}
		}
	}

	static function ev_taxi_position( $event )
	{
		$driver_id = $event->data['taxi_id'];
		$pos = $event->data['pos'];

		$brigs = self::online_driver_brigs( $driver_id );
		if( empty( $brigs ) ) {
			return;
		}

		$m = new message( 'driver-position', array(
			'id' => intval( $driver_id ),
			'latitude' => floatval( $pos->lat ),
			'longitude' => floatval( $pos->lon )
		));

		foreach( $brigs as $brig_id )
		{
			$throttle = self::$throttles[$brig_id];
			if( !$throttle ) continue;

			if( !$throttle->ready( $driver_id ) ) {
				continue;
			}
			send_to_taxi( $brig_id, $m );
		}
	}

	/*
	 * Returns identifiers of drivers who are online and are brigs for
	 * the given driver.
	 */
	private static function online_driver_brigs( $driver_id )
	{
		$online_brigs = array_keys( self::$throttles );
		if( empty( $online_brigs ) ) return array();
		$list = '('.implode( ", ", $online_brigs ) . ')';

		$driver_id = intval( $driver_id );
		return DB::getValues("
			SELECT acc_id FROM taxi_drivers
			WHERE group_id = (SELECT group_id
				FROM taxi_drivers
				WHERE acc_id = $driver_id)
			AND acc_id IN $list
			AND acc_id <> $driver_id" );
	}

	private static function is_brig( $driver_id ) {
		return DB::getValue( "SELECT is_brig FROM taxi_drivers
			WHERE acc_id = %d", $driver_id );
	}
}


class throttle
{
	/*
	 * Key => time to wait until.
	 */
	private $times = array();
	private $timeout;

	function __construct( $timeout ) {
		$this->timeout = $timeout;
	}

	function ready( $key )
	{
		if( !isset( $this->keys[$key] ) ) {
			$this->times[$key] = 0;
		}

		$now = time();

		if( $now < $this->times[$key] ) {
			return false;
		}

		$this->times[$key] = $now + $this->timeout;
		return true;
	}
}

?>
