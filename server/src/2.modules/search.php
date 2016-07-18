<?php
/*
 * Searching and filtering cars.
 */


/*
 * Returns array of not more than $n cars for the given order. The cars
 * are searched in "radius" $r. Drivers in the array $except are
 * excluded.
 */
function nearby_cars( $order, $r, $n, $except = array() ) {
	return taxi_search::nearby_cars( $order, $r, $n, $except );
}

function area_search( $order, $squad )
{
	$sid = $order->service_id();
	$order_id = $order->id();

	$R = intval( service_setting( $sid, 'search_radius' ) );
	$N = intval( service_setting( $sid, 'search_number' ) );
	if( !$R || !$N ) {
		debmsg( "Area search disabled: R=$R, N=$N" );
		return;
	}

	$except = $squad->get_cars_list();
	$cars = nearby_cars( $order, $R, $N, $except );
	if( empty( $cars ) ) {
		logmsg( "No cars near order #$order_id", $sid );
		return;
	}

	logmsg( count( $cars ) . " cars near order #$order_id", $sid );

	$timeout = intval( service_setting( $sid, 'accept_timeout' ) );
	// TODO: define minimum timeout for drivers.
	if( $timeout < 4 ) {
		warning( "accept_timeout is too small ($timeout), increasing to 4" );
		$timeout = 4;
	}
	$squad->add_group( $cars, $timeout );
}

class taxi_search
{
	static function nearby_cars( $order, $r, $n, $except )
	{
		debmsg( "nearby_cars: r=$r, n=$n" );
		$r = intval( $r );
		$n = intval( $n );
		if( !$r || !$n ) {
			return array();
		}

		/*
		 * Determine search area.
		 */
		$lat = $order->latitude();
		$lon = $order->longitude();
		if( !$lat || !$lon ) {
			warning( "No coordinates for $order" );
			return array();
		}
		$delta = haversine_delta( $lat, $lon, $r, $r );

		/*
		 * Define a search filter by the order preferences, and also
		 * omitting the cars already in the squad.
		 */
		// hack to avoid empty list in the query.
		if( empty( $except ) ) {
			$except[] = -1;
		}
		$list = '('.implode( ', ', $except ).')';
		$cond = taxi_search::order_conditions( $order );

		/*
		 * Find the cars and add them to the squad.
		 */
		$r = DB::getRecords( "
			SELECT driver.acc_id AS taxi_id
			FROM taxi_drivers driver
			JOIN taxi_accounts acc USING (acc_id)
			JOIN taxi_cars car USING (car_id)
			WHERE $cond
			AND ABS(driver.latitude - $lat) < $delta[0]
			AND ABS(driver.longitude - $lon) < $delta[1]
			AND driver.acc_id NOT IN $list
			LIMIT $n"
		);

		/*
		 * Remove drivers which don't have a session.
		 */
		$cars = array();
		foreach( $r as $car )
		{
			if( session_needed( $car['taxi_id'] ) ) {
				debmsg( "$car[taxi_id]: no session" );
				continue;
			}
			$cars[] = $car;
		}

		return $cars;
	}
	/*
	 * Returns SQL conditions for the given order.
	 */
	static function order_conditions( $order )
	{
		$sid = intval( $order->service_id() );
		$where = array(
			/*
			 * Online
			 */
			'driver.is_online = 1',
			'TIMESTAMPDIFF(SECOND, driver.last_ping_time, NOW()) < 20',
			/*
			 * No current orders
			 */
			"NOT EXISTS (SELECT order_id FROM taxi_orders
				WHERE taxi_id = driver.acc_id
				AND status NOT IN('cancelled', 'finished', 'dropped'))",
			/*
			 * Can accept orders
			 */
			'driver.accept_new_orders',
			/*
			 * Not blocked
			 */
			'driver.block_until < NOW()',
			/*
			 * Service
			 */
			"acc.service_id = $sid"
		);

		/*
		 * V.I.P.
		 */
		if( $order->opt_vip() == '1' ) {
			$where[] = "car.class = 'vip'";
		}
		else if( $order->opt_vip() == '-1' ) {
			$where[] = "car.class <> 'vip'";
		}

		/*
		 * Body type
		 */
		$type = $order->opt_car_class();
		if( preg_match( '/[^a-z]/', $type ) ) {
			warning( "Invalid car type name: $type" );
			$type = '';
		}
		switch( $type )
		{
			case 'any':
			case 'ordinary':
				$where[] = "car.body_type IN ('sedan', 'hatchback', 'estate', 'minivan')";
				break;
			case '':
				break;
			default:
				$where[] = "car.body_type = '$type'";
		}

		/*
		 * Bank terminal
		 */
		if( $order->opt_terminal() == '1' ) {
			$where[] = 'driver.has_bank_terminal = 1';
		}

		return implode( ' AND ', $where );
	}
}

?>
