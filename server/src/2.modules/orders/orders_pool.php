<?php
/*
 * Publish the order in the pool.
 * Returns false if the order could not be published.
 */
function publish_order( $order, $callback ) {
	orders_pool::publish( $order, $callback );
}

class orders_pool
{
	static function publish( $order, $callback )
	{
		$sid = $order->service_id();

		if( !self::can_publish( $order ) ) {
			$callback( $order );
			return;
		}

		/*
		 * Publish and broadcast to drivers.
		 */
		$time = intval( service_setting( $sid, 'publish_duration' ) );
		if( $time < 5 ) {
			warning( "Publish duration is too small ($time), increasing." );
			$time = 5;
		}
		logmsg( "Publishing the order $order", $sid );
		$order->utc( 'exp_assignment_time', time() + $time );
		$order->published(1);
		$order->save();
		self::broadcast( $order );

		postpone( $time, function( $order, $callback ) {
			$order->refresh();
			if( $order->status() != 'waiting' ) {
				return;
			}
			$callback( $order );
		}, $order, $callback );
	}

	/*
	 * Returns true if the order can be published.
	 */
	private static function can_publish( $order )
	{
		$sid = $order->service_id();

		$loc_id = $order->src_loc_id();
		if( $loc_id ) $qid = DB::getValue( "SELECT queue_id FROM taxi_queues
			WHERE loc_id = %d", $loc_id );
		else $qid = 0;

		if( $loc_id && $qid && !service_setting( $sid, 'pool_enabled_queues' ) ) {
			debmsg( "The pool is disabled for queues." );
			return false;
		}

		if( !$loc_id && !service_setting( $sid, 'pool_enabled_city' ) ) {
			debmsg( "The pool is disabled for city orders." );
			return false;
		}

		/*
		 * Only waiting and postponed orders can be published.
		 */
		$s = $order->status();
		if( $s != order_states::S_WAITING
			&& $s != order_states::S_POSTPONED ) {
			self::log_order( $order, "Can't publish, the state is ".$order->status() );
			return false;
		}

		return true;
	}

	private static function broadcast( $order )
	{
		self::log_order( $order, 'broadcasting the pool event' );
		$m = new message( 'new-pool-order' );
		$sid = $order->service_id();
		$R = conn::find_users( T_TAXI, $sid );
		foreach( $R as $r ) {
			write_message( $r->cid, $m );
		}
	}

	private static function log_order( $order, $msg ) {
		$order_id = $order->id();
		debmsg( "order #$order_id: $msg" );
	}
}

?>
