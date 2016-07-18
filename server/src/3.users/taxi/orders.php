<?php
/*
 * Order messages for taxi.
 */

init( function()
{
	$NS = 'taxi_orders::';

	add_cmdfunc( T_TAXI, 'create-order', $NS.'msg_create_order' );
	listen_events( null, EV_ORDER_SQUAD, $NS.'ev_order_squad' );
	add_cmdfunc( T_TAXI, 'taxi-login', $NS.'msg_taxi_login' );
	add_cmdfunc( T_TAXI, 'accept-order', $NS.'msg_accept_order' );
	add_cmdfunc( T_TAXI, 'cancel-order', $NS.'msg_cancel_order' );
	listen_events( null, EV_ORDER_CANCELLED, $NS.'ev_order_cancelled' );
	add_cmdfunc( T_TAXI, 'decline-order', $NS.'msg_decline_order' );
	add_cmdfunc( T_TAXI, 'notify-user', $NS.'msg_notify_user' );
	add_cmdfunc( T_TAXI, 'order-started', $NS.'msg_order_started' );
	add_cmdfunc( T_TAXI, 'order-finished', $NS.'msg_order_finished' );
	add_cmdfunc( T_TAXI, 'get-current-orders', $NS.'msg_get_current_orders' );
});

class taxi_orders
{
	static function msg_taxi_login( $message, $user )
	{
		if( $message->data( 'relogin' ) == '1' ) {
			return true;
		}

		$taxi_id = $user->id;
		return self::send_current_orders( $taxi_id )
			&& self::send_fares( $taxi_id );
	}

	static function msg_get_current_orders( $msg, $user )
	{
		return self::send_current_orders( $user->id );
	}

	private static function send_current_orders( $taxi_id )
	{
		/*
		 * Get all active orders for this taxi.
		 */
		$orders = self::get_current_orders( $taxi_id );

		/*
		 * Format the orders list for message.
		 */
		$list = array();
		foreach( $orders as $order ) {
			$list[] = self::order_message_data( $order );
		}

		$msg = new message( 'current-orders', array(
			'list' => $list
		));
		return send_to_taxi( $taxi_id, $msg );
	}

	private static function get_current_orders( $taxi_id )
	{
		$ids = DB::getValues( "
			SELECT order_id
			FROM taxi_orders
			WHERE taxi_id = %d
			AND `status` NOT IN ('dropped', 'cancelled', 'finished')",
			$taxi_id
		);

		$orders = array();
		foreach( $ids as $id ) {
			$orders[] = new order( $id, '*' );
		}
		return $orders;
	}

	private static function send_fares( $taxi_id )
	{
		$messages = self::get_fare_messages( $taxi_id );
		foreach( $messages as $m ) {
			if( !send_to_taxi( $taxi_id, $m ) ) {
				return false;
			}
		}
		return true;
	}

	private static function get_fare_messages( $taxi_id )
	{
		$messages = array();

		$car_id = driver_car_id( $taxi_id );
		$car = new car( $car_id, 'group_id' );

		$fares_r = DB::getRecords("
			SELECT fare_id, name,
				start_price,
				minimal_price,
				kilometer_price,
				slow_hour_price,
				location_type
			FROM taxi_car_group_fares
			JOIN taxi_fares USING (fare_id)
			WHERE group_id = %d", $car->group_id() );
		if( empty( $fares_r ) )
		{
			warning( "No fares for group ".$car->group_id() );
			send_text_to_taxi( $taxi_id,
				'Администратор не назначил вам тариф.' );
		}

		$fares = array();
		foreach( $fares_r as $fare )
		{
			$fares[] = array(
				'name' => $fare['name'],
				'fare_id' => $fare['fare_id'],
				'car_class' => 'ordinary',
				'fare_type' => $fare['location_type'],
				'start' => $fare['start_price'],
				'min' => $fare['minimal_price'],
				'moving' => $fare['kilometer_price'],
				'standing' => $fare['slow_hour_price']
			);
		}

		$messages[] = new message( 'fares', array(
			'list' => $fares
		));
		return $messages;
	}

	static function msg_decline_order( $message, $user )
	{
		$taxi_id = $user->id;
		$order_id = $message->data( 'order_id' );
		$reason = $message->data( 'reason' );

		logmsg( "#$taxi_id declines order #$order_id ($reason)", $user->sid, $user->id );

		if( !$order_id ) {
			driver_error( $message->cid, "Missing `order_id` field in decline-order" );
			return false;
		}
		if( !$reason ) {
			driver_error( $message->cid, "Missing `reason` field in decline-order" );
		}

		/*
		 * Print a message to the dispatchers.
		 */
		switch( $reason )
		{
			case 'driver':
				$log = '{t} отказался от {o`а}';
				break;
			case 'timeout':
				$log = '{t} не ответил на {o}';
				break;
			case 'busy':
			case 'full':
				$log = '{t} не может сейчас принять {o}';
				break;
			default:
				$log = "{t} отказался от {o`а} (код: $reason)";
		}
		service_log( $user->sid, $log, $taxi_id, $order_id );

		/*
		 * Remove the "busy" flag since the driver has dismissed the
		 * order dialog.
		 */
		set_driver_busy( $taxi_id, false );

		/*
		 * If there is no sending job for this driver, the sending
		 * has finished already, and we are dealing with a late message.
		 */
		$job = get_sending_job( $order_id );
		if( !$job ) {
			debmsg( "No sending job #$order_id in msg_decline_order" );
			return false;
		}
		$car = $job->get_car( $taxi_id );
		if( !$car ) {
			warning( "No taxi #$taxi_id for sending job #$order_id" );
			return false;
		}

		/*
		 * Update the sending job and let it proceed on its own.
		 */
		skip_taxi_sending( $order_id, $taxi_id, SKIP_DECLINED );

		self::penalize_decline( $car, $reason );
		return true;
	}

	private static function penalize_decline( $job_car, $reason )
	{
		if( $reason == 'busy' || $reason == 'full' ) {
			return;
		}

		$i = $job_car->get_data( 'importance' );
		if( !$i ) {
			return;
		}

		$taxi_id = $job_car->taxi_id;
		$sid = get_taxi_service( $taxi_id );
		logmsg( "Removing #$taxi_id from queues: important order declined.",
			$sid, $taxi_id );
		queue_remove( $taxi_id );
		queue_unsave( $taxi_id );
		self::warn_for_decline( $taxi_id );
	}

	private static function warn_for_decline( $taxi_id )
	{
		$remaining = add_ban_warning( $taxi_id );
		if( $remaining > 0 )
		{
			$remaining--;
			$msg = '';
			if( $remaining == 0 ) {
				$msg = "У вас больше не осталось отказов.";
			}
			else if( $remaining == 1 ) {
				$msg = "У вас остался один отказ.";
			}
			else if( $remaining == 2 ) {
				$msg = "У вас осталось два отказа.";
			}
			if( $msg ) {
				send_text_to_taxi( $taxi_id, $msg );
			}
		}
	}

	/*
	 * "accept-order" message.
	 */
	static function msg_accept_order( $message, $user )
	{
		$taxi_id = $user->id;
		$order_id = $message->data( 'order_id' );
		$arrival_time = $message->data( 'arrival_time_m' );

		logmsg( "#$taxi_id accepts order #$order_id", $user->sid, $user->id );

		if( !$order_id ) {
			driver_error( $message->cid, "missing `order_id` field in accept-order" );
			return false;
		}
		if( !$arrival_time ) {
			debmsg( "arrival_time_m not given, setting to 0." );
			$arrival_time = 0;
		}

		reset_ban_warnings( $taxi_id );

		/*
		 * Turn off the "driver is thinking" flag.
		 */
		set_driver_busy( $taxi_id, false );

		$message_data = array( 'order_id' => $order_id );
		if( !self::assign( $taxi_id, $order_id, $arrival_time ) )
		{
			debmsg( "Could not assign order #$order_id to taxi #$taxi_id", $user->sid, $user->id );
			$m = new message( 'order-gone', $message_data );
		}
		else
		{
			logmsg( "Order #$order_id has been assigned to #$taxi_id", $user->sid, $user->id );
			$m = new message( 'order-accepted', $message_data );
		}

		service_log( $user->sid, '{t} принял {o}', $user->id, $order_id );
		return send_to_taxi( $taxi_id, $m );
	}

	/*
	 * arrival_time is time from now to the arrival, in minutes.
	 */
	private static function assign( $taxi_id, $order_id, $arrival_time )
	{
		$car_id = driver_car_id( $taxi_id );

		/*
		 * Can't assign if car_id is null.
		 */
		if( !$car_id ) {
			warning( "#$taxi_id doesn't have a car" );
			return false;
		}

		$order = new order( $order_id, 'taxi_id' );
		/*
		 * Make sure the order hasn't been assigned to anyone already.
		 */
		if( $order->taxi_id() )
		{
			debmsg( "Order #$order_id is already assigned to taxi #". $order->taxi_id(), $order->service_id(), $taxi_id );
			return false;
		}

		$order->taxi_id( $taxi_id );
		$order->car_id( $car_id );
		$pos = get_taxi_position( $taxi_id );
		if( $pos )
		{
			$distance = mod_routes::get_road_distance(
				$pos->lat, $pos->lon,
				$order->latitude(), $order->longitude()
			);
			$order->arrival_distance( $distance );
		}

		$t = time() + $arrival_time * 60;
		$order->utc( 'est_arrival_time', $t );
		return order_states::assign( $order );
	}

	static function msg_notify_user( $message, $user )
	{
		$taxi_id = $user->id;
		$order_id = $message->data( 'order_id' );

		logmsg( "#$taxi_id has arrived for order #$order_id", $user->sid, $user->id );
		if( !self::driver_has_order( $taxi_id, $order_id ) ) {
			driver_error( $message->cid, "#$taxi_id doesn't have order #$order_id" );
			return false;
		}

		$order = new order( $order_id );
		return notify_order( $order );
	}

	static function msg_order_started( $message, $user )
	{
		$taxi_id = $user->id;
		$order_id = $message->data( 'order_id' );

		logmsg( "#$taxi_id starts order #$order_id", $user->sid, $user->id );
		if( !$order_id ) {
			return false;
		}

		if( !self::driver_has_order( $taxi_id, $order_id ) ) {
			driver_error( $message->cid, "#$taxi_id doesn't have order #$order_id" );
			return false;
		}

		$order = new order( $order_id );
		if( !start_order( $order ) ) {
			driver_error( $message->cid, "Denied transition to `started`" );
			return false;
		}

		service_log( $user->sid, '{t} начал {o}, GPS: {p}',
			$user->id, $order_id, $user->id );
		return true;
	}

	static function msg_order_finished( $message, $user )
	{
		$taxi_id = $user->id;
		$order_id = $message->data( 'order_id' );
		$price = $message->data('price');
		$stats = $message->data( 'stats' );

		logmsg( "#$taxi_id finishes order #$order_id", $user->sid, $user->id );
		if( !$order_id ) {
			return false;
		}

		if( !self::driver_has_order( $taxi_id, $order_id ) ) {
			driver_error( $message->cid, "Taxi #$taxi_id doesn't have order #$order_id" );
			return false;
		}

		$order = new order( $order_id );
		$order->price( $price );
		if( !finish_order( $order ) ) {
			driver_error( $message->cid, "Can't close order #$order_id" );
			return false;
		}

		service_log( $user->sid, '{t} завершил {o}, {p}, цена {?} руб.',
			$user->id, $order_id, $user->id, $price );

		/*
		 * Mark customer as valid.
		 */
		if( service_setting( $user->sid, 'mark_customers' ) )
		{
			$cid = $order->customer_id();
			if( $cid ) {
				$c = new customer( $cid );
				$c->is_valid( '1' );
				$c->save();
			}
		}

		if( !$stats ) {
			driver_error( $message->cid, "Missing order stats in order-finished" );
			return true;
		}

		if( !self::save_order_stats( $order_id, $stats ) ) {
			driver_error( $message->cid, "malformed order stats" );
		}

		return true;
	}

	/*
	 * Saves "stats" information about used fares, travelled distances
	 * and times for each used fare for the given order.
	 * $stats is an array of dicts {fare_id, distance, slow_time,
	 * total_time}.
	 */
	private static function save_order_stats( $order_id, $stats )
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

	/*
	 * "cancel-order" message. Doesn't send anything in response.
	 * If the order gets actually cancelled, the ev_order_cancelled
	 * listener will send a message.
	 */
	static function msg_cancel_order( $message, $user )
	{
		$taxi_id = $user->id;
		$order_id = $message->data( 'order_id' );
		$reason = alt( $message->data( 'reason' ), 'driver_cancel' );

		logmsg( "#$taxi_id cancels order #$order_id (reason=$reason)", $user->sid, $user->id );
		if( !self::driver_has_order( $taxi_id, $order_id ) ) {
			driver_error( $message->cid, "Taxi #$taxi_id doesn't have order #$order_id" );
			return false;
		}

		$order = new order( $order_id, '*' );

		/*
		 * If the order was published and there is time, we can publish
		 * it again.
		 */
		if( $order->published() && self::is_postponed( $order ) ) {
			logmsg( "#$taxi_id returns postponed order #$order_id", $user->sid, $user->id );
			return self::return_postponed_order( $order, $taxi_id );
		}

		$order->cancel_reason( $reason );
		if( !cancel_order( $order ) ) {
			driver_error( $message->cid, "Could not cancel order #$order_id" );
			return false;
		}

		if( $reason == 'no_customer' ) {
			$reason = 'клиент не вышел';
		}
		else if( $reason == 'bad_customer' ) {
			$reason = 'неадекватный клиент';
		}
		service_log( $user->sid, '{t} отменил {o} ({?})',
			$user->id, $order_id, $reason );

		return true;
	}

	/*
	 * Returns true if the given order may be returned and postponed
	 * again.
	 */
	private static function is_postponed( $order )
	{
		$t = $order->utc( 'exp_arrival_time' );
		$s = $order->status();
		return ($s == order_states::S_ASSIGNED
			&& $t && $t - time() > 300);
	}

	private static function return_postponed_order( $order, $taxi_id )
	{
		$order->taxi_id( null );
		$order->car_id( null );
		$order->est_arrival_time( null );
		$order->arrival_distance( null );
		/*
		 * Hack the status right here because transition
		 * assigned->postponed normally is not allowed.
		 */
		$order->status( 'dropped' );
		return postpone_order( $order );
	}

	/*
	 * "create-order": create a taximeter-triggered order.
	 */
	static function msg_create_order( $msg, $user )
	{
		$req_id = $msg->data( 'req_id' );
		$started = $msg->data( 'started' );
		$taxi_id = $user->id;

		logmsg( "#$taxi_id creates a new order", $user->sid, $user->id );

		$error = '';
		$order = self::create_taxi_order( $taxi_id, $started, $error );
		if( !$order ) {
			logmsg( "Order for #$taxi_id not created: $error", $user->sid, $user->id );
			write_message( $msg->cid, new message( 'order-failed', array(
				'req_id' => $req_id,
				'reason' => $error
			)));
			return false;
		}

		service_log( $user->sid, '{t} создал {O}', $taxi_id, $order );

		write_message( $msg->cid, new message( 'order-created', array(
			'req_id' => $req_id,
			'order' => self::order_message_data( $order )
		)));
	}

	/*
	 * Create an order for the taxi. The taxi and its location are
	 * assigned to the order. The order is returned unsaved.
	 */
	private static function create_taxi_order( $taxi_id, $start, &$error )
	{
		$sid = get_taxi_service( $taxi_id );

		if( !service_setting( $sid, 'driver_orders' ) ) {
			$error = 'disabled';
			return null;
		}

		if( session_needed( $taxi_id ) ) {
			$error = 'no_session';
			return null;
		}

		$pos = get_taxi_position( $taxi_id );
		if( !$pos ) {
			$error = 'no_coordinates';
			return null;
		}
		$lat = $pos->lat;
		$lon = $pos->lon;

		$car_id = driver_car_id( $taxi_id );

		$order = new order();
		$order->service_id( $sid );
		$order->owner_id( $taxi_id );
		$order->taxi_id( $taxi_id );
		$order->car_id( $car_id );
		$order->latitude( $pos->lat );
		$order->longitude( $pos->lon );

		$address = point_address( $lat, $lon );
		if( $address ) {
			$order->src_addr( $address );
		}

		/*
		 * If the taxi is in a queue, check if the queue belongs to
		 * an object. If belongs, save the object in the order.
		 */
		$q = get_queue_position( $taxi_id );
		if( $q )
		{
			$qid = $q->qid;
			$loc_id = DB::getValue( "SELECT loc_id FROM taxi_queues
				WHERE queue_id = %d", $qid );
			$order->src_loc_id( $loc_id );
		}

		$error = 'unknown_error';

		if( !save_order( $order ) )
		{
			logmsg( "#$taxi_id: could not create the order", $user->sid, $taxi_id );
			return null;
		}

		/*
		 * Assign the order to the taxi.
		 */
		$order->taxi_id( $taxi_id );
		if( !assign_order( $order ) )
		{
			error( "Could not assign order" );
			return null;
		}

		if( $start )
		{
			if( !start_order( $order ) ) {
				return null;
			}
		}

		return $order;
	}

	/*
	 * EV_ORDER_SQUAD listener: send the order to current group.
	 */
	static function ev_order_squad( $event )
	{
		$job = $event->data['job'];
		$order_id = $job->order_id;
		$order = new order( $order_id, '*' );

		/*
		 * Get array of cars to send the message to.
		 */
		$group = $job->get_current_group();
		$timeout = $group->timeout;

		$msg = self::order_message( $order );
		foreach( $group->cars as $car ) {
			self::send_order( $order, $car, $msg, $timeout );
		}
	}

	private static function send_order( $order, $car, $msg, $timeout )
	{
		$taxi_id = $car->taxi_id;
		$order_id = $order->id();
		$sid = $order->service_id();

		/*
		 * Check that the driver will have enough time to decide.
		 */
		$lag = get_taxi_lag( $taxi_id );
		$lag = ceil( $lag / 1000 );
		if( $timeout - $lag < 4 ) {
			logmsg( "#$taxi_id has too big lag", $sid, $taxi_id );
			skip_taxi_sending( $order_id, $taxi_id, SKIP_OFFLINE );
			return;
		}

		$importance = alt( $car->get_data( 'importance' ), 0 );
		$distance = self::order_distance( $order, $taxi_id );
		if( !$distance ) {
			logmsg( "Could not get distance for #$taxi_id", $sid, $taxi_id );
		}

		logmsg( "Sending order $order to #$taxi_id (lag=$lag ms, importance=$importance)", $sid, $taxi_id );

		$msg->data( 'distance', $distance );
		$msg->data( 'timeout', $timeout - $lag );
		$msg->data( 'importance', $importance );

		if( !send_to_taxi( $taxi_id, $msg ) ) {
			logmsg( "Could not send to #$taxi_id", $sid, $taxi_id );
			skip_taxi_sending( $order_id, $taxi_id, SKIP_OFFLINE );
			return;
		}

		set_driver_busy( $taxi_id, true );
	}

	/*
	 * Returns road distance in meters from the driver to the order's
	 * location. Will return 0 if some coordinates are unknown or there
	 * is no known route between the two points.
	 */
	private static function order_distance( $order, $driver_id )
	{
		$pos = get_taxi_position( $driver_id );
		if( !$pos ) {
			$sid = get_taxi_service( $driver_id );
			logmsg( "No fresh position for #$driver_id", $sid, $driver_id );
			return 0;
		}

		return mod_routes::get_road_distance(
			$pos->lat, $pos->lon,
			$order->latitude(), $order->longitude()
		);
	}

	/*
	 * Create a "new-order" message from the given order.
	 */
	private static function order_message( $order )
	{
		$data = self::order_message_data( $order );
		return new message( 'new-order', $data );
	}

	private static function order_message_data( $order )
	{
		$customer_id = $order->customer_id();
		if( $customer_id ) {
			$customer = new customer( $customer_id, 'name, phone' );
			$customer_name = $customer->name();
			$customer_phone = $customer->phone();
		}
		else {
			$customer_name = $customer_phone = '';
		}

		$comments = $order->comments();

		$from_address = self::get_address_string( $order, 'from' );
		$to_address = self::get_address_string( $order, 'to' );

		$data = array(
			'order_id' => $order->id(),
			'importance' => 0,
			'latitude' => $order->latitude(),
			'longitude' => $order->longitude(),
			'from_address' => $from_address,
			'to_address' => $to_address,
			'comments' => $comments,
			'customer_phone' => $customer_phone,
			'customer_name' => $customer_name,
			'status' => $order->status(),
			'car_type' => alt( $order->opt_car_class(), "ordinary" )
		);

		return $data;
	}

	private static function get_address_string( $order, $type )
	{
		switch( $type ) {
			case 'from':
				$addr = $order->src_addr();
				$loc_id = $order->src_loc_id();
				break;
			case 'to':
				$addr = $order->dest_addr();
				$loc_id = $order->dest_loc_id();
				break;
			default:
				return '';
		}

		if( $loc_id ) {
			$name = DB::getValue( "SELECT name FROM taxi_locations
				WHERE loc_id = %d", $loc_id );
			$name = '«' . $name . '»';
			$addr .= " ($name)";
		}
		return $addr;
	}

	/*
	 * When an order is cancelled, notify the taxi.
	 */
	static function ev_order_cancelled( $event )
	{
		$order = $event->data['order'];
		$taxi_id = $order->taxi_id();
		if( !$taxi_id ) {
			return;
		}
		$order_id = $order->id();

		$m = new message( 'order-dropped',
			array( 'order_id' => $order_id ) );
		send_to_taxi( $taxi_id, $m, true );
	}

	private static function driver_has_order( $driver_id, $order_id )
	{
		$order = new order( $order_id, 'taxi_id' );
		return $order->taxi_id() == $driver_id;
	}
}
?>
