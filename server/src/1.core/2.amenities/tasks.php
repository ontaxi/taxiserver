<?php
/*
 * Tasks are function calls that can be postponed for a single call or
 * scheduled for repeated calls.
 */


/*
 * Postpone a function call by given amount of seconds.
 */
function postpone( $time, $func, $args_ = null ) {
	$args = func_get_args();
	return call_user_func_array( 'tasks::postpone', $args );
}

/*
 * Schedule a function call every $period seconds.
 */
function schedule( $period, $func, $args_ = null ) {
	$args = func_get_args();
	return call_user_func_array( 'tasks::schedule', $args );
}

function cancel( $id ) {
	return tasks::cancel( $id );
}

function info_tasks() {
	return tasks::info();
}

class task
{
	private static $counter;
	/*
	 * When to run
	 */
	public $time;
	/*
	 * Function and arguments
	 */
	public $func;
	public $args;

	/*
	 * Period. If 0, task is executed once. If not, it is repeated with
	 * this period.
	 */
	public $period;

	/*
	 * Task identifier, may be used to cancel it.
	 */
	public $id;

	function __construct( $time, $func, $args, $period = 0 )
	{
		$this->id = self::next_id();
		$this->time = $time;
		$this->func = $func;
		$this->args = $args;
		$this->period = $period;
	}

	function __toString()
	{
		$fname = '';
		if( is_closure( $this->func ) ) {
			$fname = '{closure}';
		} else {
			$fname = $this->func;
		}
		$args = array();
		foreach( $this->args as $arg ) {
			if( is_object( $arg ) ) {
				$args[] = 'object ' . get_class( $arg );
				continue;
			}
			$args[] = $arg;
		}
		return '#'.$this->id.': '.$fname . '('
			. implode(', ', $args) .')';
	}

	private static function next_id()
	{
		if( self::$counter == PHP_INT_MAX ) {
			debmsg( "wrapped tasks counter at ".self::$counter );
			self::$counter = 1;
		}
		else {
			self::$counter++;
		}
		return self::$counter;
	}
}

class tasks
{
	/*
	 * Hash table, task id => task object.
	 */
	private static $tasks = array();

	/*
	 * Postpones a function call $func( $args... ) by given number of
	 * seconds.
	 */
	static function postpone( $time, $func, $args_ = null )
	{
		if( !is_callable( $func ) ) {
			trigger_error( "$func is not callable" );
			return;
		}
		$args = func_get_args();
		$args = array_slice( $args, 2 );
		$t = new task( time() + $time, $func, $args, false );
		debmsg( "Postpone ($time s) $t" );
		self::$tasks[$t->id] = $t;
		return $t->id;
	}

	/*
	 * Schedules a function call $func( $args... ) at each $period
	 * seconds from now.
	 */
	static function schedule( $period, $func, $args_ = null )
	{
		if( !is_callable( $func ) ) {
			trigger_error( "$func is not callable" );
			return;
		}
		$args = func_get_args();
		$args = array_slice( $args, 2 );
		$t = new task( time() + $period, $func, $args, $period );
		self::$tasks[$t->id] = $t;
		return $t->id;
	}

	/*
	 * Cancel a scheduled or postponed task.
	 */
	static function cancel( $id )
	{
		if( isset( self::$tasks[$id] ) ) {
			debmsg( "cancel task ".self::$tasks[$id] );
			unset( self::$tasks[$id] );
			return true;
		}
		return false;
	}

	/*
	 * Checks all current tasks and executes the ones that are due.
	 */
	static function tick()
	{
		$now = time();
		/*
		 * A call to a scheduled function may result in another task
		 * being added or deleted, so we can't do all in one loop pass.
		 */
		while( $t = self::get_task( $now ) )
		{
			debmsg( "call task $t" );
			_timer::in();
			call_user_func_array( $t->func, $t->args );
			_timer::out( "task $t" );
			/*
			 * If this is a periodic task, postpone it again.
			 * If not, remove it from the list.
			 */
			if( $t->period ) {
				$t->time = $now + $t->period;
			}
			else {
				unset( self::$tasks[$t->id] );
			}
		}
	}

	/*
	 * Returns task to be run now or null.
	 */
	private static function get_task( $now )
	{
		foreach( self::$tasks as $t ) {
			if( $t->time <= $now ) {
				return $t;
			}
		}
		return null;
	}

	/*
	 * Returns small report for monitoring.
	 */
	static function info()
	{
		$info = array();
		foreach( self::$tasks as $t )
		{
			$fname = is_closure( $t->func )? '(closure)' : $t->func;
			$info[] = array(
				'id' => $t->id,
				'task' => $fname,
				'period' => $t->period
			);
		}
		return $info;
	}

}
?>
