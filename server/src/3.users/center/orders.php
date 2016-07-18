<?php
/*
 * Orders reporting.
 */
init( function()
{
	$ns = 'master_orders::';
	add_cmdfunc( T_CENTER, 'update-orders', $ns.'msg_update_orders' );
	add_cmdfunc( T_CENTER, 'cancel-order', $ns.'msg_cancel_order' );
	listen_events( null, EV_ORDER_ARRIVED, $ns.'ev_order_status' );
	listen_events( null, EV_ORDER_STARTED, $ns.'ev_order_status' );
	listen_events( null, EV_ORDER_FINISHED, $ns.'ev_order_status' );
	listen_events( null, EV_ORDER_CANCELLED, $ns.'ev_order_status' );
	listen_events( null, EV_TAXI_POSITION, $ns.'ev_taxi_position' );
});

class master_orders
{
	static function msg_update_orders( $msg, $user )
	{
		/*
		 * Extract the given list into a map.
		 */
		$known = array();
		$list = $msg->data( 'list' );
		foreach( $list as $obj ) {
			$uid = $obj['uid'];
			$status = $obj['status'];
			if( !$uid ) {
				continue;
			}
			$known[$uid] = $status;
		}

		/*
		 * Send the updates.
		 */
		$list = self::updates_list( $known );
		$data = array( 'list' => $list );
		return write_message( $msg->cid, new message( 'orders-update', $data ) );
	}

	private static function updates_list( $known )
	{
		$list = array();
		if( empty( $known ) ) {
			return $list;
		}

		$where = DB::buildCondition( array(
			'order_uid' => array_keys( $known ) ));
		$arr = DB::getRecords( "SELECT order_uid, `status`
			FROM taxi_orders WHERE $where" );
		foreach( $arr as $row )
		{
			$uid = $row['order_uid'];
			$status = $row['status'];
			/*
			 * If the status hasn't changed, skip it.
			 */
			if( $known[$uid] == $status ) {
				continue;
			}
			$list[] = array( 'uid' => $uid, 'status' => $status );
		}
		return $list;
	}

	static function ev_order_status( $event )
	{
		$order = $event->data['order'];
		$user = self::get_order_center( $order );
		if( !$user ) {
			return;
		}

		$data = array(
			'uid' => $order->order_uid(),
			'status' => $order->status()
		);
		send_message( $user, new message( 'order-status', $data ) );
	}

	static function ev_taxi_position( $event )
	{
		$driver_id = $event->data['taxi_id'];
		$sid = $event->sid;
		$pos = $event->data['pos'];

		/*
		 * Get related orders and center server identifiers.
		 * owner_id will be the center's account_id.
		 */
		$rows = DB::getRecords( "
			SELECT o.owner_id, o.order_uid
			FROM taxi_orders o
			JOIN taxi_accounts acc
			WHERE o.taxi_id = %d
			AND o.`status` IN ('assigned', 'arrived')
			AND acc.type = 'center'",
			$driver_id );

		foreach( $rows as $r )
		{
			$user = new conn_user( T_CENTER, $r['owner_id'], $sid );
			$data = array(
				'uid' => $r['order_uid'],
				'latitude' => $pos->lat,
				'longitude' => $pos->lon
			);
			send_message( $user, new message( 'car-position', $data ) );
		}
	}

	private static function get_order_center( $order )
	{
		$acc_id = $order->owner_id();
		if( !$acc_id ) {
			return null;
		}
		$type = taxi_accounts::get_type( $acc_id );
		if( $type != T_CENTER ) {
			return null;
		}
		return new conn_user( T_CENTER, $acc_id, $order->service_id() );
	}

	static function msg_cancel_order( $msg, $user )
	{
		$uid = $msg->data( 'uid' );
		logmsg( "Center cancels order $uid", $user->sid, $user->id );

		$order_id = DB::getValue( "SELECT order_id FROM taxi_orders
		WHERE order_uid = '%s' AND owner_id = %d", $uid, $user->id );
		if( !$order_id ) {
			logmsg( "No such order", $user->sid, $user->id );
			return false;
		}

		$order = new order( $order_id );
		return cancel_order( $order );
	}
}

?>
