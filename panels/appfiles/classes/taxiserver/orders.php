<?php
class orders
{
	const T = 'taxi_orders';

	const STATUS_SEARCHING = 'searching';
	const STATUS_NO_CARS = 'no_cars';
	const STATUS_WAITING = 'waiting';
	const STATUS_REJECTED = 'rejected';
	const STATUS_DROPPED = 'dropped';
	const STATUS_ACCEPTED = 'accepted';

	const STATUS_CANCELLED = 'cancelled';
	const STATUS_STARTED = 'started';
	const STATUS_FINISHED = 'finished';

	const STATUS_POSTPONED = 'postponed';

	static $statuses = array(
		'searching' => 'Поиск автомобиля',
		'no_cars' => 'Нет автомобиля',
		'waiting' => 'Ожидание ответа',
		'rejected' => 'Отклонён',
		'accepted' => 'Принят водителем',
		'started' => 'Выполняется',
		'dropped' => 'Отменён',
		'finished' => 'Завершён',
		'cancelled' => 'Отменён',
		'postponed' => 'Отложен'
	);

	private static $final_statuses = array(
		self::STATUS_NO_CARS,
		self::STATUS_REJECTED,
		self::STATUS_DROPPED,
		self::STATUS_CANCELLED,
		self::STATUS_FINISHED
	);

	/*
	 * Standard cancel reasons that can be set by the server.
	 */
	private static $cancel_reasons = array(
		'no_customer' => 'Клиент не вышел',
		'bad_customer' => 'Неадекватный клиент',
		'dispatcher_timeout' => 'Потеря связи при заказе',
		'driver cancel' => 'Отменён водителем'
	);

	static function get_status_name( $status )
	{
		if( isset( self::$statuses[$status] ) ) {
			return self::$statuses[$status];
		} else {
			return $status;
		}
	}

	static function display_cancel_reason( $r ) {
		return array_alt( self::$cancel_reasons, $r, $r );
	}

	static function get_order_by_uid( $uid )
	{
		return DB::getValue( "SELECT order_id
			FROM taxi_orders
			WHERE order_uid = '%s'", $uid );
	}

	private static function is_datetime( $str )
	{
		return preg_match( '/^\d\d\d\d-\d\d-\d\d$/', $str );
	}

	/*
	 * Saves "stats" information about used fares, travelled distances
	 * and times for each used fare for the given order.
	 * $stats is an array of dicts {fare_id, distance, slow_time,
	 * total_time}.
	 */
	static function save_order_stats( $order_id, $stats )
	{
		if( !$order_id || !is_array( $stats ) || empty( $stats ) ) {
			return false;
		}
		$records = array();

		$params = array( 'fare_id', 'distance', 'slow_time',
			'total_time', 'total_distance' );
		foreach( $stats as $stat )
		{
			$rec = array(
				'order_id' => $order_id
			);
			foreach( $params as $p )
			{
				if( !isset( $stat[$p] ) || !is_numeric( $stat[$p] ) ) {
					warning( "Wrong order stats format" );
					return false;
				}
				$rec[$p] = $stat[$p];
			}

			$records[] = $rec;
		}
		return DB::insertRecords( 'taxi_order_stats', $records );
	}

	static function get_order_stats( $order_id )
	{
		return DB::getRecords( "SELECT * FROM taxi_order_stats
			WHERE order_id = %d", $order_id );
	}

	/*
	 * Mark given order as deleted.
	 */
	static function delete_order( $service_id, $order_id )
	{
		return DB::updateRecord( 'taxi_orders',
			array( 'deleted' => 1 ),
			array( 'service_id' => $service_id,
				'order_id' => $order_id )
		);
	}

	private static $columns = array(
		'order_id' => array( 'Номер', 'o.order_id' ),
		'type' => array( 'Источник', 'dispatcher.type' ),
		'date_created' => array( 'Дата создания',
			'UNIX_TIMESTAMP(o.time_created) AS date_created' ),
		'postpone_until' => array( 'Отложен до',
			'UNIX_TIMESTAMP(o.exp_arrival_time) AS postpone_until' ),
		'time_created' => array( 'Время создания',
			'UNIX_TIMESTAMP(o.time_created) AS time_created' ),
		'time_arrived' => array( 'Время прибытия',
			'UNIX_TIMESTAMP(o.time_arrived) AS time_arrived' ),
		'time_started' => array('Время начала',
			'UNIX_TIMESTAMP(o.time_started) AS time_started' ),
		'time_finished' => array('Время завершения',
			'UNIX_TIMESTAMP(o.time_finished) AS time_finished' ),
		'duration' => array( 'Время поездки по таксометру',
			's.total_time AS duration' ),
		'src_addr' => array( 'Адрес подачи', 'o.src_addr' ),
		'dest_addr' => array( 'Адрес назначения', 'o.dest_addr' ),
		'srcloc' => array( 'Объект', 'srcloc.name AS srcloc' ),
		'comments' => array( 'Комментарии', 'o.comments' ),
		'arrival_distance' => array( 'Расстояние до клиента', 'o.arrival_distance' ),
		'status' => array( 'Состояние', 'o.status' ),
		'cancel_reason' => array( 'Причина отмены', 'o.cancel_reason' ),
		'price' => array( 'Цена', 'o.price' ),
		'fare_name' => array( 'Название тарифа', 'f.name AS fare_name' ),
		'start_price' => array( 'Цена посадки', 'f.start_price' ),
		'mininal_price' => array( 'Минимальная цена', 'f.minimal_price' ),
		'kilometer_price' => array( 'Цена за километр', 'f.kilometer_price' ),
		'slow_hour_price' => array( 'Цена за час простоя', 'f.slow_hour_price' ),
		'driver' => array( 'Водитель', 'driver.call_id AS driver' ),
		'car' => array( 'Автомобиль', 'CONCAT(car.name, \', \', car.plate) AS car' ),
		'dispatcher' => array( 'Диспетчер', 'dispatcher.call_id AS dispatcher' ),
		'customer' => array( 'Клиент', 'customer.name AS customer' ),
		'coords' => array( 'Координаты', 'o.latitude, o.longitude' ),
		'options' => array( 'Опции поиска',
			'o.opt_vip, o.opt_terminal, o.opt_car_class' )
	);

	static function table( $service_id, $t1, $t2, $columns, $filter = array() )
	{
		$service_id = intval( $service_id );
		$t1 = intval( $t1 );
		$t2 = intval( $t2 );
		$dispatcher_id = array_alt( $filter, 'dispatcher_id', null );
		$driver_id = array_alt( $filter, 'driver_id', null );
		$status = array_alt( $filter, 'status', null );
		$src_loc_id = array_alt( $filter, 'src_loc_id', null );

		$select = array();
		$header = array();
		foreach( $columns as $name )
		{
			$desc = self::$columns[$name];
			$header[$name] = $desc[0];
			$select[] = $desc[1];
		}

		$where = array(
			"UNIX_TIMESTAMP(o.time_created) BETWEEN $t1 AND $t2",
			"o.service_id = $service_id"
		);
		$where[] = 'o.deleted = 0';
		if( $dispatcher_id ) {
			$where[] = "o.owner_id = $dispatcher_id";
		}
		if( $driver_id ) {
			$where[] = "driver.acc_id = $driver_id";
		}
		if( $status ) {
			$where[] = "o.status = '$status'";
		}
		if( $src_loc_id !== null ) {
			$where[] = "o.src_loc_id = $src_loc_id";
		}

		$q = "SELECT ".implode( ', ', $select )
		. " FROM taxi_orders o
		LEFT JOIN taxi_accounts dispatcher
			ON dispatcher.acc_id = o.owner_id
		LEFT JOIN taxi_accounts driver
			ON driver.acc_id = o.taxi_id
		LEFT JOIN taxi_cars car
			ON o.car_id = car.car_id
		LEFT JOIN taxi_customers customer
			ON o.customer_id = customer.customer_id
		LEFT JOIN taxi_order_stats s USING (order_id)
		LEFT JOIN taxi_fares f USING (fare_id)
		LEFT JOIN taxi_locations srcloc
			ON o.src_loc_id = srcloc.loc_id
		WHERE ".implode( ' AND ', $where )."
		ORDER BY o.time_created";

		$orders = DB::getRecords( $q );
		$times = array( 'time_created', 'time_arrived', 'time_started', 'time_finished' );

		$table = new table( $header );

		foreach( $orders as $i => $order )
		{
			foreach( $times as $k ) {
				if( isset( $order[$k] ) ) {
					$order[$k] = date( 'H:i', $order[$k] );
				}
			}

			if( isset( $order['date_created'] ) ) {
				$order['date_created'] = date( 'd.m.Y', $order['date_created'] );
			}

			if( isset( $order['arrival_distance'] ) ) {
				$km = $order['arrival_distance'] / 1000;
				$order['arrival_distance'] = $km ? str_replace( '.', ',', sprintf( '%.1f км', $km )) : '';
			}

			if( isset( $order['latitude'] ) ) {
				$order['coords'] = str_replace( '.', ',', sprintf( '%.7f; %.7f', $order['latitude'], $order['longitude'] ) );
				unset( $order['latitude'] );
				unset( $order['longitude'] );
			}

			if( array_key_exists( 'opt_vip', $order ) ) {
				$opts = array();
				if( $order['opt_vip'] == '1' ) $opts[] = 'V.I.P.';
				if( $order['opt_terminal'] == '1' ) $opts[] = 'терм.';
				if( $order['opt_car_class'] ) $opts[] = $order['opt_car_class'];
				unset( $order['opt_vip'] );
				unset( $order['opt_terminal'] );
				unset( $order['opt_car_class'] );
				$order['options'] = implode( ', ', $opts );
			}

			if( isset( $order['status'] ) ) {
				$order['status'] = orders::get_status_name( $order['status'] );
			}

			$table->add_row( $order );
		}
		return $table;
	}
}

?>
