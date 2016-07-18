<?php
/*
 * Orders state machine. Side effects (like sending messages
 * to correspondents) are implemented elsewhere as event listeners.
 */

define( 'EV_ORDER_SAVED', 'order-saved' );
define( 'EV_ORDER_WAITING', 'order-waiting' );
define( 'EV_ORDER_DROPPED', 'order-dropped' );
define( 'EV_ORDER_ASSIGNED', 'order-assigned' );
define( 'EV_ORDER_ARRIVED', 'taxi-arrived' );
define( 'EV_ORDER_STARTED', 'order-started' );
define( 'EV_ORDER_FINISHED', 'order-finished' );
define( 'EV_ORDER_CANCELLED', 'order-cancelled' );

register_event_type( EV_ORDER_SAVED );
register_event_type( EV_ORDER_WAITING );
register_event_type( EV_ORDER_DROPPED );
register_event_type( EV_ORDER_ASSIGNED );
register_event_type( EV_ORDER_ARRIVED );
register_event_type( EV_ORDER_STARTED );
register_event_type( EV_ORDER_FINISHED );
register_event_type( EV_ORDER_CANCELLED );

/*
 * Save the order: transition to "postponed" state.
 * Returns order id or null.
 */
function save_order( $order, &$err = null ) {
	return order_states::save( $order, $err );
}

function postpone_order( $order ) {
	return order_states::postpone_order( $order );
}

/*
 * Move the order to the waiting state for drivers to accept.
 */
function wait_order( $order ) {
	return order_states::wait( $order );
}

/*
 * Drop the waiting order.
 */
function drop_order( $order ) {
	return order_states::drop( $order );
}

/*
 * Transition to "assigned" state. The order must have a taxi_id
 * (or whatever) set in it. Returns true or false.
 */
function assign_order( $order ) {
	return order_states::assign( $order );
}

/*
 * Transition to "arrived" state. Returns true or false.
 */
function notify_order( $order ) {
	return order_states::notify( $order );
}

/*
 * Transition to "started" state.
 */
function start_order( $order ) {
	return order_states::start( $order );
}

/*
 * Transition to "finished" state.
 */
function finish_order( $order ) {
	return order_states::finish( $order );
}

/*
 * Transition to "cancelled" state.
 * Cancel reason or whatever corresponding data should be set before
 * calling this.
 */
function cancel_order( $order ) {
	return order_states::cancel( $order );
}

function order_closed( $order ) {
	return order_states::order_closed( $order );
}

class order_states
{
	/*
	 * Postponed drop calls, order_id => pid.
	 */
	private static $drop_pids = array();

	/*
	 * Possible order states.
	 */
	const S_POSTPONED = 'postponed';
	const S_WAITING = 'waiting';
	const S_ASSIGNED = 'assigned';
	const S_ARRIVED = 'arrived';
	const S_STARTED = 'started';
	const S_FINISHED = 'finished';
	const S_CANCELLED = 'cancelled';
	const S_DROPPED = 'dropped';

	/*
	 * state => event
	 */
	private static $state_events = array(
		self::S_POSTPONED => EV_ORDER_SAVED,
		self::S_WAITING => EV_ORDER_WAITING,
		self::S_DROPPED => EV_ORDER_DROPPED,
		self::S_ASSIGNED => EV_ORDER_ASSIGNED,
		self::S_ARRIVED => EV_ORDER_ARRIVED,
		self::S_STARTED => EV_ORDER_STARTED,
		self::S_FINISHED => EV_ORDER_FINISHED,
		self::S_CANCELLED => EV_ORDER_CANCELLED
	);

	/*
	 * Map of allowed transitions: "where to" => "where from".
	 */
	private static $allowed_transitions = array(
		self::S_POSTPONED => array(
			null,
			self::S_POSTPONED,
			self::S_DROPPED
		),
		self::S_WAITING => array( self::S_POSTPONED, self::S_DROPPED ),
		self::S_ASSIGNED => array( self::S_WAITING, self::S_POSTPONED ),
		self::S_ARRIVED => array( self::S_ASSIGNED ),
		self::S_STARTED => array( self::S_ARRIVED, self::S_ASSIGNED ),
		self::S_FINISHED => array( self::S_STARTED ),
		self::S_DROPPED => array( self::S_WAITING ),
		self::S_CANCELLED => array(
			self::S_POSTPONED,
			self::S_WAITING,
			self::S_ASSIGNED,
			self::S_ARRIVED,
			self::S_STARTED,
			self::S_FINISHED,
			self::S_DROPPED
		)
	);

	static function order_closed( $order )
	{
		$s = $order->status();
		return $s == self::S_FINISHED
			|| $s == self::S_CANCELLED
			|| $s == self::S_DROPPED;
	}

	/*
	 * Transition to "postponed" state.
	 */
	static function save( $order, &$err )
	{
		self::log_order( $order, "Saving order $order" );
		$err = null;
		/*
		 * Fill missing fields that can be filled.
		 * If some required fields are missing, return an error.
		 */
		if( !self::fill_missing_data( $order ) ) {
			$err = 'missing_data';
			return false;
		}
		/*
		 * Move the order into the "postponed" state and save it.
		 * If it fails, the state transition is not allowed.
		 */
		if( !self::postpone_order( $order ) ) {
			$err = 'wrong_status';
			return false;
		}

		logmsg( "Saved order $order", $order->service_id() );
		return $order->id();
	}

	private static function fill_missing_data( $order )
	{
		if( !$order->service_id() ) {
			warning( "Missing service_id in the order" );
			return false;
		}

		if( !self::check_coords( $order ) ) {
			warning( "Could not determine coordinates" );
			return false;
		}

		self::fill_address( $order );

		/*
		 * Assign a UUID to the order if there is no one.
		 */
		if( !$order->order_uid() ) {
			$order->order_uid( DB::getValue( "SELECT UUID()" ) );
		}

		return true;
	}

	private static function check_coords( $order )
	{
		if( $order->latitude() ) {
			return true;
		}

		$loc_id = $order->src_loc_id();
		$addr = $order->src_addr();
		/*
		 * If a location is given, copy coordinates from it.
		 */
		if( !$order->latitude() && $loc_id ) {
			$loc = new taxi_location( $loc_id, 'latitude, longitude' );
			$order->latitude( $loc->latitude() );
			$order->longitude( $loc->longitude() );
		}
		/*
		 * If an address is given, try to determine coordinates from it.
		 */
		if( !$order->latitude() && $addr ) {
			$coords = address_point( $addr );
			if( $coords ) {
				$order->latitude( $coords[0] );
				$order->longitude( $coords[1] );
			}
		}

		if( !$order->latitude() ) {
			return false;
		}

		return true;
	}

	private static function fill_address( $order )
	{
		$loc_id = $order->src_loc_id();
		/*
		 * If a location is given, copy the address from it.
		 */
		if( !$order->src_addr() && $loc_id ) {
			$loc = new taxi_location( $loc_id, 'address' );
			$order->src_addr( $loc->address() );
		}
		/*
		 * If coordinates are given, try to detect the address from
		 * them.
		 */
		if( !$order->src_addr() && $order->latitude() ) {
			$addr = point_address( $order->latitude(), $order->longitude() );
			$order->src_addr( $addr );
		}
	}

	static function postpone_order( $order )
	{
		return self::transition( $order, self::S_POSTPONED );
	}

	static function wait( $order )
	{
		return self::transition( $order, self::S_WAITING );
	}

	private static function postpone_drop( $order, $timeout )
	{
		$pid = postpone( $timeout, 'drop_order', $order );
		self::$drop_pids[$order->id()] = $pid;
	}

	private static function cancel_drop( $order )
	{
		$id = $order->id();
		if( !isset( self::$drop_pids[$id] ) ) {
			return;
		}

		$pid = self::$drop_pids[$id];
		unset( self::$drop_pids[$id] );
		cancel( $pid );
	}

	static function drop( $order )
	{
		/*
		 * The order argument may be a stale copy given by postponement
		 * dispatcher, so we clear its cache.
		 */
		$order->refresh();
		if( !self::transition( $order, self::S_DROPPED ) ) {
			return false;
		}
		logmsg( "Dropping the order $order", $order->service_id() );

		self::cancel_drop( $order );
		send_machine::cancel_job( $order->id() );
		return true;
	}

	static function assign( $order )
	{
		if( !self::transition( $order, self::S_ASSIGNED ) ) {
			return false;
		}
		logmsg( "Assigning order $order to #".$order->taxi_id(),
			$order->service_id(), $order->taxi_id() );

		self::cancel_drop( $order );
		send_machine::cancel_job( $order->id() );

		$order->utc( 'time_assigned', time() );
		$order->save();
		return true;
	}

	static function notify( $order )
	{
		if( !self::transition( $order, self::S_ARRIVED ) ) {
			return false;
		}
		$order->utc( 'time_arrived', time() );
		$order->save();
		return true;
	}

	/*
	 * Start the order notifying everyone.
	 */
	static function start( $order )
	{
		if( !self::transition( $order, self::S_STARTED ) ) {
			return false;
		}

		$order_id = $order->id();
		$order->status( self::S_STARTED );
		$order->utc( 'time_started', time() );
		$order->save();

		return true;
	}

	/*
	 * Finish the order, save the stats and notify everyone.
	 */
	static function finish( $order )
	{
		if( !self::transition( $order, self::S_FINISHED ) ) {
			return false;
		}
		logmsg( "Finishing order $order",
			$order->service_id(), $order->taxi_id() );
		$order_id = $order->id();
		$order->utc( 'time_finished', time() );
		$order->save();
		return true;
	}

	/*
	 * Cancels given order and sends notifications to the taxi, the user and
	 * service channel (when needed).
	 */
	static function cancel( $order )
	{
		if( !self::transition( $order, self::S_CANCELLED ) ) {
			return false;
		}
		logmsg( "Cancelling order $order",
			$order->service_id(), $order->taxi_id() );
		send_machine::cancel_job( $order->id() );
		return true;
	}

	/*
	 * Check is state transition is allowed.
	 */
	private static function transition_allowed( $order, $next_state )
	{
		$curr_state = $order->status();
		$prevs = self::$allowed_transitions[$next_state];
		return in_array( $curr_state, $prevs );
	}

	/*
	 * Broadcast a transition event.
	 */
	private static function event( $e, $order ) {
		announce_event( $order->service_id(), $e, array( 'order' => $order ) );
	}

	/*
	 * Check transition, assign new state, emit an event.
	 */
	private static function transition( $order, $new_state )
	{
		$state = $order->status();
		self::log_order( $order, "$state -> $new_state" );
		if( !self::transition_allowed( $order, $new_state ) ) {
			warning( "Denied transition $state -> $new_state" );
			debmsg( "Denied transition $state -> $new_state" );
			return false;
		}

		$order->status( $new_state );
		$order->save();

		$event = self::$state_events[$new_state];
		self::event( $event, $order );

		return true;
	}

	/*
	 * Log wrapper that prepends an order specifier to the message.
	 */
	private static function log_order( $order, $msg ) {
		$id = $order->id();
		if( !$id ) $id = 'new';
		debmsg( "Order #$id: $msg" );
	}

}
?>
