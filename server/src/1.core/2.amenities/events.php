<?php
/*
 * Allows declaring event types, adding listeners and triggering them.
 */

/*
 * Register an event type to enable adding and calling listeners.
 */
function register_event_type( $type ) {
	return events::register_event_type( $type );
}

/*
 * Add a listener for the given type of events.
 */
function listen_events( $sid, $type, $func ) {
	events::add_listener( $sid, $type, $func );
}

/*
 * Call listeners registered for the given type of event.
 */
function announce_event( $sid, $type, $data = null ) {
	return events::announce( $sid, $type, $data );
}

function info_events() {
	return events::info();
}


/*
 * Internal event listener representation.
 */
class event_listener
{
	/*
	 * Service identifier.
	 */
	public $sid;
	/*
	 * Function to call.
	 */
	public $func;

	function __construct( $func, $sid ) {
		$this->sid = $sid;
		$this->func = $func;
	}
}

class event
{
	public $sid;
	public $type;
	public $data;

	function __construct( $sid, $type, $data = null ) {
		$this->sid = $sid;
		$this->type = $type;
		$this->data = $data;
	}

	function __toString() {
		return "event '$this->type' (@$this->sid)";
	}
}

class events
{
	/*
	 * event_type => listeners[]
	 */
	private static $listeners = array();

	/*
	 * Register an event type for later use. This enforces event
	 * declarations in modules and helps avoid event conflicts.
	 */
	static function register_event_type( $type )
	{
		if( isset( self::$listeners[$type] ) ) {
			error( "Event type '$type' is already registered." );
			return;
		}

		self::$listeners[$type] = array();
	}

	/*
	 * Add a function to be called when an event of the given type is
	 * announced.
	 */
	static function add_listener( $sid, $type, $func )
	{
		if( !is_callable( $func ) ) {
			error( "$func is not callable" );
			return false;
		}
		if( !isset( self::$listeners[$type] ) ) {
			error( "Unregistered event type: $type" );
			return false;
		}
		$l = new event_listener( $func, $sid );
		self::$listeners[$type][] = $l;
	}

	/*
	 * Announce an event calling all functions registered for the given
	 * type of event. $data will be passed to the listeners as a
	 * parameter.
	 */
	static function announce( $sid, $type, $data )
	{
		if( !isset( self::$listeners[$type] ) ) {
			warning( "Announcing unregistered event '$type'" );
			return false;
		}

		$event = new event( $sid, $type, $data );

		foreach( self::$listeners[$type] as $l )
		{
			/*
			 * Skip if service identifiers are present and don't match.
			 */
			if( $sid && $l->sid && $sid != $l->sid ) {
				continue;
			}
			call_user_func( $l->func, $event );
		}
		return true;
	}

	static function info()
	{
		$a = array();
		foreach( self::$listeners as $name => $L )
		{
			foreach( $L as $l )
			{
				$a[] = array(
					'event' => $name,
					'func' => $l->func,
					'sid' => $l->sid
				);
			}
		}
		return $a;
	}

}
?>
