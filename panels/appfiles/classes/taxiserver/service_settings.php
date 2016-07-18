<?php

class service_settings
{
	static $defaults = array(
		'queue_dialogs' => '0',
		'queue_dialog_time' => '30',
		'restore_queues' => '1',
		'driver_orders' => '0',
		'mark_customers' => '0',
		'accept_timeout' => '10',
		'queue_drivers' => '2',
		'search_radius' => '3000',
		'search_number' => '1',
		'pool_enabled_queues' => '1',
		'pool_enabled_city' => '1',
		'publish_duration' => '20',
		'default_city' => 'Минск',
		'phrases_driver' => '',
		'phrases_dispatcher' => ''
	);

	static function get_settings( $service_id )
	{
		$a = DB::getRecords( "SELECT name, value
			FROM taxi_service_settings
			WHERE service_id = %d", $service_id );
		$s = array_column( $a, 'value', 'name' );
		foreach( self::$defaults as $k => $v ) {
			if( !array_key_exists( $k, $s ) ) {
				$s[$k] = $v;
			}
		}
		return $s;
	}

	static function get_value( $service_id, $key )
	{
		$val = DB::getValue( "SELECT value
			FROM taxi_service_settings
			WHERE service_id = %d
				AND name = '%s'",
			$service_id, $key
		);
		if( $val === null && isset( self::$defaults[$key] ) ) {
			$val = self::$defaults[$key];
		}
		return $val;
	}

	static function set_value( $service_id, $key, $value )
	{
		DB::exec( "START TRANSACTION" );
		DB::exec( "DELETE FROM taxi_service_settings
			WHERE service_id = %d
			AND name = '%s'", $service_id, $key );
		DB::insertRecord( 'taxi_service_settings', array(
			'service_id' => $service_id,
			'name' => $key,
			'value' => $value
		));
		DB::exec( "COMMIT" );
	}

	static function save( $service_id, $settings )
	{
		DB::exec( "START TRANSACTION" );
		DB::exec( "DELETE FROM taxi_service_settings
			WHERE service_id = %d", $service_id );
		foreach( $settings as $k => $v ) {
			DB::insertRecord( 'taxi_service_settings', array(
				'service_id' => $service_id,
				'name' => $k,
				'value' => $v
			));
		}
		DB::exec( "COMMIT" );
	}

	static function config( $sid, $name )
	{
		if( preg_match( '/[^a-z_]/', $name, $m ) ) {
			error( "Invalid service option name: $name" );
			return 0;
		}
		return DB::getValue( "SELECT $name FROM taxi_services
			WHERE service_id = %d", $sid );
	}
}

?>
