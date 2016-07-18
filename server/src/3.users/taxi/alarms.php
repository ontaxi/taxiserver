<?php

define( 'EV_TAXI_ALARM_ON', 'ev-taxi-alarm-on' );
define( 'EV_TAXI_ALARM_OFF', 'ev-taxi-alarm-off' );
register_event_type( EV_TAXI_ALARM_ON );
register_event_type( EV_TAXI_ALARM_OFF );

init( function()
{
	$ns = 'driver_proto_alarm::';
	add_cmdfunc( T_TAXI, 'alarm', $ns.'msg_alarm' );
	add_cmdfunc( T_TAXI, 'stop-alarm', $ns.'msg_stop_alarm' );
	driver_proto_alarm::init();
});

class driver_proto_alarm
{
	const ALARM_DURATION = 600; // 10 min

	/*
	 * Driver id => stop task id
	 */
	private static $timeouts = array();

	static function init()
	{
		$alarms = DB::getRecords( "SELECT
			acc_id AS driver_id,
			UNIX_TIMESTAMP(alarm_time) AS start_time
			FROM taxi_drivers
			WHERE alarm_time IS NOT NULL"
		);

		$now = time();
		foreach( $alarms as $alarm )
		{
			$driver_id = $alarm['driver_id'];

			$time = $now - $alarm['start_time'];
			$remaining = self::ALARM_DURATION - $time;

			if( $remaining <= 0 ) {
				self::clear_alarm( $driver_id );
				continue;
			}
			$tid = postpone( $remaining, 'driver_proto_alarm::stop', $driver_id );
			self::$timeouts[$driver_id] = $tid;
		}
	}

	static function msg_alarm( $msg, $user )
	{
		$driver_id = $user->id;
		service_log( $user->sid, '{t} отправил сигнал тревоги', $driver_id );
		DB::exec( "UPDATE taxi_drivers
			SET alarm_time = NOW()
			WHERE acc_id = %d",
			$driver_id );
		announce_event( $user->sid, EV_TAXI_ALARM_ON, array(
			'taxi_id' => $driver_id
		));

		/*
		 * Cancel the stop timer, if there is one.
		 */
		if( isset( self::$timeouts[$driver_id] ) ) {
			cancel( self::$timeouts[$driver_id] );
		}

		/*
		 * Cancel the alarm later.
		 */
		$tid = postpone( self::ALARM_DURATION,
			'driver_proto_alarm::stop', $driver_id );
		self::$timeouts[$driver_id] = $tid;
	}

	static function msg_stop_alarm( $msg, $user )
	{
		$driver_id = $user->id;
		if( !isset( self::$timeouts[$driver_id] ) ) {
			debmsg( "Received stop-alarm for timed out alarm from #$driver_id." );
			return;
		}
		cancel( self::$timeouts[$driver_id] );
		self::clear_alarm( $driver_id );
	}

	static function stop( $driver_id )
	{
		debmsg( "Cancelling the alarm for #$driver_id" );
		if( !isset( self::$timeouts[$driver_id] ) ) {
			warning( "No alarm timer for #$driver_id, can't cancel" );
			return;
		}
		self::clear_alarm( $driver_id );
	}

	private static function clear_alarm( $driver_id )
	{
		unset( self::$timeouts[$driver_id] );
		$sid = get_taxi_service( $driver_id );
		DB::exec( "UPDATE taxi_drivers SET alarm_time = NULL
			WHERE acc_id = %d", $driver_id );
		announce_event( $sid, EV_TAXI_ALARM_OFF, array(
			'taxi_id' => $driver_id
		));
	}
}

?>
