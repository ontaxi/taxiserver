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

	static function addr_ranges( $qid )
	{
		return DB::getRecords( "
			SELECT range_id, city, street, min_house, max_house, parity
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
		$parity = $range->parity();
		if( !in_array( $parity, array( 'none', 'even', 'odd' ) ) ) {
			$parity = 'none';
		}
		$rid = intval( $range->id() );
		$sid = intval( $sid );

		/*
		 * Two address ranges overlap if they belong to the same
		 * service, have same city and street value, and their house
		 * number ranges overlap.
		 */

		/*
		 * For two number ranges [a1, a2] and [b1, b2], where a1 < a2
		 * and b1 < b2, there are nine possible configurations (consider
		 * (a1 <=> b1) and (a2 <=> b2) and their combinations). But
		 * only two of them are not overlapping, so it's much simpler
		 * to write these two non-overlapping cases and negate them.
		 *
		 * The non-overlapping case is:
		 * (r.max_house < $min) OR (r.min_house > $max).
		 */

		/*
		 * If we add parity to the ranges, then two ranges don't overlap
		 * if one is completely to the left or one is completely to the
		 * right or they both have different non-null parities.
		 * (r.max_house < $min) OR (r.min_house > $max)
		 * OR (r.parity <> 'none' AND $parity <> 'none' AND r.parity <> $parity).
		 */

		return DB::getRecords( "
		SELECT q.queue_id, q.name, r.min_house, r.max_house
		FROM taxi_queue_addresses r
		JOIN taxi_queues q
		WHERE
			-- ranges with the same city and street
			q.service_id = $sid
			AND r.city = '%s' AND r.street = '%s'
			AND r.range_id <> $rid

			-- house numbers overlap: negate non-overlapping
			AND NOT(
				-- ranges don't overlap
				(r.max_house < $min) OR (r.min_house > $max)
				-- or two parities are non-null and different
				OR (r.parity <> 'none' AND '$parity' <> 'none'
					AND r.parity <> '$parity')
			)",
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
