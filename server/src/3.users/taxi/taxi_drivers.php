<?php
class taxi_drivers
{
	const T = 'taxi_drivers';

	/*
	 * How many warnings allowed before blocking.
	 */
	const MAX_WARNINGS = 3;

	static function end_block_time( $acc_id )
	{
		return DB::getValue( "SELECT UNIX_TIMESTAMP(block_until)
			FROM taxi_drivers
			WHERE acc_id = %d", $acc_id );
	}

	static function block( $acc_id, $end_time, $reason )
	{
		DB::exec( "UPDATE taxi_drivers
			SET block_until = FROM_UNIXTIME(%d),
			block_reason = '%s',
			order_refuses = 0
			WHERE acc_id = %d", $end_time, $reason, $acc_id );
	}

	static function unblock( $acc_id )
	{
		DB::exec( "UPDATE taxi_drivers
			SET block_until = DATE_SUB(NOW(), INTERVAL 10 MINUTE),
			block_reason = ''
			WHERE acc_id = %d", $acc_id );
	}

	static function add_warning( $acc_id )
	{
		$max_refuses = self::MAX_WARNINGS;

		DB::exec( "START TRANSACTION" );
		$refuses = DB::getValue( "SELECT order_refuses
			FROM taxi_drivers
			WHERE acc_id = %d", $acc_id );
		$remaining = $max_refuses - $refuses;
		if( $remaining > 0 ) {
			DB::exec( "UPDATE taxi_drivers
				SET order_refuses = order_refuses + 1
				WHERE acc_id = %d", $acc_id );
		}
		DB::exec( "COMMIT" );
		return $remaining;
	}

	static function reset_warnings( $acc_id )
	{
		DB::exec( "UPDATE taxi_drivers
			SET order_refuses = 0
			WHERE acc_id = %d", $acc_id );
	}

	static function touch_taxi( $acc_id )
	{
		DB::exec( "UPDATE taxi_drivers SET last_ping_time = NOW()
			WHERE acc_id = %d", $acc_id );
	}

	static function mark_order_time( $acc_id )
	{
		DB::exec( "UPDATE taxi_drivers SET last_order_time = NOW()
			WHERE acc_id = %d", $acc_id );
	}

	static function get_car_id( $acc_id )
	{
		return DB::getValue( "SELECT car_id FROM taxi_drivers
			WHERE acc_id = %d", $acc_id );
	}

	static function get_call_id( $acc_id )
	{
		return DB::getValue( "SELECT call_id
			FROM taxi_accounts
			WHERE acc_id = %d", $acc_id );
	}

	static function update_position( $acc_id, $lat, $lon )
	{
		DB::exec( "UPDATE taxi_drivers
			SET latitude = %.7f, longitude = %.7f
			WHERE acc_id = %d", $lat, $lon, $acc_id );
	}

	static function update_odometer( $acc_id, $odometer )
	{
		DB::exec( "UPDATE taxi_drivers driver, taxi_cars car
			SET odometer = %d
			WHERE driver.car_id = car.car_id
			AND driver.acc_id = %d",
			$odometer, $acc_id );
	}

	static function get_by_acc( $acc_id )
	{
		return DB::getValue( "SELECT driver_id FROM ".self::T."
			WHERE acc_id = %d", $acc_id );
	}

	static function get_by_car( $car_id )
	{
		return DB::getValue( "SELECT driver_id FROM ".self::T."
			WHERE car_id = %d", $car_id );
	}

	static function get_group_queues( $group_id )
	{
		return DB::getValues( "SELECT queue_id FROM taxi_driver_group_queues
			WHERE group_id = %d", $group_id );
	}

	static function set_group_queues( $group_id, $queues )
	{
		DB::exec( "START TRANSACTION" );
		DB::exec( "DELETE FROM taxi_driver_group_queues
			WHERE group_id = %d", $group_id );
		foreach( $queues as $qid ) {
			DB::exec( "INSERT INTO taxi_driver_group_queues
				(group_id, queue_id) VALUES (%d, %d)",
				$group_id, $qid );
		}
		DB::exec( "COMMIT" );
	}

	static function groups( $service_id )
	{
		$R = DB::getRecords( "SELECT group_id, name FROM taxi_driver_groups
			WHERE service_id = %d", $service_id );
		$map = array();
		foreach( $R as $r ) {
			$map[$r['group_id']] = $r;
		}
		return $map;
	}
}

?>
