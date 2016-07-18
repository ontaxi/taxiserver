<?php
class service_sessions
{
	/*
	 * Returns id of the taxi's open session, if such exists, or null.
	 */
	static function get_taxi_session( $driver_id )
	{
		return DB::getValue(
			"SELECT id FROM taxi_works
			WHERE driver_id = %d
			AND time_finished IS NULL",
			$driver_id
		);
	}

	static function get_taxi_session_r( $driver_id )
	{
		return DB::getRecord(
			"SELECT id, car_id,
				UNIX_TIMESTAMP(time_started) AS begin_time
			FROM taxi_works
			WHERE driver_id = %d
			AND time_finished IS NULL",
			$driver_id
		);
	}

	/*
	 * Takes a list of taxis and returns a dict taxi_id => session id.
	 * Used by the filter function for 157.
	 */
	static function get_taxi_sessions_kv( $driver_ids )
	{
		$cond = DB::buildCondition( array(
			'driver_id' => $driver_ids
		));

		$a = DB::getRecords(
			"SELECT driver_id, id FROM taxi_works
			WHERE $cond
			AND time_finished IS NULL"
		);

		return array_column( $a, 'id', 'driver_id' );
	}

	/*
	 * Get table of open sessions. Used by dispatchers.
	 */
	static function get_open_sessions_r( $service_id )
	{
		return DB::getRecords( "
			SELECT
				id AS session_id,
				w.driver_id,
				w.car_id,
				UNIX_TIMESTAMP(w.time_started) AS time_started
			FROM taxi_works w
			JOIN taxi_accounts acc
				ON acc.acc_id = w.driver_id
			WHERE w.time_finished IS NULL
			AND acc.service_id = %d
			AND acc.deleted = 0", $service_id );
	}

	/*
	 * Close given session writing giving values to it.
	 */
	static function close_session( $session_id, $odometer,
		$dispatcher_id, $lat, $lon, $address )
	{
		$session_id = intval( $session_id );
		$dispatcher_id = intval( $dispatcher_id );
		$odometer = intval( $odometer );

		$lat = $lat ? sprintf( '%f', $lat ) : 'NULL';
		$lon = $lon ? sprintf( '%f', $lon ) : 'NULL';
		if( !$dispatcher_id ) $dispatcher_id = 'NULL';

		DB::exec( "
			UPDATE taxi_works
			SET odometer_end = $odometer,
				time_finished = NOW(),
				end_latitude = $lat,
				end_longitude = $lon,
				end_address = '%s',
				end_dispatcher = $dispatcher_id
			WHERE id = $session_id
			AND time_finished IS NULL",
			$address
		);
	}

	/*
	 * Adds $order_id to the given session.
	 */
	static function add_session_order( $session_id, $order_id )
	{
		/*
		 * Can't use INSERT IGNORE anymore because MariaDB throws
		 * warnings on duplicates. No point in wrapping the check in a
		 * transaction either.
		 */
		$t = "taxi_work_orders";
		$row = array(
			'work_id' => $session_id,
			'order_id' => $order_id
		);
		if( DB::exists( $t, $row ) ) {
			return;
		}
		DB::insertRecord( $t, $row );
	}

	/*
	 * Increment GPS distance for the given session.
	 * $distance is a float icrement value in meters.
	 */
	static function increment_distance( $session_id, $distance )
	{
		DB::exec( "UPDATE taxi_works
			SET gps_distance = gps_distance + %.1f
			WHERE id = %d",
			$distance, $session_id );
	}

	/*
	 * Update last_activity_time of the given session.
	 */
	static function update_session_activity( $session_id )
	{
		DB::exec( "UPDATE taxi_works
			SET last_activity_time = NOW()
			WHERE id = %d",
			$session_id );
	}

	/*
	 * Return open sessions that have been inactive for
	 * $timeout seconds.
	 */
	static function get_inactive_sessions_r( $timeout = 10800,
		$max_duration = 50400 )
	{
		return DB::getRecords( "
			SELECT id, driver_id,
			TIMESTAMPDIFF( SECOND, last_activity_time, NOW() ) AS idle_time,
			TIMESTAMPDIFF( SECOND, time_started, NOW() ) AS duration
			FROM taxi_works w
			WHERE time_finished IS NULL
			AND (TIMESTAMPDIFF( SECOND, last_activity_time, NOW() ) >= %d
				OR TIMESTAMPDIFF( SECOND, time_started, NOW() ) >= %d )",
			$timeout, $max_duration
		);
	}

	static function get_session_orders_r( $session_id )
	{
		$session_id = intval( $session_id );
		return DB::getRecords("
		SELECT
		o.order_id,
		o.time_created,
		o.taxi_id = w.driver_id AS assigned,
		o.`status` = 'finished' AS finished,
		o.`status`,
		o.src_addr AS address

		FROM ext157_works w
		JOIN ext157_work_orders wo ON w.id = wo.work_id
		JOIN taxi_orders o USING (order_id)
		WHERE work_id = $session_id
		AND o.deleted = 0
		ORDER BY o.time_created
		");
	}
}

?>
