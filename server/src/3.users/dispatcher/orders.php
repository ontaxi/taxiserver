<?php
/*
 * Dispatcher messages for orders module.
 */
init( function()
{
	$NS = 'dispatcher_orders::';

	add_cmdfunc( T_DISPATCHER, 'save-order', $NS.'msg_save_order' );
	add_cmdfunc( T_DISPATCHER, 'send-order', $NS.'msg_send_order' );
	add_cmdfunc( T_DISPATCHER, 'cancel-order', $NS.'msg_cancel_order' );
	listen_events( null, EV_ORDER_SAVED, $NS.'ev_order_saved' );
	listen_events( null, EV_ORDER_DROPPED, $NS.'ev_order_dropped' );
	listen_events( null, EV_ORDER_ASSIGNED, $NS.'ev_order_assigned' );
	listen_events( null, EV_ORDER_ARRIVED, $NS.'ev_taxi_arrived' );
	listen_events( null, EV_ORDER_STARTED, $NS.'ev_order_started' );
	listen_events( null, EV_ORDER_FINISHED, $NS.'ev_order_finished' );
	listen_events( null, EV_ORDER_CANCELLED, $NS.'ev_order_cancelled' );
});

class dispatcher_orders
{
	const MIN_TIMEOUT = 5;

	static function msg_save_order( $msg, $user )
	{
		$uid = $msg->data( 'order_uid' );
		$exists = DB::exists( 'taxi_orders', array( 'order_uid' => $uid ) );
		if( $exists ) {
			$err = self::update_order( $msg, $user );
		}
		else {
			$err = self::create_order( $msg, $user );
		}

		return disp_error( $msg->cid, $err );
	}

	private static function update_order( $msg, $user )
	{
		$order = self::get_order( $msg, $user );
		if( !$order ) {
			return 'unknown_order';
		}
		self::append_data( $order, $msg, $user );
		if( !save_order( $order, $err ) ) {
			return $err;
		}
		return null;
	}

	private static function create_order( $msg, $user )
	{
		$order = new order();
		$order->service_id( $user->sid );
		$order->owner_id( $user->id );
		self::append_data( $order, $msg, $user );

		$order_id = save_order( $order, $err );
		if( !$order_id ) {
			return $err;
		}
		return null;
	}

	private static function append_data( $order, $msg, $user )
	{
		$data = array(
			'order_uid' => $msg->data( 'order_uid' ),
			'comments' => $msg->data( 'comments' ),
			'opt_car_class' => $msg->data( 'opt_car_class' ),
			'opt_vip' => $msg->data( 'opt_vip' ),
			'opt_terminal' => $msg->data( 'opt_terminal' ),
			'call_id' => $msg->data( 'call_id' )
		);
		foreach( $data as $k => $v ) {
			$order->$k( $v );
		}

		self::append_order_address( $order, $msg, $user );

		$dest = $msg->data( 'dest' );
		if( $dest ) {
			$addr = write_address( $dest['addr'] );
			$order->dest_addr( $addr );
			$order->dest_loc_id( $dest['loc_id'] );
		}

		/*
		 * Add customer id, creating the customer record if needed.
		 */
		$phone = $msg->data( 'customer_phone' );
		$name = $msg->data( 'customer_name' );
		$customer_id = get_customer_id(
			$order->service_id(), $phone, $name );
		$order->customer_id( $customer_id );

		$order->utc( 'reminder_time', $msg->data( 'reminder_time' ) );
		$order->utc( 'exp_arrival_time', $msg->data( 'exp_arrival_time' ) );
	}

	private static function append_order_address( $order, $msg, $user )
	{
		$src = $msg->data( 'src' );

		/*
		 * If the dispatcher is local, take their location's address
		 * and ignore the message data (which is expected to be empty
		 * anyway).
		 */
		$loc_id = DB::getValue( "SELECT loc_id FROM taxi_dispatchers WHERE acc_id = %d", $user->id );

		if( !$loc_id ) {
			$loc_id = $src['loc_id'];
		}

		if( $loc_id ) {
			$loc = new taxi_location( $loc_id, 'address, latitude, longitude' );
			$addr = $loc->address();
			$pos = array( $loc->latitude(), $loc->longitude() );
			if( !$pos[0] || !$pos[1] ) {
				warning( "Location #$loc_id doesn't have coordinates" );
			}
		}
		else {
			$addr = write_address( $src['addr'] );
			$pos = address_point( $addr );
			if( !$pos ) {
				$pos = array( null, null );
			}
		}

		$order->src_loc_id( $loc_id );
		$order->src_addr( $addr );
		if( $pos ) {
			$order->latitude( $pos[0] );
			$order->longitude( $pos[1] );
		}
	}

	static function msg_send_order( $msg, $user )
	{
		$order = self::get_order( $msg, $user );
		if( !$order ) {
			return disp_error( $msg->cid, "Unknown order" );
		}
		$driver_id = $msg->data( 'driver_id' );

		if( $driver_id )
		{
			logmsg( "Sending direct order $order to #$driver_id",
				$user->sid, $driver_id );
			service_log( $user->sid, '{d} отправил {O} {t`ю}',
				$user->id, $order, $driver_id );
			$ok = self::send_order_to_driver( $order, $driver_id );
		}
		else
		{
			logmsg( "Sending auto order $order", $user->sid );
			service_log( $user->sid, '{d} отправил {O}',
				$user->id, $order );
			$ok = self::send_order_auto( $order );
		}

		$err = null;
		if( !$ok ) {
			$err = "Could not dispatch the order";
		}
		return disp_error( $msg->cid, $err );
	}

	private static function send_order_to_driver( $order, $driver_id )
	{
		if( get_taxi_service( $driver_id ) != $order->service_id() ) {
			warning( "Taxi ownership mismatch" );
			return false;
		}

		if( session_needed( $driver_id ) ) {
			logmsg( "Can't send to #$driver_id: session needed",
				$order->service_id(), $driver_id );
			return false;
		}

		if( !wait_order( $order ) ) {
			return false;
		}

		$order_id = $order->id();
		$job = new cars_squad( $order_id );
		$car = array(
			'taxi_id' => $driver_id,
			'importance' => 2
		);
		$timeout = service_setting( $order->service_id(), 'accept_timeout' );
		if( !$timeout || $timeout < self::MIN_TIMEOUT ) {
			warning( "Invalid accept_timeout value ($timeout)" );
			$timeout = self::MIN_TIMEOUT;
		}
		$job->add_car( $car, $timeout );
		send_order( $order, $job, 'drop_order' );
		return true;
	}

	private static function send_order_auto( $order )
	{
		/*
		 * Move to the waiting state.
		 */
		if( !wait_order( $order ) ) {
			return false;
		}

		/*
		 * First send directly, then publish.
		 */
		$cars = disp_search::find_cars( $order );
		send_order( $order, $cars, function( $order ) {
			// sending finished, no one took the order.
			publish_order( $order, function( $order ) {
				// publishing timed out or wasn't possible.
				drop_order( $order );
			});
		});
		return true;
	}

	static function msg_cancel_order( $msg, $user )
	{
		$reason = $msg->data( 'reason' );
		$order = self::get_order( $msg, $user );
		if( !$order ) {
			disp_error( $msg->cid, "No order or ownership mismatch" );
			return false;
		}
		$order->cancel_reason( $reason );

		if( cancel_order( $order ) ) {
			$err = null;
			service_log( $user->sid, '{d} отменил {o}', $user->id, $order->id() );
		}
		else {
			$err = "Could not cancel order";
		}
		disp_error( $msg->cid, $err );
	}

	private static function get_order( $msg, $user )
	{
		$uid = $msg->data( 'order_uid' );
		$order_id = DB::getValue( "SELECT order_id
			FROM taxi_orders
			WHERE order_uid = '%s'
			AND service_id = %d", $uid, $user->sid );
		if( !$order_id ) {
			warning( "Unknown order (uid=$uid)" );
			return null;
		}
		return new order( $order_id, '*' );
	}

	static function ev_order_saved( $event )
	{
		$order = $event->data['order'];
		$order_id = $order->id();

		$id = $order->customer_id();
		if( $id ) {
			$c = new customer( $id, 'name, phone' );
			$customer_name = $c->name();
			$customer_phone = $c->phone();
		} else {
			$customer_name = '';
			$customer_phone = '';
		}

		$srcaddr = parse_address( $order->src_addr() );
		$dstaddr = parse_address( $order->dest_addr() );

		$data = array(
			'order_uid' => $order->order_uid(),
			'order_id' => $order_id,
			'time_created' => $order->utc( 'time_created' ),
			'exp_arrival_time' => $order->utc( 'exp_arrival_time' ),
			'reminder_time' => $order->utc( 'reminder_time' ),
			'status' => $order->status(),
			'comments' => $order->comments(),
			'owner_id' => $order->owner_id(),
			'taxi_id' => $order->taxi_id(),
			'src' => array(
				'addr' => $srcaddr,
				'loc_id' => $order->src_loc_id()
			),
			'dest' => array(
				'addr' => $dstaddr,
				'loc_id' => $order->dest_loc_id()
			),
			'customer_name' => $customer_name,
			'customer_phone' => $customer_phone,
			'opt_car_class' => $order->opt_car_class(),
			'opt_vip' => $order->opt_vip(),
			'opt_terminal' => $order->opt_terminal()
		);

		cast::row( $data, array(
			'order_uid' => 'str',
			'order_id' => 'int',
			'time_created' => 'int',
			'exp_arrival_time' => 'int',
			'reminder_time' => 'int',
			'status' => 'str',
			'comments' => 'str',
			'owner_id' => 'int',
			'taxi_id' => 'int?',
			'customer_name' => 'str',
			'customer_phone' => 'str',
			'opt_car_class' => 'str',
			'opt_vip' => 'int',
			'opt_terminal' => 'int'
		));

		disp_broadcast( $order->service_id(), $order->src_loc_id(),
			'order-created', $data );
		return true;
	}

	static function ev_order_dropped( $event )
	{
		$order = $event->data['order'];
		$data = array(
			'order_uid' => $order->order_uid()
		);
		disp_broadcast( $order->service_id(), $order->src_loc_id(),
			'order-dropped', $data );
	}

	static function ev_order_assigned( $event )
	{
		$order = $event->data['order'];

		$data = array(
			'order_uid' => $order->order_uid(),
			'driver_id' => $order->taxi_id(),
			'est_arrival_time' => $order->utc( 'est_arrival_time' )
		);

		disp_broadcast( $order->service_id(), $order->src_loc_id(),
			'order-accepted', $data );
	}

	static function ev_taxi_arrived( $event )
	{
		$order = $event->data['order'];
		$channel_id = $order->service_id();
		$data = array(
			'order_uid' => $order->order_uid()
		);
		disp_broadcast( $channel_id, $order->src_loc_id(),
			'taxi-arrived', $data );
	}

	static function ev_order_started( $event )
	{
		$order = $event->data['order'];
		$channel_id = $order->service_id();
		$data = array(
			'order_uid' => $order->order_uid()
		);
		disp_broadcast( $channel_id, $order->src_loc_id(),
			'order-started', $data );
	}

	static function ev_order_finished( $event )
	{
		$order = $event->data['order'];
		$channel_id = $order->service_id();
		$data = array(
			'order_uid' => $order->order_uid()
		);
		disp_broadcast( $channel_id, $order->src_loc_id(),
			'order-finished', $data );
	}

	static function ev_order_cancelled( $event )
	{
		$order = $event->data['order'];
		$channel_id = $order->service_id();
		$data = array(
			'order_uid' => $order->order_uid(),
			'reason' => $order->cancel_reason()
		);
		disp_broadcast( $channel_id, $order->src_loc_id(),
			'order-cancelled', $data );
	}
}
?>
