<?php
class fares
{
	const T = 'taxi_fares';

	/*
	 * Used by service panels for fares overview.
	 */
	static function get_service_fares( $service_id )
	{
		return DB::getValues( "
			SELECT fare_id
			FROM taxi_fares
			WHERE service_id = %d
			AND deleted = 0",
			$service_id
		);
	}

	/*
	 * Returns key-value pairs for service admin panel.
	 */
	static function get_service_fares_kv( $service_id )
	{
		$a = DB::getRecords("
			SELECT fare_id, name
			FROM taxi_fares
			WHERE service_id = %d
			AND deleted = 0",
			$service_id
		);
		return array_column( $a, 'name', 'fare_id' );
	}

	/*
	 * Returns list of fares associated with the given cars group.
	 */
	static function get_car_group_fares( $group_id, $service_id )
	{
		$a = DB::getValues( "SELECT fare_id
			FROM taxi_car_group_fares
			WHERE group_id = %d",
			$group_id
		);
		return $a;
	}

	/*
	 * Fallback fares in case service doesn't have any.
	 */
	static function get_default_fares_r()
	{
		return array(
			array (
			'name' => 'Стандартный',
			'fare_id' => '0',
			'minimal_price' => '30000',
			'start_price' => '12000',
			'kilometer_price' => '4000',
			'slow_hour_price' => '30000',
			'location_type' => 'city'
			),
			array (
				'name' => 'Стандартный загородный',
				'fare_id' => '0',
				'minimal_price' => '30000',
				'start_price' => '12000',
				'kilometer_price' => '4000',
				'slow_hour_price' => '30000',
				'location_type' => 'town'
			)
		);
	}

	/*
	 * Used by the server for "fares" message.
	 */
	static function get_car_group_fares_r( $group_id )
	{
		return DB::getRecords("
			SELECT fare_id, name,
				start_price,
				minimal_price,
				kilometer_price,
				slow_hour_price,
				location_type
			FROM taxi_car_group_fares
			JOIN taxi_fares USING (fare_id)
			WHERE group_id = %d", $group_id );
	}

	/*
	 * When a fare is edited, its old copy is marked deleted. This
	 * function has to replace references from the old fare to the new
	 * edited fare where needed.
	 */
	static function swap_fare( $old_id, $new_id )
	{
		DB::exec( "START TRANSACTION" );
		DB::exec( "UPDATE taxi_car_group_fares
			SET fare_id = %d
			WHERE fare_id = %d",
			$new_id, $old_id );
		DB::exec( "UPDATE taxi_fares
			SET deleted = 1
			WHERE fare_id = %d", $old_id );
		DB::exec( "COMMIT" );
	}

	/*
	 * Associate given list of fares with the given group.
	 */
	static function set_car_group_fares( $group_id, $fares )
	{
		$records = array();
		foreach( $fares as $id ) {
			$records[] = array(
				'group_id' => $group_id,
				'fare_id' => $id
			);
		}

		DB::exec( "START TRANSACTION" );
		DB::exec( "DELETE FROM taxi_car_group_fares WHERE group_id = %d",
			$group_id );
		DB::insertRecords( 'taxi_car_group_fares', $records );
		DB::exec( "COMMIT" );
	}

	static function delete_fare( $fare_id, $service_id )
	{
		DB::exec( "DELETE FROM taxi_car_group_fares
			WHERE fare_id = %d", $fare_id );

		return DB::updateRecord( 'taxi_fares',
			array( 'deleted' => 1 ),
			array(
			'fare_id' => $fare_id,
			'service_id' => $service_id
		));
	}
}

?>
