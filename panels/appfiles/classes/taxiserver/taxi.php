<?php
class taxi
{
	static $car_body_types = array(
		'sedan' => 'Седан',
		'estate' => 'Универсал',
		'hatchback' => 'Хетчбек',
		'minivan' => 'Минивен',
		'bus' => 'Автобус'
	);

	static $car_classes = array(
		'econom' => 'Эконом',
		'business' => 'Бизнес',
		'premium' => 'Премиум',
		'vip' => 'V. I. P.'
	);

	/*
	 * Returns cars that can be assigned to the given driver.
	 */
	static function driverless_cars_kv( $service_id, $driver_id )
	{
		$a = DB::getRecords( "
		SELECT c.car_id,
			CONCAT( c.name, ' (', c.plate, ')' ) AS display_name
			FROM taxi_cars c
				LEFT JOIN taxi_drivers d ON c.car_id = d.car_id
			WHERE c.service_id = %d
				AND (d.driver_id IS NULL OR d.driver_id = %d)
				AND c.deleted = 0
		", $service_id, $driver_id );
		return array_column( $a, 'display_name', 'car_id' );
	}

	static function parks( $service_id )
	{
		$R = DB::getRecords(
			"SELECT g.group_id, g.name
			FROM taxi_car_groups g
			WHERE g.service_id = %d
			GROUP BY group_id, g.name
			", $service_id
		);
		$map = array();
		foreach( $R as $r ) {
			$map[$r['group_id']] = $r;
		}
		return $map;
	}

	/*
	 * Returns a table of service cars.
	 */
	static function cars_r( $service_id )
	{
		return DB::getRecords("
			SELECT
				c.car_id,
				c.name,
				c.plate,
				c.group_id,
				c.body_type,
				c.color,
				c.class,
				acc.call_id AS driver_call_id,
				g.name AS group_name
			FROM taxi_cars c
			JOIN taxi_car_groups g USING (service_id, group_id)
			LEFT JOIN taxi_drivers d ON c.car_id = d.car_id
			LEFT JOIN taxi_accounts acc USING (acc_id)
			WHERE c.service_id = %d
			AND c.deleted = 0
			ORDER BY c.name", $service_id
		);
	}

	static function delete_car( $service_id, $car_id )
	{
		DB::exec( "START TRANSACTION" );
		DB::exec( "UPDATE taxi_cars
			SET deleted = 1
			WHERE car_id = %d
			AND service_id = %d", $car_id, $service_id
		);
		/*
		 * Detach the driver from the car, if there is one.
		 */
		DB::exec( "UPDATE taxi_drivers
			SET car_id = NULL
			WHERE car_id = %d",
			$car_id, $service_id );
		DB::exec( "COMMIT" );
	}

	static function delete_taxi( $service_id, $taxi_id )
	{
		$set = array( 'deleted' => 1, 'acc_id' => null,
			'car_id' => null );
		$where = array( 'driver_id' => $taxi_id );
		return DB::updateRecord( 'taxi_drivers', $set, $where );
	}

	/*
	 * Returns a map of service drivers which don't have a car assigned.
	 */
	static function unseated_drivers_kv( $service_id, $car_id )
	{
		$a = DB::getRecords("
			SELECT d.driver_id,
				CONCAT(acc.call_id, ' - ', acc.name ) AS display_name
			FROM taxi_drivers d
			JOIN taxi_accounts acc USING (acc_id)
			WHERE acc.service_id = %d
				AND d.deleted = 0
				AND (d.car_id IS NULL OR d.car_id = %d)
				AND acc.deleted = 0
			ORDER BY acc.call_id
		", $service_id, $car_id );
		return array_column( $a, 'display_name', 'driver_id' );
	}

	/*
	 * Returns a map of service drivers.
	 */
	static function drivers_kv( $service_id )
	{
		$a = DB::getRecords("
			SELECT
				acc_id,
				CONCAT(call_id, ' - ', name) AS display_name
			FROM taxi_accounts
			WHERE service_id = %d
				AND deleted = 0
				AND `type` = 'driver'
			ORDER BY call_id
		", $service_id );
		return array_column( $a, 'display_name', 'acc_id' );
	}

	static function parks_kv( $service_id )
	{
		$a = DB::getRecords( "SELECT group_id, name FROM taxi_car_groups
		WHERE service_id = %d", $service_id );
		return array_column( $a, 'name', 'group_id' );
	}

	static function delete_park( $service_id, $group_id )
	{
		$group_id = intval( $group_id );
		$service_id = intval( $service_id );
		if( !$group_id || !$service_id ) return false;

		if( !DB::exists( 'taxi_car_groups', array(
			'group_id' => $group_id,
			'service_id' => $service_id
		))) {
			return false;
		}

		DB::exec( "START TRANSACTION" );

		// Detach deleted cars from the group
		DB::exec( "UPDATE taxi_cars
			SET group_id = NULL
			WHERE group_id = %d
				AND service_id = %d
			AND deleted = 1", $group_id, $service_id );

		// Remove associations from car_groups->fares relations.
		DB::exec( "DELETE FROM taxi_car_group_fares
			WHERE group_id = %d", $group_id );

		// Remove the group
		DB::exec( "DELETE FROM taxi_car_groups
			WHERE group_id = %d
			AND service_id = %d",
			$group_id, $service_id );

		DB::exec( "COMMIT" );
	}

	static function find_customers( $service_id, $name, $phone, $skip = 0, $count = 100 )
	{
		$service_id = intval( $service_id );

		$where = "service_id = $service_id";
		if( $name ) {
			$name = DB::escape( $name );
			$where .= " AND name LIKE '%%$name%%'";
		}
		if( $phone ) {
			$phone = DB::escape( $phone );
			$where .= " AND phone LIKE '%%$phone%%'";
		}

		return DB::getRecords("
			SELECT customer_id, phone, name, blacklist
			FROM taxi_customers
			WHERE $where
			ORDER BY phone
			LIMIT %d, %d", $skip, $count
		);
	}

	/*
	 * Returns orders of the given customer.
	 */
	static function customer_orders( $service_id, $customer_id, $skip = 0, $count = 100 )
	{
		return DB::getRecords( "SELECT
			o.src_addr,
			o.time_created,
			o.`status`,
			o.cancel_reason
			FROM taxi_orders o
			WHERE o.customer_id = %d
				AND o.service_id = %d
			ORDER BY o.time_created DESC
			LIMIT %d, %d",
			$customer_id, $service_id,
			$skip, $count
		);
	}
}

?>
