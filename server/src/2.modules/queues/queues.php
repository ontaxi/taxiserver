<?php
define( 'EV_QUEUE_CHANGE', 'queue-change' );
register_event_type( EV_QUEUE_CHANGE );

schedule( 60, 'mod_queues::clean' );

class queue_position
{
	public $qid;
	public $pos; // starts from zero
	public $len;

	function __construct( $qid, $pos, $len ) {
		$this->qid = $qid;
		$this->pos = $pos;
		$this->len = $len;
	}
}

/*
 * Returns the driver's current queue position or null if the driver
 * is not in a queue.
 */
function get_queue_position( $driver_id ) {
	$pos = taxi_queues::get_car_position( $driver_id );
	if( !$pos ) return $pos;

	return new queue_position(
		$pos['queue_id'],
		$pos['position'] - 1,
		$pos['size']
	);
}

/*
 * Push taxi to the end of the queue.
 */
function queue_push( $taxi_id, $qid ) {
	return mod_queues::push_taxi( $taxi_id, $qid );
}

/*
 * Move taxi to the given queue at the given position.
 */
function queue_set( $taxi_id, $qid, $pos ) {
	return mod_queues::set_position( $taxi_id, $qid, $pos );
}

/*
 * Remove the taxi from any queue.
 */
function queue_remove( $taxi_id ) {
	return mod_queues::remove_taxi( $taxi_id );
}

/*
 * Returns queues accessible by the given taxi as a map (qid=>name).
 */
function taxi_queues( $taxi_id ) {
	return mod_queues::taxi_queues( $taxi_id );
}

/*
 * Clears saved position for the given taxi.
 */
function queue_unsave( $taxi_id ) {
	return mod_queues::clear_saved_position( $taxi_id );
}

/*
 * Save queue position. $reason will be checked later by queue_restore
 * to avoid wrong restores. See comments below.
 */
function queue_save( $taxi_id, $reason ) {
	return mod_queues::save_position( $taxi_id, $reason );
}

/*
 * Restore the position which was reset using reset_checkpoint, if there
 * is a saved position and its reason is the same as the given $reason.
 * If reason is omitted, restoring is made regardless of the reason.
 */
function queue_restore( $taxi_id, $reason = null ) {
	if( $reason === null ) {
		$reason = '_any';
	}
	return mod_queues::restore_position( $taxi_id, $reason );
}

function queue_access( $taxi_id, $qid ) {
	return mod_queues::queue_access( $taxi_id, $qid );
}

function queue_name( $qid ) {
	return DB::getValue( "SELECT name FROM taxi_queues
		WHERE queue_id = %d", $qid );
}

function upstream_queue( $qid ) {
	return DB::getValue( "SELECT parent_id FROM taxi_queues
		WHERE queue_id = %d", $qid );
}


class mod_queues
{
	/*
	 * Dict: taxi_id => { qid, pos, reason }.
	 * Holds restore points for restoring function.
	 */
	private static $previous_positions = array();

	/*
	 * Add the taxi to the end of the queue.
	 */
	static function push_taxi( $taxi_id, $queue_id )
	{
		if( !self::queue_access( $taxi_id, $queue_id ) ) {
			self::log( $taxi_id, "Denied access to queue $queue_id" );
			return false;
		}
		self::log( $taxi_id, "Push to queue q$queue_id" );

		$prev = get_queue_position( $taxi_id );
		self::clean();
		taxi_queues::push_car( $queue_id, $taxi_id );

		self::notify( $taxi_id, $prev );
		return true;
	}

	/*
	 * Put taxi in the given queue at the given position.
	 */
	static function set_position( $taxi_id, $queue_id, $pos )
	{
		if( !self::queue_access( $taxi_id, $queue_id ) ) {
			self::log( $taxi_id, "Denied access to queue $queue_id" );
			return false;
		}
		self::log( $taxi_id, "Put to queue q$queue_id, pos $pos" );

		$prev = get_queue_position( $taxi_id );
		self::clean();
		taxi_queues::set_car_position( $queue_id, $taxi_id, $pos );

		self::notify( $taxi_id, $prev );
		return true;
	}

	/*
	 * Remove the taxi from any queues.
	 */
	static function remove_taxi( $taxi_id )
	{
		$prev = get_queue_position( $taxi_id );
		if( !$prev ) {
			return false;
		}
		self::log( $taxi_id, "Remove from queues" );

		self::clean();
		taxi_queues::remove_car( $taxi_id );
		self::notify( $taxi_id, $prev );
		return true;
	}

	// TODO: caching for taxi-queues information.
	static function taxi_queues( $taxi_id )
	{
		$r = DB::getRecords("
			SELECT DISTINCT
				q3.queue_id,
				q3.name,
				q3.parent_id

			-- get driver group
			FROM taxi_drivers driver
			JOIN taxi_driver_groups USING (group_id)

			-- add associated queues
			JOIN taxi_driver_group_queues USING (group_id)
			JOIN taxi_queues queue USING (queue_id)

			-- span access across queue groups
			-- by joining parent queues and then child queues again

			LEFT JOIN taxi_queues q2
			ON q2.queue_id = queue.queue_id
			OR q2.queue_id = queue.parent_id

			LEFT JOIN taxi_queues q3
			ON q3.parent_id = q2.queue_id
			OR q3.queue_id = q2.queue_id

			WHERE driver.acc_id = %d
			ORDER BY q3.parent_id, q3.priority
			", $taxi_id );
		$Q = array();
		foreach( $r as $q )
		{
			$qid = $q['queue_id'];
			$Q[$qid] = $q;
		}
		return $Q;
	}

	static function queue_access( $taxi_id, $qid )
	{
		$q = self::taxi_queues( $taxi_id );
		return isset( $q[$qid] );
	}

	/*
	 * Send an event describing current queue position
	 * of the given taxi.
	 */
	private static function notify( $taxi_id, $prev )
	{
		$pos = get_queue_position( $taxi_id );
		$data = array(
			'driver_id' => $taxi_id,
			'pos' => $pos,
			'prev_pos' => $prev
		);

		$sid = get_taxi_service( $taxi_id );
		announce_event( $sid, EV_QUEUE_CHANGE, $data );

		if( $pos ) {
			$name = queue_name( $pos->qid );
			$n = $pos->pos + 1;
			$msg = '{t} записан в очередь «'. $name . "» $n-м";
		}
		else {
			$msg = '{t} убран из очереди';
		}
		service_log( $sid, $msg, $taxi_id );
	}

	static function clear_saved_position( $taxi_id )
	{
		unset( self::$previous_positions[$taxi_id] );
		return true;
	}

	/*
	 * Save current position of taxi $taxi_id.
	 */
	static function save_position( $taxi_id, $reason )
	{
		$pos = get_queue_position( $taxi_id );
		if( !$pos ) {
			self::log( $taxi_id, "No position to save ($reason)" );
			return false;
		}

		self::log( $taxi_id, "Saving queue position ($reason)" );
		self::$previous_positions[$taxi_id] = array(
			'pos' => $pos,
			'reason' => $reason
		);
		return true;
	}

	/*
	 * Restore position saved with save_position and notify the taxi.
	 */
	static function restore_position( $taxi_id, $reason )
	{
		if( !isset( self::$previous_positions[$taxi_id] ) ) {
			self::log( $taxi_id, "No position to restore ($reason)" );
			return false;
		}

		self::log( $taxi_id, "Restoring queue position ($reason)" );

		$r = self::$previous_positions[$taxi_id];
		if( $reason != '_any' && $r['reason'] != $reason ) {
			self::log( $taxi_id, "Wrong reason ($reason != $r[reason])" );
			return false;
		}

		$cpid = $r['pos']->qid;
		$pos = $r['pos']->pos;
		return self::set_position( $taxi_id, $cpid, $pos );
	}

	/*
	 * Remove invalid entries from queues.
	 */
	static function clean()
	{
		$timeout = 10 * 60;
		$records = taxi_queues::get_cars_to_clean( $timeout );
		$taxis = array();
		foreach( $records as $car )
		{
			$taxi_id = $car['driver_id'];
			$reason = 'unknown';
			foreach( $car as $cond => $value )
			{
				if( $cond == 'driver_id' ) continue;
				if( $value ) {
					$reason = $cond;
					break;
				}
			}
			$taxis[] = array( $taxi_id, $reason );
		}

		foreach( $taxis as $a )
		{
			$taxi_id = $a[0];
			$reason = $a[1];
			self::log( $taxi_id, "Cleaning from queues: $reason" );
			service_log( get_taxi_service( $taxi_id ), 'Автоочистка очереди.' );
			$prev = get_queue_position( $taxi_id );
			taxi_queues::remove_car( $taxi_id );
			self::clear_saved_position( $taxi_id );
			self::notify( $taxi_id, $prev );
		}
	}

	private static function log( $taxi_id, $msg ) {
		logmsg( $msg, get_taxi_service( $taxi_id ), $taxi_id );
	}
}
?>
