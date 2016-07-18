<?php
class taxi_queues
{
	/*
	 * Maximum number of queues in a group. Priorities must be unique
	 * in a group.
	 */
	const MAX_PRIORITIES = 10;

	/*
	 * Queues which belong to another "upstream" queue (by parent_id)
	 * must have unique priority (order) parameter. Whenever a queue
	 * with parent_id is edited, we call allocate_priority. $qid may
	 * also be null (which is a case when a new queue is created).
	 */
	static function allocate_priority( $parent_id, $priority, $qid )
	{
		if( $priority >= self::MAX_PRIORITIES || $priority < 0 ) {
			return false;
		}
		DB::exec( "START TRANSACTION" );

		// get list of queues
		$L = DB::getValues( "SELECT queue_id FROM taxi_queues
			WHERE parent_id = %d ORDER BY priority", $parent_id );

		// if qid is in the list, move it.
		$pos = array_search( $qid, $L );
		if( $pos !== false )
		{
			// Insert q into L at the given position.
			array_splice( $L, $pos, 1 );
			array_splice( $L, $priority, 0, $qid );
			// write L to the database
			foreach( $L as $i => $qid ) {
				DB::exec( "UPDATE taxi_queues SET priority = %d
					WHERE queue_id = %d", $i, $qid );
			}
		}
		else
		{
			if( count( $L ) >= self::MAX_PRIORITIES ) {
				DB::exec( "ROLLBACK" );
				return false;
			}

			/*
			 * Rewrite all the queues leaving the given priority
			 * free.
			 */
			$i = 0;
			$n = count( $L );
			while( $i < $n && $i < $priority ) {
				DB::exec( "UPDATE taxi_queues SET priority = %d
					WHERE queue_id = %d", $i, $L[$i] );
				$i++;
			}
			while( $i < $n ) {
				DB::exec( "UPDATE taxi_queues SET priority = %d
					WHERE queue_id = %d", $i + 1, $L[$i] );
				$i++;
			}
		}
		DB::exec( "COMMIT" );
		return true;
	}

	static function get_cars_to_clean( $timeout )
	{
		$timeout = intval( $timeout );
		$conditions = array(
			'offline' => "TIMESTAMPDIFF(SECOND, driver.last_ping_time, NOW()) > $timeout",
			'blocked' => 'driver.block_until > NOW()',
			'deleted' => 'driver.deleted = 1',
			'no_car' => 'driver.car_id IS NULL OR car.deleted = 1'
		);

		$select = array();
		$where = array();

		foreach( $conditions as $name => $cond )
		{
			$select[] = "$cond AS $name";
			$where[] = "($cond)";
		}

		return DB::getRecords("
			SELECT a.driver_id, ". implode( ", ", $select ) . "
			FROM taxi_queue_drivers a
			JOIN taxi_drivers driver
				ON a.driver_id = driver.acc_id
			LEFT JOIN taxi_cars car USING (car_id)
			WHERE (". implode( ' OR ', $where ) .")
			"
		);
	}

	/*
	 * Return array of cars currently in the given queue. The order is
	 * preserved.
	 */
	static function get_cars( $queue_id )
	{
		return DB::getValues( "
			SELECT driver_id FROM taxi_queue_drivers
			WHERE queue_id = $queue_id
			ORDER BY pos"
		);
	}

	/*
	 * Place given car at given position of given queue. First position
	 * is zero.
	 */
	static function set_car_position( $queue_id, $driver_id, $position )
	{
		$queue_id = intval( $queue_id );
		$driver_id = intval( $driver_id );
		$t = 'taxi_queue_drivers';

		DB::exec( "START TRANSACTION" );
		DB::exec( "DELETE FROM $t WHERE driver_id = $driver_id" );

		$row = DB::getValues( "
			SELECT driver_id FROM $t
			WHERE queue_id = $queue_id
			ORDER BY pos"
		);

		$n = count( $row );
		if( $position > $n ) {
			$row[] = $driver_id;
		} else {
			array_splice( $row, $position, 0, $driver_id );
		}

		DB::exec( "DELETE FROM $t WHERE queue_id = $queue_id" );

		$records = array();
		foreach( $row as $i => $car ) {
			$records[] = array(
				'queue_id' => $queue_id,
				'driver_id' => $car,
				'pos' => $i
			);
		}
		DB::insertRecords( $t, $records );
		DB::exec( "COMMIT" );
	}

	/*
	 * Add given car to the end of given queue.
	 */
	static function push_car( $queue_id, $driver_id )
	{
		$queue_id = intval( $queue_id );
		$driver_id = intval( $driver_id );

		DB::exec( "START TRANSACTION" );

		// Delete this car, if present
		DB::exec( "
		DELETE FROM taxi_queue_drivers
		WHERE driver_id = $driver_id" );

		// Get the next position value
		$pos = DB::getValue("
		SELECT MAX(pos) FROM taxi_queue_drivers
		WHERE queue_id = $queue_id");
		if( $pos ) $pos += 1;
		else $pos = 1;

		// Insert
		DB::exec( "
		INSERT INTO taxi_queue_drivers
			(queue_id, driver_id, pos)
		VALUES ($queue_id, $driver_id, $pos)
		");
		DB::exec( "COMMIT" );
	}

	/*
	 * Removes car from any queue.
	 */
	static function remove_car( $driver_id )
	{
		$driver_id = intval( $driver_id );
		return DB::exec( "
		DELETE FROM taxi_queue_drivers
		WHERE driver_id = $driver_id" );
	}

	/*
	 * Get position of a given car in a queue. Returns a tuple
	 * {queue_id, position, size} or null.
	 * Position starts from 1.
	 */
	static function get_car_position( $taxi_id )
	{
		$taxi_id = intval( $taxi_id );

		// Freeze our view
		DB::exec( "START TRANSACTION" );

		// What queue is the car in?
		$cpid = DB::getValue( "SELECT queue_id FROM taxi_queue_drivers
			WHERE driver_id = $taxi_id" );

		if( !$cpid ) {
			DB::exec( "ROLLBACK" ); // Or commit, doesn't matter.
			return null;
		}

		$cars = DB::getValues( "
			SELECT driver_id
			FROM taxi_queue_drivers
			WHERE queue_id = $cpid
			ORDER BY pos"
		);

		$size = count( $cars );
		$pos = -1;

		for( $i = 0; $i < $size; $i++ )
		{
			if( $cars[$i] == $taxi_id ) {
				$pos = $i + 1;
				break;
			}
		}

		DB::exec( "COMMIT" );

		if( !$size || !$pos ) {
			return null;
		}

		return array(
			'queue_id' => $cpid,
			'position' => $pos,
			'size' => $size
		);
	}

	static function addr_ranges( $qid )
	{
		return DB::getRecords( "
			SELECT range_id, city, street, min_house, max_house
			FROM taxi_queue_addresses
			WHERE queue_id = %d", $qid );
	}

	/*
	 * Returns information about ranges that overlap with the given
	 * range.
	 */
	static function get_overlapping_ranges( $sid, $range )
	{
		$min = intval( $range->min_house() );
		$max = intval( $range->max_house() );
		$rid = intval( $range->id() );
		$sid = intval( $sid );

		/*
		 * Two ranges overlap if they belong to the same service,
		 * have same city and street value, and their house number
		 * ranges overlap.
		 */

		return DB::getRecords( "
		SELECT q.queue_id, q.name, r.min_house, r.max_house
		FROM taxi_queue_addresses r
		JOIN taxi_queues q
		WHERE
			r.city = '%s' AND r.street = '%s'
			AND r.range_id <> $rid
			AND q.service_id = $sid
			AND NOT(r.min_house <= r.max_house
				AND r.max_house < $min AND $min <= $max)
			AND NOT ($min <= $max
				AND $max < r.min_house AND r.min_house <= r.max_house)",
			$range->city(), $range->street()
		);
	}

	static function delete_qaddr_range( $sid, $range_id )
	{
		$qsid = DB::getValue( "SELECT service_id
			FROM taxi_queue_addresses
			JOIN taxi_queues USING (queue_id)
			WHERE range_id = %d", $range_id );
		if( $qsid != $sid ) {
			warning( "Qaddr range ownership mismatch" );
			return false;
		}
		return DB::deleteRecord( 'taxi_queue_addresses', array(
			'range_id' => $range_id
		));
	}
}

?>
