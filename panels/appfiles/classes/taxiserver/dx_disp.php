<?php
class dx_disp
{
	const OFFLINE_TIMEOUT = 60;

	static function chat_messages( $sid, $driver_id, $from, $to )
	{
		$since = intval( $from );
		$until = intval( $to );
		$driver_id = intval( $driver_id );
		$sid = intval( $sid );

		if( !DB::getValue( "SELECT
			acc.type = 'driver' AND
			acc.service_id = $sid
			FROM taxi_accounts acc WHERE acc_id = $driver_id" ) ) {
			warning( "dx_disp::chat_messages: invalid driver id: $driver_id" );
			return null;
		}

		$r = DB::getRecords(
			"SELECT
				msg.msg_id AS id,
				msg.text,
				msg.to,
				msg.to_type,
				UNIX_TIMESTAMP(msg.t) AS utc,
				sender.acc_id AS `from`
			FROM taxi_chat msg
			JOIN taxi_accounts sender
				ON msg.from = sender.acc_id
			WHERE
				-- time period
				msg.t BETWEEN FROM_UNIXTIME($since) AND FROM_UNIXTIME($until)
				-- scope
				AND (
					-- from any dispatcher to the driver
					(sender.type = 'dispatcher' AND msg.to = $driver_id)
					-- or from the driver to all dispathers
					OR (sender.acc_id = $driver_id AND msg.to_type = 'dispatcher')
				)
			ORDER BY msg.t
			"
		);

		cast::table( $r, array(
			'int id',
			'str text',
			'int? to',
			'str? to_type',
			'int utc',
			'int from'
		));

		return $r;
	}

	static function fares( $sid )
	{
		$arr = DB::getRecords( "SELECT name, start_price, minimal_price,
			kilometer_price, slow_hour_price
			FROM taxi_fares
			WHERE service_id = %d
			AND deleted = 0", $sid );
		cast::table( $arr, array(
			'str name',
			'int start_price',
			'int minimal_price',
			'int kilometer_price',
			'int slow_hour_price'
		));
		return $arr;
	}

	static function get_online_service_taxis_r( $service_id )
	{
		$service_id = intval( $service_id );

		$q = "SELECT
			acc.acc_id AS taxi_id,
			acc.call_id,
			t.latitude,
			t.longitude,

			(NOT EXISTS (SELECT order_id
				FROM taxi_orders
				WHERE taxi_id = acc.acc_id
				AND `status` NOT IN ('cancelled', 'dropped', 'finished')
			)) AND accept_new_orders AS is_free,

			( IFNULL(
				TIMESTAMPDIFF( MINUTE, last_order_time, NOW() ),
				480)
			) AS idle_time,

			(block_until > NOW()) AS is_blocked,
			c.name AS car_name,
			c.plate AS car_plate

			FROM taxi_drivers t
			JOIN taxi_cars c USING (car_id)
			JOIN taxi_accounts acc USING (acc_id)
			WHERE acc.service_id = $service_id
			AND is_fake = 0
			AND (TIMESTAMPDIFF( SECOND, last_ping_time, NOW() ) < ".self::OFFLINE_TIMEOUT." )
			AND t.deleted = 0";

		return DB::getRecords( $q );
	}

	static function drivers( $service_id )
	{
		$drivers = DB::getRecords("
			SELECT
				acc.call_id,
				acc.work_phone AS phone,
				acc.name,
				acc.acc_id AS driver_id,
				d.group_id,
				d.type_id,
				d.car_id,
				d.is_fake,
				d.has_bank_terminal,
				d.is_online,
				UNIX_TIMESTAMP(d.block_until) AS block_until,
				d.block_reason,
				d.latitude,
				d.longitude,
				d.accept_new_orders = 0 AS is_busy
			FROM taxi_drivers d
			LEFT JOIN taxi_accounts acc USING (acc_id)
			WHERE acc.service_id = %d
			AND acc.deleted = 0
		", $service_id );
		cast::table( $drivers, array(
			'int driver_id',
			'int group_id',
			'int? type_id',
			'int? car_id',
			'int is_fake',
			'int has_bank_terminal',
			'int is_online',
			'int is_busy',
			'int? block_until',
			'flt latitude',
			'flt longitude'
		));
		return $drivers;
	}

	static function cars( $service_id )
	{
		$cars = taxi::cars_r( $service_id );
		cast::table( $cars, array(
			'int car_id',
			'str name',
			'str plate',
			'str body_type',
			'str color'
		));
		return $cars;
	}

	static function queues( $service_id, $acc_id )
	{
		$qlist = self::allowed_qlist( $acc_id );
		$queues = DB::getRecords( "
			SELECT DISTINCT
			q.queue_id,
			q.parent_id,
			q.name,
			q.`order`,
			q.priority,
			q.`min`,
			q.latitude,
			q.longitude,
			q.loc_id
			FROM taxi_queues q
			WHERE q.queue_id IN $qlist
			ORDER BY q.parent_id,
				IF(q.parent_id IS NULL, q.`order`, q.priority)"
		);

		/*
		 * For dispatchers restricted to a single location it is
		 * possible that there is a queue refering to an inaccessible
		 * parent queue. In that case, clear parent_id.
		 */
		$ids = array_column( $queues, 'queue_id' );
		foreach( $queues as $i => $q ) {
			$pid = $q['parent_id'];
			if( !$pid ) continue;
			if( !in_array( $pid, $ids ) ) {
				$queues[$i]['parent_id'] = null;
			}
		}

		cast::table( $queues, array(
			'int queue_id',
			'int parent_id',
			'str name',
			'int order',
			'int priority',
			'int min',
			'flt latitude',
			'flt longitude',
			'int? loc_id'
		));
		return $queues;
	}

	static function recent_orders( $service_id, $acc_id )
	{
		$service_id = intval( $service_id );
		$acc_id = intval( $acc_id );
		$loc_id = intval( DB::getValue( "SELECT loc_id FROM taxi_dispatchers
			WHERE acc_id = %d", $acc_id ) );
		$add_where = '';
		if( $loc_id ) {
			$add_where = " AND o.src_loc_id = $loc_id";
		}

		$orders = DB::getRecords("
			SELECT
				o.order_uid,
				o.order_id,
				o.owner_id,
				o.taxi_id,
				o.src_loc_id,
				o.dest_loc_id,
				o.src_addr,
				o.dest_addr,
				o.comments,
				o.status,
				o.cancel_reason,
				UNIX_TIMESTAMP( o.time_created ) AS time_created,
				UNIX_TIMESTAMP( o.exp_arrival_time ) AS exp_arrival_time,
				UNIX_TIMESTAMP( o.reminder_time ) AS reminder_time,
				o.opt_vip,
				o.opt_terminal,
				o.opt_car_class,
				c.phone AS customer_phone,
				c.name AS customer_name
			FROM taxi_orders o
			LEFT JOIN taxi_customers c ON c.customer_id = o.customer_id
			LEFT JOIN taxi_accounts disp
				ON o.owner_id = disp.acc_id
				AND disp.type = 'dispatcher'
			WHERE o.service_id = $service_id
			AND o.deleted = 0
			AND (
				(o.`status` IN ('postponed', 'waiting', 'assigned', 'arrived', 'started'))
				OR TIMESTAMPDIFF(HOUR, o.time_created, NOW()) <= 24
			)
			$add_where
			ORDER BY o.time_created DESC
			"
		);

		foreach( $orders as $i => $order )
		{
			$src_addr = parse_address( $order['src_addr'] );
			$order['src'] = array(
				'addr' => parse_address( $order['src_addr'] ),
				'loc_id' => $order['src_loc_id']
			);
			unset( $order['src_addr'] );
			unset( $order['src_loc_id'] );

			$order['dest'] = array(
				'addr' => parse_address( $order['dest_addr'] ),
				'loc_id' => $order['dest_loc_id']
			);

			unset( $order['dest_addr'] );
			unset( $order['dest_loc_id'] );

			$orders[$i] = $order;
		}
		cast::table( $orders, array(
			"str order_uid",
			"int owner_id",
			"int? taxi_id",
			"int time_created",
			"int? exp_arrival_time",
			"int? reminder_time",
			"str status",
			"str comments",
			"str customer_name",
			"str customer_phone",
			"str opt_car_class",
			"int opt_vip",
			"int opt_terminal"
		));
		return $orders;
	}

	static function queues_snapshot( $sid, $acc_id )
	{
		$q = "
			SELECT queue_id, driver_id, pos
			FROM taxi_queues q
			LEFT JOIN taxi_queue_drivers a
			USING (queue_id)
			WHERE q.service_id = $sid";
		$loc_id = self::acc_loc_id( $acc_id );
		if( $loc_id ) {
			$q .= " AND q.loc_id = $loc_id";
		}
		$q .= " ORDER BY pos";
		$rows = DB::getRecords( $q );

		$Q = array();
		foreach( $rows as $r )
		{
			$qid = $r['queue_id'];
			$id = $r['driver_id'];
			if( !isset( $Q[$qid] ) ) {
				$Q[$qid] = array(
					'queue_id' => $qid,
					'drivers' => array()
				);
			}
			if( !$id ) continue;
			$Q[$qid]['drivers'][] = $id;
		}

		return array_values( $Q );
	}

	private static function acc_loc_id( $acc_id )
	{
		return DB::getValue( "SELECT loc_id FROM taxi_dispatchers
			WHERE acc_id = %d", $acc_id );
	}

	static function queue_locations( $sid )
	{
		$locations = DB::getRecords( "
			SELECT
				loc.loc_id,
				loc.name,
				loc.address,
				loc.latitude,
				loc.longitude,
				loc.contact_phone,
				loc.contact_name,
				q.queue_id
			FROM taxi_queues q
			JOIN taxi_locations loc USING (loc_id)
			WHERE q.service_id = $sid" );
		return self::format_locations( $locations );
	}

	static function locations( $sid, $term )
	{
		$arr = DB::getRecords(
			"SELECT
				loc_id,
				name,
				latitude,
				longitude,
				contact_name,
				contact_phone,
				address,
				NULL AS queue_id
			FROM taxi_locations loc
			WHERE service_id = %d
			AND loc.deleted = 0
			AND name LIKE '%s%%'
			AND loc_id NOT IN (
				SELECT loc_id
				FROM taxi_queues
				WHERE service_id = %d
				AND loc_id IS NOT NULL)
			ORDER BY loc.name
			LIMIT 10", $sid, $term, $sid );
		return self::format_locations( $arr );
	}

	private static function format_locations( $locations )
	{
		foreach( $locations as $i => $loc )
		{
			cast::row( $loc, array(
				'int loc_id',
				'str name',
				'int? queue_id',
				'str contact_phone',
				'str contact_name',
				'flt latitude',
				'flt longitude'
			));
			$loc['addr'] = parse_address( $loc['address'] );
			$locations[$i] = $loc;
		}
		return $locations;
	}

	private static $qlist = array();

	private static function allowed_qlist( $acc_id )
	{
		$acc_id = intval( $acc_id );
		if( isset( self::$qlist[$acc_id] ) ) {
			return self::$qlist[$acc_id];
		}

		$allowed_queues = DB::getValues( "
			SELECT q.queue_id
			FROM taxi_accounts acc
			LEFT JOIN taxi_dispatchers d USING (acc_id)
			JOIN taxi_queues q USING (service_id)
			WHERE acc_id = $acc_id
				AND (q.loc_id = d.loc_id OR d.loc_id IS NULL)" );
/*
		$allowed_queues = DB::getValues( "
			SELECT DISTINCT q.queue_id
			FROM (
				-- queues for the dispatcher's location
				SELECT q.queue_id, q.parent_id
				FROM taxi_accounts acc
				LEFT JOIN taxi_dispatchers d USING (acc_id)
				JOIN taxi_queues q USING (service_id)
				WHERE acc_id = $acc_id
					AND (q.loc_id = d.loc_id OR d.loc_id IS NULL)
			) qloc
			-- go up one level and then back down
			-- to include queues-siblings
			JOIN taxi_queues qup
				ON qup.queue_id = qloc.queue_id OR qup.queue_id = qloc.parent_id
			JOIN taxi_queues q
				ON q.queue_id = qup.queue_id OR q.parent_id = qup.queue_id" );
*/
		$qlist = '('.implode( ', ', $allowed_queues ).')';
		self::$qlist[$acc_id] = $qlist;
		return $qlist;
	}

}

?>
