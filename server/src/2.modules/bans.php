<?php
/*
 * Tells if the given taxi is banned.
 */
function taxi_is_banned( $taxi_id ) {
	return ext_bans::taxi_is_banned( $taxi_id );
}

/*
 * Returns remaining ban time for the given taxi, in seconds.
 */
function remaining_ban_time( $taxi_id ) {
	return ext_bans::remaining_time( $taxi_id );
}

/*
 * Bans the given taxi for the given amount of seconds.
 */
function ban_taxi( $taxi_id, $seconds, $reason = '' ) {
	return ext_bans::ban_taxi( $taxi_id, $seconds, $reason );
}

/*
 * Removes taxi ban.
 */
function unban_taxi( $taxi_id ) {
	return ext_bans::unban_taxi( $taxi_id );
}

/*
 * Adds a warning, returns number of remaining warnings allowed before
 * the taxi gets banned.
 */
function add_ban_warning( $taxi_id ) {
	return ext_bans::warn( $taxi_id );
}

/*
 * Resets ban warnings.
 */
function reset_ban_warnings( $taxi_id ) {
	return ext_bans::reset_warnings( $taxi_id );
}

function info_bans() {
	return ext_bans::info();
}


$ns = 'ext_bans::';

define( 'EV_TAXI_BANNED', 'taxi-banned' );
define( 'EV_TAXI_UNBANNED', 'taxi-unbanned' );
register_event_type( EV_TAXI_BANNED );
register_event_type( EV_TAXI_UNBANNED );

/*
 * Check bans every 5 minutes.
 */
schedule( 300, $ns.'check_bans' );


class ext_bans
{
	/*
	 * Table indexed by taxi_id. Block_until times.
	 */
	private static $block_times = array();

	/*
	 * Returns time until which the given taxi is blocked. Returns zero
	 * if the taxi is not blocked.
	 */
	private static function get_block_time( $taxi_id )
	{
		if( !isset( self::$block_times[$taxi_id] ) )
		{
			$t = taxi_drivers::end_block_time( $taxi_id );
			/*
			 * If not blocked, set $t to zero.
			 */
			if( $t && $t < time() ) {
				$t = 0;
			}
			self::$block_times[$taxi_id] = $t;
		}
		return self::$block_times[$taxi_id];
	}

	/*
	 * Tells whether the given taxi is banned.
	 */
	static function taxi_is_banned( $taxi_id )
	{
		$t = self::get_block_time( $taxi_id );
		return $t > time();
	}

	static function remaining_time( $taxi_id )
	{
		$t = self::get_block_time( $taxi_id );
		$t -= time();
		if( $t < 0 ) $t = 0;
		return $t;
	}

	/*
	 * Blocks the taxi for the given amount of seconds.
	 */
	static function ban_taxi( $taxi_id, $seconds, $reason = '' )
	{
		if( $seconds <= 0 ) {
			warning( "Non-positive seconds in ban_taxi." );
			return false;
		}

		$t = time() + $seconds;
		taxi_drivers::block( $taxi_id, $t, $reason );
		self::$block_times[$taxi_id] = $t;

		$sid = get_taxi_service( $taxi_id );
		$until = date( "d.m.Y H:i:s", $t );
		logmsg( "#$taxi_id blocked until $until: '$reason'",
			$sid, $taxi_id );
		service_log( $sid, '{t} заблокирован ({?})', $taxi_id, $reason );

		announce_event( $sid, EV_TAXI_BANNED, array(
			'taxi_id' => $taxi_id,
			'until' => $t,
			'reason' => $reason
		));

		return true;
	}

	/*
	 * Unban the given taxi.
	 */
	static function unban_taxi( $taxi_id )
	{
		$t = self::get_block_time( $taxi_id );
		if( !$t ) {
			warning( "unban_taxi: the taxi is not banned" );
			return false;
		}
		$sid = get_taxi_service( $taxi_id );

		logmsg( "#$taxi_id unblocked", $sid, $taxi_id );
		service_log( $sid, '{t} разблокирован', $taxi_id );

		taxi_drivers::unblock( $taxi_id );
		self::$block_times[$taxi_id] = 0;
		announce_event( $sid, EV_TAXI_UNBANNED, array(
			'taxi_id' => $taxi_id
		));

		return true;
	}

	/*
	 * "Issue a warning" for an order-decline. If there are enough
	 * warnings already, ban the taxi for a predefined time.
	 *
	 * The number of remaining allowed declines is returned. If zero is
	 * returned, the taxi has been banned. If -1 is returned, then
	 * banning is disabled.
	 */
	static function warn( $taxi_id )
	{
		logmsg( "#$taxi_id: ban warning",
			get_taxi_service( $taxi_id ), $taxi_id );

		$remaining = taxi_drivers::add_warning( $taxi_id );
		if( $remaining <= 0 ) {
			// TODO: block_time should be a service option.
			$time = 7200;
			self::ban_taxi( $taxi_id, $time, "Отказы от заказов" );
		}
		return $remaining;
	}

	/*
	 * Reset warnings accumulated with `warn` calls.
	 */
	static function reset_warnings( $taxi_id )
	{
		taxi_drivers::reset_warnings( $taxi_id );
	}

	/*
	 * Check all banned taxis and unban them it it's time.
	 */
	static function check_bans()
	{
		$now = time();
		foreach( self::$block_times as $taxi_id => $time )
		{
			if( $time && $time <= $now ) {
				self::unban_taxi( $taxi_id );
			}
		}
	}

	static function info()
	{
		$a = array();
		$now = time();

		foreach( self::$block_times as $taxi_id => $t )
		{
			$dt = $t - $now;
			if( $dt < 0 ) $dt = 0;
			$a[] = array(
				'taxi_id' => $taxi_id,
				'block_time' => $dt ? $t : 0,
				'remaining' => $dt
			);
		}
		return $a;
	}

}

?>
