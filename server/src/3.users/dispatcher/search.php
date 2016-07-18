<?php

class disp_search
{
	/*
	 * Receives an order and returns a "squad" of cars.
	 */
	static function find_cars( $order )
	{
		/*
		 * Run the search and get the "squad".
		 */
		$sid = $order->service_id();
		logmsg( "Searching cars for $order", $sid );

		$squad = new cars_squad( $order->id() );

		/*
		 * If location is defined, use the location search mode.
		 * Otherwise use the regular search mode.
		 */
		$loc_id = $order->src_loc_id();
		if( $loc_id ) {
			logmsg( "Location-specific search", $sid );
			self::loc_search( $order, $squad, $loc_id );
		}
		else {
			logmsg( "Non-location search", $sid );
			self::nonloc_search( $order, $squad );
		}

		/*
		 * Pile nearby cars on top of what has been found.
		 */
		logmsg( "Nearby search", $sid );
		area_search( $order, $squad );

		$n = $squad->get_cars_number();
		logmsg( "Cars found: $n", $sid );
		return $squad;
	}

	private static function loc_search( $order, $squad, $loc_id )
	{
		$sid = $order->service_id();

		/*
		 * If there is a special queue, use it first.
		 */
		$qid = DB::getValue( "SELECT queue_id FROM taxi_queues
			WHERE loc_id = %d", $loc_id );
		if( $qid )
		{
			logmsg( "Using special queue #$qid", $sid );
			/*
			 * If the queue is a part of a queue group, use group mode.
			 * Otherwise use the reqular queue mode.
			 */
			$upstream = self::upstream_queue( $qid );
			if( $upstream ) {
				self::use_queue_group( $order, $squad, $upstream, $qid );
			}
			else {
				self::use_queue( $order, $squad, $qid );
			}
		}

		/*
		 * Apply the location's send program.
		 */
		disp_search_loc::search( $order, $squad, $loc_id );
	}

	private static function nonloc_search( $order, $squad )
	{
		$sid = $order->service_id();
		$qid = self::address_queue( $order );
		if( !$qid ) {
			$qid = self::nearby_queue( $order );
		}
		if( !$qid ) {
			logmsg( "No queue for order #" . $order->id(), $sid );
			return;
		}
		logmsg( "Using queue $qid for order #" . $order->id(), $sid );
		self::use_queue( $order, $squad, $qid );
	}

	//--

	/*
	 * Finds a queue for the order by address.
	 */
	private static function address_queue( $order )
	{
		$sid = $order->service_id();
		$addr = parse_address( $order->src_addr() );
		if( !$addr ) {
			warning( "Could not parse order address: ".$order->src_addr() );
			return null;
		}
		$place = $addr['place'];
		$street = $addr['street'];
		$house_int = intval( $addr['house'] );
		if( !$house_int ) {
			logmsg( "No house number given, can't find by address ranges",
				$sid );
		}

		/*
		 * The numbers range must contain the number and must also have
		 * the necessary parity (or 'none').
		 */
		$parity = ($house_int % 2 == 0) ? 'even' : 'odd';

		return DB::getValue( "
			SELECT
				q.queue_id
			FROM
				taxi_queue_addresses a
				JOIN taxi_queues q USING (queue_id)
			WHERE
				q.service_id = %d

				-- same city and street
				AND a.city = '%s'
				AND a.street = '%s'

				-- numbers range fits
				AND (%d BETWEEN a.min_house AND a.max_house
					AND (a.parity = 'none' OR a.parity = '$parity')
				)
				",
			$sid, $place, $street, $house_int
		);
	}

	/*
	 * Finds a queue for the order by coordinates.
	 */
	private static function nearby_queue( $order )
	{
		/*
		 * If no coordinates, can't search queues.
		 */
		if( !$order->latitude() ) {
			debmsg( "No coordinates, can't search queues." );
			return null;
		}
		$lat = $order->latitude();
		$lon = $order->longitude();

		$sid = $order->service_id();

		$near = array();
		$Q = DB::getRecords(
			"SELECT queue_id, latitude, longitude, radius
			FROM taxi_queues
			WHERE service_id = %d
			AND radius > 0", $sid );
		foreach( $Q as $i => $q )
		{
			$d = haversine_distance( $q['latitude'], $q['longitude'], $lat, $lon );
			if( $d > $q['radius'] ) {
				continue;
			}
			$near[] = array(
				'queue_id' => $q['queue_id'],
				'distance' => $d
			);
			debmsg( "Possible queue: $q[queue_id] ($d m)" );
		}

		if( empty( $near ) ) {
			return null;
		}

		if( count( $near ) > 1 ) {
			column_sort( $near, 'distance' );
		}
		$qid = $near[0]['queue_id'];
		debmsg( "Returning queue $qid" );
		return $qid;
	}

	private static function use_queue( $order, $squad, $qid )
	{
		$sid = $order->service_id();

		/*
		 * Get no more than N cars sequentially, where N is a service
		 * setting.
		 */
		$n = intval( service_setting( $sid, 'queue_drivers' ) );
		if( !$n ) return;

		$except = $squad->get_cars_list();
		$qs = new queue_stream( $qid, $order, $except );
		$cars = $qs->get_cars( $n );

		/*
		 * Add the cars sequentially, setting importance to 1.
		 */
		$timeout = service_setting( $sid, 'accept_timeout' );
		foreach( $cars as $car ) {
			$car['importance'] = 1;
			$squad->add_car( $car, $timeout );
		}
	}

	/*
	 * Returns upstream queue for the queue specified by the given id.
	 * Returns the specified queue if it is the upstream.
	 * Returns null if the queue is not in a queue group.
	 */
	private static function upstream_queue( $qid )
	{
		$q = DB::getRecord( "
			SELECT queue_id, upstream, parent_id, `mode`
			FROM taxi_queues
			WHERE queue_id = %d",
			$qid
		);

		if( $q['upstream'] ) {
			return $q;
		}

		$q = DB::getRecord( "
			SELECT queue_id, upstream, parent_id, `mode`
			FROM taxi_queues
			WHERE queue_id = %d",
			$q['parent_id']
		);

		return $q;
	}

	private static function use_queue_group( $order, $squad, $upstream, $qid )
	{
		$sid = $order->service_id();

		/*
		 * Get all queues in the group.
		 */
		$up_id = intval( $upstream['queue_id'] );
		$group = DB::getValues( "
			SELECT queue_id
			FROM taxi_queues
			WHERE parent_id = $up_id
				OR queue_id = $up_id
			ORDER BY parent_id DESC, priority
		");

		/*
		 * If the mode is 'found_first', move $qid to top of the list.
		 */
		if( $upstream['mode'] == 'found_first' ) {
			$pos = array_search( $qid, $group );
			if( $pos === false ) {
				error( "No id '$qid' in queues list at ::queue_group( $qid )" );
				return $list;
			}
			array_splice( $group, $pos, 1 );
			array_unshift( $group, $qid );
		}

		logmsg( "Group queues: " . implode( ',', $group ), $sid );

		$timeout = service_setting( $sid, 'accept_timeout' );
		$n = intval( service_setting( $sid, 'queue_drivers' ) );
		foreach( $group as $qid )
		{
			debmsg( "Trying queue #$qid" );
			$s = new queue_stream( $qid, $order );
			while( $car = $s->get_car() ) {
				$car['importance'] = 2;
				$squad->add_car( $car, $timeout );
				$n--;
				if( $n == 0 ) break;
			}
			if( $n == 0 ) break;
		}
	}
}

?>
