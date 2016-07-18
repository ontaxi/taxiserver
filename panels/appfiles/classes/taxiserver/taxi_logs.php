<?php

class taxi_logs
{
	static function save_driver_pos( $driver_id, $lat, $lon )
	{
		return DB::insertRecord( 'taxi_log_positions', array(
			'driver_id' => $driver_id,
			'lat' => $lat,
			'lon' => $lon
		));
	}

	static function last_driver_pos( $driver_id )
	{
		return DB::getRecord( "
			SELECT UNIX_TIMESTAMP(t) AS t,
			lat, lon
			FROM taxi_log_positions
			WHERE driver_id = %d
			ORDER BY t DESC
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
