<?php
/*
 * Sessions module.
 */
define( 'EV_SESSION_OPENED', 'session-opened' );
define( 'EV_SESSION_CLOSED', 'session-closed' );
define( 'EV_SESSION_REQUEST', 'session-request' );

function open_157_session( $taxi_id, $odometer, $dispatcher_id = null ) {
	return ext157_sessions::open_session( $taxi_id, $odometer, $dispatcher_id );
}

function close_157_session( $taxi_id, $odometer, $dispatcher_id = null ) {
	return ext157_sessions::close_session( $taxi_id, $odometer, $dispatcher_id );
}

function request_157_session( $taxi_id, $odometer ) {
	ext157_sessions::send_request( $taxi_id, $odometer );
}

function record_157_session_order( $taxi_id, $order_id ) {
	return ext157_sessions::record_session_order( $taxi_id, $order_id );
}

/*
 * Update session activity (so that it won't get closed on inactivity
 * timeout). Returns false if there is no session for the given taxi.
 */
function update_157_session( $taxi_id ) {
	return ext157_sessions::update_activity( $taxi_id );
}

function session_needed( $driver_id )
{
	$sid = get_taxi_service( $driver_id );
	// If sessions are disabled, then not needed.
	if( !service_option( $sid, 'sessions' ) ) {
		return false;
	}
	// If updated successfully, then OK.
	if( update_157_session( $driver_id ) ) {
		return false;
	}
	// If not updated, then there is no session.
	return true;
}

register_event_type( EV_SESSION_OPENED );
register_event_type( EV_SESSION_CLOSED );
register_event_type( EV_SESSION_REQUEST );

schedule( 5*60, 'ext157_sessions::clean' );

class ext157_sessions
{
	/*
	 * If there are no significant events like taking an order or
	 * whatever, in some time (session timeout), then the session is
	 * automatically closed. Session timeout should be small, like
	 * 20 minutes.
	 */
	const SESSION_TIMEOUT = 50400; // 14 hours, effectively disabling timeouts.
	const MAX_SESSION_DURATION = 50400;

	/*
		When opening and closing sessions, we need to determine the taxi's address. Normally we would use taxi's current coordinates, but they may be not available at the moment. If there are no known coordinates, we take last known position from the session history (regardless of age).
	*/
	private static function get_taxi_coordinates( $taxi_id, $min_t = 0 )
	{
		$sid = get_taxi_service( $taxi_id );
		$lat = $lon = null;
		/*
		 * Get latitude and longitude of the car.
		 */
		$pos = get_taxi_position( $taxi_id );
		if( $pos ) {
			$lat = $pos->lat;
			$lon = $pos->lon;
		}
		else
		{
			/*
			 * The taxi may not have coordinates. We should then get
			 * them from the positions archive for the session's period.
			 */
			logmsg( "No coordinates, trying to get from the archive.",
				$sid, $taxi_id );
			$pos = taxi_logs::last_driver_pos( $taxi_id );
			if( $pos && $pos['t'] >= $min_t )
			{
				$lat = $pos['lat'];
				$lon = $pos['lon'];
			}
		}
		if( !$lat || !$lon ) {
			logmsg( "No coordinates", $sid, $taxi_id );
			return null;
		}

		return array( $lat, $lon );
	}

	/*
	 * Open a new session.
	 */
	static function open_session( $taxi_id, $odometer, $dispatcher_id )
	{
		$sid = get_taxi_service( $taxi_id );
		if( !$sid ) return "unknown_driver";

		$car_id = driver_car_id( $taxi_id );
		if( !$car_id ) {
			logmsg( "Could not open session: no car", $sid, $taxi_id );
			return "no_car";
		}

		if( service_sessions::get_taxi_session_r( $taxi_id ) ) {
			logmsg( "Could not open session: already open",
				$sid, $taxi_id );
			return "open";
		}

		$pos = self::get_taxi_coordinates( $taxi_id );
		if( $pos ) {
			$lat = $pos[0];
			$lon = $pos[1];
			$address = point_address( $lat, $lon );
		}
		else {
			$lat = null;
			$lon = null;
			$address = '';
		}

		logmsg( "Open session for #$taxi_id, odometer=$odometer",
			$sid, $taxi_id );
		logmsg( "Begin position: $lat, $lon", $sid, $taxi_id  );
		logmsg( "Begin address: $address", $sid, $taxi_id  );

		$id = DB::insertRecord( 'taxi_works', array(
			'driver_id' => $taxi_id,
			'car_id' => $car_id,
			'odometer_begin' => $odometer,
			'begin_dispatcher' => $dispatcher_id,
			'begin_latitude' => $lat,
			'begin_longitude' => $lon,
			'begin_address' => $address
		));

		if( !$id ) {
			logmsg( "Could not open session", $sid, $taxi_id  );
			return "unknown";
		}

		service_sessions::update_session_activity( $id );

		taxi_drivers::update_odometer( $taxi_id, $odometer );
		service_log( $sid, 'Смена {?} начата ({t}, одометр {?})',
			$id, $taxi_id, $odometer );
		announce_event( $sid, EV_SESSION_OPENED, array(
			'taxi_id' => $taxi_id,
			'session_id' => $id,
			'time_started' => time(),
			'car_id' => $car_id
		));
		return null;
	}

	/*
	 * Close the taxi's current session.
	 */
	static function close_session( $taxi_id, $odometer, $dispatcher_id )
	{
		$odometer = intval( $odometer );
		$sid = get_taxi_service( $taxi_id );
		logmsg( "Close session: taxi #$taxi_id, odometer=$odometer",
			$sid, $taxi_id  );

		$s = service_sessions::get_taxi_session_r( $taxi_id );
		if( !$s ) {
			warning( "Can't close session for #$taxi_id: no session." );
			return false;
		}

		$session_id = $s['id'];

		$pos = self::get_taxi_coordinates( $taxi_id, $s['begin_time'] );
		if( $pos ) {
			$lat = $pos[0];
			$lon = $pos[1];
			$address = point_address( $lat, $lon );
		}
		else {
			$lat = null;
			$lon = null;
			$address = '';
		}
		logmsg( "End address: $address", $sid, $taxi_id  );

		service_sessions::close_session( $session_id, $odometer,
			$dispatcher_id, $lat, $lon, $address );

		/*
		 * Update car's odometer.
		 */
		taxi_drivers::update_odometer( $taxi_id, $odometer );

		service_log( $sid, 'Смена {?} ({t}) завершена (одометр {?})',
			$session_id, $taxi_id, $odometer );
		announce_event( $sid, EV_SESSION_CLOSED, array(
			'taxi_id' => $taxi_id,
			'session_id' => $session_id )
		);
	}

	/*
		Taxi drivers can't open a session on their own, they can only send a request. The request through the events system and dispatchers protocol will end up on screens of dispatchers who will then open the session.
	*/
	static function send_request( $taxi_id, $odometer )
	{
		$sid = get_taxi_service( $taxi_id );
		logmsg( "Session request from #$taxi_id, odometer=$odometer",
			$sid, $taxi_id  );
		announce_event( $sid, EV_SESSION_REQUEST, array(
			'taxi_id' => $taxi_id,
			'odometer' => $odometer
		), $sid );
	}

	/*
		When a taxi is working, its orders are attached to the current session. Which orders get attached depends on circumstances (for example, orders that are not mandatory and are not taken don't need to be recorded).
	*/
	/*
	 * Add order reference to the current session, because the order
	 * has been taken or declined, or something else.
	 */
	static function record_session_order( $taxi_id, $order_id )
	{
		$session_id = service_sessions::get_taxi_session( $taxi_id );
		if( !$session_id ) {
			return false;
		}
		service_sessions::add_session_order( $session_id, $order_id );
		return true;
	}

	/*
		There is a notion of "activity" which also depends on circumstances. The idea is to keep track of actuality of a session: if there is no activity for a long time, then the session should probably be closed and archived. Every action that is considered an "activity" (like taking an order) will update the last activity time through this function:
	*/
	static function update_activity( $taxi_id )
	{
		$s = service_sessions::get_taxi_session_r( $taxi_id );
		if( !$s ) return false;
		$sid = $s['id'];
		service_sessions::update_session_activity( $sid );
		return true;
	}

	/*
	 * Automatically close old sessions.
	 */
	static function clean()
	{
		$S = service_sessions::get_inactive_sessions_r(
			self::SESSION_TIMEOUT, self::MAX_SESSION_DURATION );

		foreach( $S as $s )
		{
			$taxi_id = $s['driver_id'];
			$sid = get_taxi_service( $taxi_id );
			if( $s['idle_time'] > self::SESSION_TIMEOUT ) {
				logmsg( "Session $s[id] timed out ($s[idle_time]).",
					$sid, $taxi_id  );
			}
			else {
				logmsg( "Session $s[id] reached max duration ($s[duration]).",
					$sid, $taxi_id  );
			}
			self::close_session( $taxi_id, 0, null );
		}
	}
}

?>
