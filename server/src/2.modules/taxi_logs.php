<?php

class taxi_logs
{
	static function save_driver_pos( $driver_id, $lat, $lon, $time )
	{
		return DB::exec( "INSERT INTO taxi_log_positions
			(driver_id, lat, lon, t) VALUES
			(%d, %.7f, %.7f, FROM_UNIXTIME(%d))",
			$driver_id, $lat, $lon, $time );
	}

	static function last_driver_pos( $driver_id )
	{
		$driver_id = intval( $driver_id );
		return DB::getRecord( "
			SELECT UNIX_TIMESTAMP(t) AS t,
			lat, lon
			FROM taxi_log_positions pos
			WHERE driver_id = $driver_id
			AND pos.t = (SELECT MAX(t) FROM taxi_log_positions
				WHERE driver_id = $driver_id)
			LIMIT 1", $driver_id );
	}

	static function log_in( $acc_id, $remote_addr )
	{
		return DB::insertRecord( 'taxi_log_logins', array(
			'acc_id' => $acc_id,
			'login_addr' => $remote_addr
		));
	}

	static function log_out( $acc_id, $remote_addr )
	{
		$r = DB::getRecord( "
			SELECT num, logout_time
			FROM taxi_log_logins
			WHERE acc_id = %d
			ORDER BY num DESC", $acc_id );
		if( !$r || $r['logout_time'] ) {
			return false;
		}

		$num = $r['num'];

		DB::exec( "UPDATE taxi_log_logins
			SET logout_time = NOW(), logout_addr = '%s'
			WHERE num = %d",
			$remote_addr, $num );
		return true;
	}
}

?>
