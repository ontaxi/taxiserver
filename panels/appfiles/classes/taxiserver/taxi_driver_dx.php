<?php

class taxi_driver_dx
{
	/*
	 * Returns driver lists in accessible queues.
	 * The format is special.
	 */
	static function queue_drivers( $driver_id )
	{
		$r = DB::getRecords("
			SELECT DISTINCT q2.queue_id, qd.pos, acc.call_id
			FROM taxi_drivers driver

			-- add assigned queues
			JOIN taxi_driver_group_queues dq
			USING (group_id)
			JOIN taxi_queues q
			USING (queue_id)

			-- add parent queues to the assigned queues
			JOIN taxi_queues q2
			ON q2.queue_id = q.queue_id
			OR q2.queue_id = q.parent_id

			-- add signed in drivers
			LEFT JOIN taxi_queue_drivers qd
			ON qd.queue_id = q2.queue_id

			-- add driver info
			LEFT JOIN taxi_accounts acc
			ON acc.acc_id = qd.driver_id

			WHERE driver.acc_id = %d
			ORDER BY q2.queue_id, qd.pos
		", $driver_id );

		$result = array();
		foreach( $r as $row )
		{
			$qid = $row['queue_id'];
			if( !isset( $result[$qid] ) ) {
				$result[$qid] = array();
			}
			if( $row['pos'] === null ) continue;
			$result[$qid][] = array( 'call_id' => $row['call_id'] );
		}

		$data = array();
		foreach( $result as $qid => $drivers )
		{
			$data[] = array(
				'checkpoint_id' => $qid,
				'drivers' => $drivers
			);
		}

		return $data;
	}
}

?>
