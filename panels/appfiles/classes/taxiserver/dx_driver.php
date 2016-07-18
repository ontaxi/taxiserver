<?php
lib( 'cast' );
class dx_driver
{
	/*
	 * Returns orders from the pool for the given driver.
	 */
	static function pool_orders( $driver_id )
	{
		$driver_id = intval( $driver_id );
		$orders = DB::getRecords( "
			SELECT
				o.order_id,
				o.status,
				o.latitude,
				o.longitude,
				o.src_addr AS from_address,
				o.dest_addr AS to_address,
				o.comments,
				IFNULL(o.opt_car_class, 'ordinary') AS car_type,
				cust.phone AS customer_phone,
				cust.name AS customer_name,
				UNIX_TIMESTAMP(exp_assignment_time) AS assignment_time,
				UNIX_TIMESTAMP(exp_arrival_time) AS arrival_time
			FROM taxi_accounts acc
			JOIN taxi_orders o USING (service_id)
			LEFT JOIN taxi_customers cust USING (customer_id)
			WHERE acc_id = $driver_id
				AND acc.type = 'driver'
				AND o.`status` IN ('waiting', 'postponed')
				AND o.taxi_id IS NULL
				AND o.published" );
		cast::table( $orders, array(
			'int order_id',
			'str status',
			'flt latitude',
			'flt longitude',
			'str from_address',
			'str to_address',
			'str comments',
			'str car_type',
			'str customer_phone',
			'str customer_name',
			'int? assignment_time',
			'int? arrival_time'
		));

		return $orders;
	}
}

?>
