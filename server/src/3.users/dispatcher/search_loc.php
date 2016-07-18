<?php

class disp_search_loc
{
	static function search( $order, $squad, $loc_id )
	{
		$sid = $order->service_id();
		/*
		 * Apply dispatch rules specific to the location.
		 */
		$stages = DB::getRecords( "
			SELECT ref_type, ref_id, `mode`, importance
			FROM taxi_location_dispatches
			WHERE loc_id = %d
			ORDER BY `order",
			$loc_id
		);

		foreach( $stages as $i => $st )
		{
			$type = $st['ref_type'];
			$id = $st['ref_id'];
			$imp = $st['importance'];
			$mode = $st['mode'];
			logmsg( "Stage $i: $type($id), mode=$mode, imp=$imp", $sid );
			switch( $type )
			{
				case 'queue':
					self::use_queue( $order, $squad, $id, $mode, $imp );
					break;
				case 'brigade':
					self::use_brigade( $order, $squad, $id, $imp );
					break;
				case 'all':
					self::use_all( $order, $squad, $imp );
					break;
				default:
					warning( "Unknown dispatch type: $type" );
			}
		}
		logmsg( "Stages done", $sid );
	}

	private static function use_queue( $order, $squad, $qid, $mode, $imp )
	{
		$sid = $order->service_id();
		$timeout = service_setting( $sid, 'accept_timeout' );

		/*
		 * Get cars from the queue.
		 */
		$qs = new queue_stream( $qid, $order );
		$n = ($mode == 'first' ? 1 : 100);
		$cars = $qs->get_cars( $n );
		$n = count( $cars );
		logmsg( "Adding $n cars", $sid );

		/*
		 * Add importance flag if needed.
		 */
		if( $imp ) {
			foreach( $cars as $i => $car ) {
				$cars[$i]['importance'] = $imp;
			}
		}

		/*
		 * Add the cars to the squad.
		 */
		if( !$mode ) {
			warning( "Queue mode not set, using 'parallel'." );
			$mode = 'parallel';
		}
		switch( $mode ) {
			case 'parallel':
				$squad->add_group( $cars, $timeout );
				break;
			case 'sequential':
				foreach( $cars as $car ) {
					$squad->add_car( $car, $timeout );
				}
				break;
			case 'first':
				$squad->add_group( $cars, $timeout );
				break;
			default:
				warning( "Unknown queue mode: $mode" );
		}
	}

	private static function use_brigade( $order, $squad, $brig_id, $imp )
	{
		$sid = $order->service_id();
		$timeout = service_setting( $sid, 'accept_timeout' );
		$brig_id = intval( $brig_id );

		$cond = taxi_search::order_conditions( $order );
		$S = DB::getRecords( "
			SELECT driver.acc_id AS taxi_id
			FROM taxi_drivers driver
			JOIN taxi_accounts acc USING (acc_id)
			JOIN taxi_cars car USING (car_id)
			WHERE $cond
			AND driver.group_id = $brig_id"
		);
		$cars = array();
		foreach( $S as $car )
		{
			$id = $car['taxi_id'];
			if( session_needed( $id ) ) {
				continue;
			}
			$car['importance'] = $imp;
			$cars[] = $car;
		}
		$n = count( $cars );
		logmsg( "Adding $n cars", $sid );
		$squad->add_group( $cars, $timeout );
	}

	private static function use_all( $order, $squad, $imp )
	{
		$sid = $order->service_id();
		$timeout = service_setting( $sid, 'accept_timeout' );

		$cond = taxi_search::order_conditions( $order );
		$S = DB::getRecords( "
			SELECT driver.acc_id AS taxi_id
			FROM taxi_drivers driver
			JOIN taxi_accounts acc USING (acc_id)
			JOIN taxi_cars car USING (car_id)
			WHERE $cond"
		);
		$cars = array();
		foreach( $S as $car )
		{
			$id = $car['taxi_id'];
			if( session_needed( $id ) ) {
				continue;
			}
			$car['importance'] = $imp;
			$cars[] = $car;
		}
		$n = count( $cars );
		logmsg( "Adding $n cars", $sid );
		$squad->add_group( $cars, $timeout );
	}
}

?>
