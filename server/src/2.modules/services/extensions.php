<?php

conf_add( 'services', 'service_extensions::config' );
init( 'service_extensions::init' );

function service_extension( $func ) {
	return service_extensions::register( $func );
}

class service_extensions
{
	/*
	 * File path => function.
	 */
	private static $initfunc = array();

	private static $current_path;
	private static $conf;

	static function config( $conf )
	{
		self::$conf = $conf;
	}

	static function init()
	{
		foreach( self::$conf as $service_name => $path ) {
			self::load( $service_name, $path );
		}
	}

	private static function load( $service_name, $path )
	{
		$sid = DB::getValue( "SELECT service_id FROM taxi_services
			WHERE inner_name = '%s'", $service_name );
		if( !$sid ) {
			error( "Unknown service: $service_name" );
			return;
		}
		logmsg( "Initialising service $service_name", $sid );
		if( !isset( self::$initfunc[$path] ) ) {
			if( !self::load_file( $path ) ) return;
		}
		$f = self::$initfunc[$path];
		$f( $sid );
	}

	private static function load_file( $path )
	{
		if( !file_exists( $path ) ) {
			error( "File doesn't exist: $path" );
			return false;
		}
		self::$current_path = $path;
		require $path;
		return true;
	}

	static function register( $func )
	{
		self::$initfunc[self::$current_path] = $func;
	}
}

?>
