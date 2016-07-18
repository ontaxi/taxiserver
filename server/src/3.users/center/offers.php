<?php
/*
 * Creating and fulfilling offers.
 */

$ns = 'master_offers::';
listen_events( null, EV_ORDER_ASSIGNED, $ns.'ev_order_assigned' );
listen_events( null, EV_SENDING_FINISHED, $ns.'ev_sending_finished' );
add_cmdfunc( T_CENTER, 'get-car-offers', $ns.'msg_get_car_offers' );
add_cmdfunc( T_CENTER, 'take-offer', $ns.'msg_take_offer' );

class master_offers
{
	/*
	 * "get-car-offers" message: create and send a list of offers.
	 */
	static function msg_get_car_offers( $msg, $user )
	{
		$req_id = $msg->data( 'request_id' );
		$ref = array( $user->id, $req_id );
		logmsg( "Offers request", $user->sid, $user->id );

		$order = self::get_request_order( $msg, $user );
		$list = self::get_offers_list( $order, $user );
		$data = array(
			'request_id' => $req_id,
			'list' => $list
		);
		logmsg( "Returning ".count($list)." offers",
			$user->sid, $user->id );
		return write_message( $msg->cid, new message( 'car-offers', $data ) );
	}

	private static function get_request_order( $msg, $user )
	{
		$req_id = $msg->data( 'request_id' );
		$lat = $msg->data( 'latitude' );
		$lon = $msg->data( 'longitude' );
		$vip = $msg->data( 'opt_vip' );
		$car_type = $msg->data( 'car_type' );
		/*
		 * To use the search function we have to create an order
		 * object.
		 */
		$order = new order();
		$order->owner_id( $user->id );
		$order->service_id( $user->sid );
		$order->latitude( $lat );
		$order->longitude( $lon );
		$order->opt_vip( $vip );
		$order->opt_car_class( $car_type );
		return $order;
	}

	private static function get_offers_list( $order, $user )
	{
		/*
		 * Find cars near the order.
		 */
		$cars = nearby_cars( $order, 6000, 5 );

		$list = array();
		$now = time();
		foreach( $cars as $driver )
		{
			$driver_id = $driver['taxi_id'];
			/*
			 * Get the car's position. If no position or it is too
			 * old, skip the car.
			 */
			$pos = get_taxi_position( $driver_id );
			if( !$pos || $now - $pos->t > 600 ) {
				logmsg( "#$driver_id: unknown or invalid position",
					$user->sid, $user->id );
				continue;
			}

			logmsg( "Adding #$driver_id to the offers",
				$user->sid, $user->id );

			$offer = new offer( $order, $driver_id, $user );
			$offer_id = offers::add( $offer );
			$list[] = array(
				'offer_id' => $offer_id,
				'latitude' => $pos->lat,
				'longitude' => $pos->lon
			);
		}
		return $list;
	}

	/*
	 * "take-offer" message: dispatch the order to the offered driver.
	 */
	static function msg_take_offer( $msg, $user )
	{
		$off_id = $msg->data( 'offer_id' );
		if( !self::fulfil_offer( $msg, $user ) ) {
			$data = array( 'offer_id' => $off_id );
			return write_message( $msg->cid, new message( 'offer-failed', $data ) );
		}
	}

	private static function fulfil_offer( $msg, $user )
	{
		$off_id = $msg->data( 'offer_id' );
		$deadline = $msg->data( 'deadline' );

		/*
		 * Get the offer.
		 */
		logmsg( "Center takes offer $off_id", $user->sid, $user->id );
		$off = offers::get( $off_id );
		if( !$off ) {
			logmsg( "No offer $off_id", $user->sid, $user->id );
			return false;
		}

		/*
		 * Calculate driver timeout.
		 */
		$driver_id = $off->driver_id;
		$lag = get_taxi_lag( $driver_id );
		$timeout = $deadline - time() - intval($lag / 1000);
		if( $timeout < 10 ) {
			logmsg( "Can't fulfil offer $off_id: not enough time",
				$user->sid, $user->id );
			return false;
		}

		/*
		 * Add new data to the order.
		 */
		$order = $off->order;
		$order->owner_id( $user->id );
		$order->order_uid( $msg->data( 'order_uid' ) );

		$addr = write_address( array(
			'place' => $msg->data( 'address_place' ),
			'street' => $msg->data( 'address_street' ),
			'house' => $msg->data( 'address_house' ),
			'building' => $msg->data( 'address_building' ),
			'entrance' => $msg->data( 'address_entrance' )
		));
		$order->src_addr( $addr );
		$order->comments( $msg->data( 'comments' ) );

		/*
		 * Add customer id, creating the customer record if needed.
		 */
		$phone = $msg->data( 'customer_phone' );
		$name = $msg->data( 'customer_name' );
		$customer_id = get_customer_id( $user->sid, $phone, $name );
		$order->customer_id( $customer_id );

		/*
		 * Save the order.
		 */
		$order_id = save_order( $order );
		if( !$order_id ) {
			warning( "Couldn't save center's order" );
			return false;
		}
		service_log( $user->sid, 'Центр: {O}', $order );

		offers::assign( $off_id, $order_id );

		$job = new cars_squad();
		$car = array( 'taxi_id' => $driver_id );
		$job->add_car( $car, $timeout );

		wait_order( $order );
		send_order( $order, $job, 'drop_order' );
		return true;
	}

	static function ev_order_assigned( $event )
	{
		$order = $event->data['order'];
		$order_id = $order->id();
		$driver_id = $order->taxi_id();

		/*
		 * If this order is not connected with any center, return.
		 */
		$offer = offers::find( $order_id, $driver_id );
		if( !$offer ) {
			return;
		}

		/*
		 * Send offer result to the center.
		 */
		$user = $offer->user;
		$data = DB::getRecord( "SELECT
			car.name AS car_name,
			car.plate AS car_plate,
			car.color AS car_color,
			acc.name AS driver_name
			FROM taxi_accounts acc
			JOIN taxi_drivers USING (acc_id)
			JOIN taxi_cars car USING (car_id)
			WHERE acc_id = %d", $driver_id );
		$data['offer_id'] = $offer->id;
		$data['arrival_time'] = $order->utc( 'est_arrival_time' );
		if( !send_message( $user, new message( 'offer-ok', $data ) ) ) {
			return;
		}

		/*
		 * Send the driver's coordinates right away.
		 */
		$pos = get_taxi_position( $driver_id );
		if( !$pos ) {
			warning( "No coordinates for driver #$driver_id" );
			return;
		}
		$data = array(
			'uid' => $order->order_uid(),
			'latitude' => $pos->lat,
			'longitude' => $pos->lon
		);
		send_message( $user, new message( 'car-position', $data ) );
	}

	static function ev_sending_finished( $event )
	{
		$job = $event->data['job'];
		$drivers = $job->get_cars_list();
		if( count( $drivers ) != 1 ) {
			return;
		}
		$driver_id = $drivers[0];
		$order_id = $job->order_id;
		$offer = offers::find( $order_id, $driver_id );
		if( !$offer ) {
			return;
		}
		$user = $offer->user;

		$data = array( 'offer_id' => $offer->id );
		send_message( $user, new message( 'offer-failed', $data ) );
	}
}
?>
