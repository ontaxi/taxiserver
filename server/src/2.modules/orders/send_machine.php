<?php
/*
 * Machine for orders sending.
 */

/*
 * Event: next group of cars has been selected for sending an order.
 * The job will be passed as event data.
 * The listener in the taxi protocol will deal with it.
 */
define( 'EV_ORDER_SQUAD', 'send-job-group-selected' );
register_event_type( EV_ORDER_SQUAD );

define( 'EV_SENDING_FINISHED', 'send-job-finished' );
register_event_type( EV_SENDING_FINISHED );

/*
 * Reasons to skip a taxi from sending.
 */
define( 'SKIP_OFFLINE', 'no_connection' );
define( 'SKIP_BUSY', 'busy' );
define( 'SKIP_DECLINED', 'declined' );
define( 'SKIP_TIMEOUT', 'timeout' );


/*
 * Skip taxi when sending the order.
 * $reason has to be one of SKIP_* constants.
 */
function skip_taxi_sending( $order_id, $taxi_id, $reason ) {
	return send_machine::skip_car( $order_id, $taxi_id, $reason );
}

function get_sending_job( $order_id ) {
	return send_machine::get_job( $order_id );
}

function send_order( $order, $job, $callback ) {
	send_machine::add_job( $order, $job, $callback );
	send_machine::start( $order );
}

class send_job {
	public $order;
	public $squad;
	public $finish_callback;
	public $postpone_id;

	function __construct( $order, $squad, $finish_callback ) {
		$this->order = $order;
		$this->squad = $squad;
		$this->finish_callback = $finish_callback;
	}
}

class send_machine
{
	/*
	 * Jobs currently being processed. Indexed by order_id.
	 */
	private static $jobs = array();

	/*
	 * Allowed arguments for external skip calls.
	 */
	private static $allowed_skips = array(
		SKIP_OFFLINE, SKIP_BUSY, SKIP_DECLINED
	);

	/*
	 * Process next group
	 */
	private static function next( $order_id )
	{
		self::log( $order_id, "next group" );
		if( !isset( self::$jobs[$order_id] ) ) {
			error( "No job #$order_id" );
			return;
		}

		$job = self::$jobs[$order_id];
		$squad = $job->squad;
		/*
		 * If there is no next group, announce the job's end and stop.
		 */
		if( !isset( $squad->groups[ $squad->current_group + 1 ] ) ) {
			self::finish( $order_id );
			return;
		}

		/*
		 * Select next group and announce it.
		 */
		$group = $squad->groups[ ++$squad->current_group ];
		$group->finish_time = time() + $group->timeout;
		announce_event( null, EV_ORDER_SQUAD,
			array( 'job' => $squad ) );

		/*
		 * Run check: the announce may have cascaded into car skips.
		 */
		self::check( $order_id );
	}

	/*
	 * Check how the job is going
	 */
	static function check( $order_id )
	{
		if( !isset( self::$jobs[$order_id] ) ) {
			error( "No job for #$order_id" );
			return;
		}

		/*
		 * Get the job and its current group.
		 */
		$job = self::$jobs[$order_id];
		$group = $job->squad->groups[ $job->squad->current_group ];

		/*
		 * If there is a postponed check call in future, cancel it.
		 */
		$pid = $job->postpone_id;
		if( $pid ) {
			cancel( $pid );
		}

		/*
		 * If reached T, mark all unskipped cars as timed out
		 * and go to the next group.
		 */
		$now = time();
		if( $now >= $group->finish_time )
		{
			self::log( $order_id, "group timeout" );
			foreach( $group->cars as $car )
			{
				if( !$car->skipped ) {
					$car->skipped = SKIP_TIMEOUT;
				}
			}
			self::next( $order_id );
			return;
		}

		/*
		 * If not reached timeout but all cars are skipped,
		 * go to the next group.
		 */
		$all_skipped = true;
		foreach( $group->cars as $car )
		{
			if( !$car->skipped ) {
				$all_skipped = false;
				break;
			}
		}
		if( $all_skipped ) {
			self::log( $order_id, "Current group skipped" );
			self::next( $order_id );
			return;
		}

		/*
		 * If not reached timeout and not all cars skipped,
		 * reschedule the check.
		 */
		$dt = $group->finish_time - $now;
		$func = __CLASS__.'::check';
		self::log( $order_id, "check in $dt seconds" );
		$job->postpone_id = postpone( $dt, $func, $order_id );
	}

	private static function finish( $order_id )
	{
		self::log( $order_id, "sending ended" );
		$job = self::$jobs[$order_id];

		/*
		 * Announce the event and remove the job
		 */
		announce_event( null, EV_SENDING_FINISHED,
			array( 'job' => $job->squad ) );
		$f = $job->finish_callback;
		$f( $job->order );
		self::remove( $order_id );
	}

	/*
	 * Add a job.
	 */
	static function add_job( $order, cars_squad $squad, $callback )
	{
		$order_id = $order->id();
		$job = new send_job( $order, $squad, $callback );
		$squad->order_id = $order_id;
		self::log( $order_id, "adding job" );
		self::$jobs[$order_id] = $job;
	}

	/*
	 * Start the job
	 */
	static function start( $order )
	{
		$order_id = $order->id();
		if( !isset( self::$jobs[$order_id] ) ) {
			error( "Can't start job #$order_id: no such job" );
			return;
		}
		self::next( $order_id );
	}

	/*
	 * Returns the job.
	 */
	static function get_job( $order_id )
	{
		if( !isset( self::$jobs[$order_id] ) ) {
			return null;
		}
		return self::$jobs[$order_id]->squad;
	}

	/*
	 * Cancel a job.
	 */
	static function cancel_job( $order_id )
	{
		self::log( $order_id, "cancelling job" );
		if( !isset( self::$jobs[$order_id] ) ) {
			return false;
		}

		/*
		 * Cancel the postponement.
		 */
		$pid = self::$jobs[$order_id]->postpone_id;
		if( $pid ) {
			cancel( $pid );
		}

		self::remove( $order_id );
	}

	private static function remove( $order_id )
	{
		if( !isset( self::$jobs[$order_id] ) ) {
			return;
		}
		$job = self::$jobs[$order_id];
		unset( self::$jobs[$order_id] );
	}

	static function skip_car( $order_id, $taxi_id, $reason )
	{
		if( !isset( self::$jobs[$order_id] ) ) {
			self::log( $order_id, "skip_car: no job #$order_id" );
			return false;
		}

		/*
		 * Check that the reason is valid.
		 */
		if( !in_array( $reason, self::$allowed_skips ) ) {
			warning( "skip_car: illegal skip '$reason'" );
			return false;
		}

		$squad = self::$jobs[$order_id]->squad;
		$car = $squad->get_car( $taxi_id );
		if( !$car ) {
			warning( "skip_car: no taxi #$taxi_id in current group" );
			return false;
		}

		if( $car->skipped ) {
			self::log( $order_id, "skip_car ($reason): car already skipped ($car->skipped)" );
			return false;
		}

		$car->skipped = $reason;
		self::check( $order_id );
		return true;
	}

	static function print_job( $squad )
	{
		$ruler = '----------------------------------------';
		$lines = array( "order id: $squad->order_id", $ruler );
		$G = $squad->groups;
		$P = $squad->current_group;

		/*
		 * Finishing time of previous group
		 */
		$t = 0;

		foreach( $squad->groups as $i => $group )
		{
			$s = "Group " . ($i+1).', timeout='.$group->timeout;
			/*
			 * If this group has been initialised, show its expected
			 * finishing time.
			 */
			if( $P >= $i ) {
				$T = $group->finish_time;
				$s .= ", timeout at $T";
				if( $i > 0 ) $s .= " (+" . ($T - $t) . ')';
				$t = $T;
			}
			else {
				$s .= ", waiting";
			}

			$lines[] = $s;

			foreach( $group->cars as $car )
			{
				$s = "\tTaxi $car->taxi_id\t";
				if( $car->skipped ) {
					$s .= "skipped\t" . $car->skipped;
				}
				else {
					$s .= 'waiting';
				}
				$lines[] = $s;
			}
			$lines[] = $ruler;
		}

		return implode( "\n", $lines );
	}


	private static function log( $order_id, $msg ) {
		debmsg( "order #$order_id: $msg" );
	}
}
?>
