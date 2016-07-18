<?php

class Settings
{
	/*
	 * Values container.
	 */
	private static $data = null;

	/*
	 * Gets a value.
	 */
	static function get( $key, $default = null )
	{
		if( self::$data === null ){
			self::init();
		}
		if( isset( self::$data[$key] ) ){
			return self::$data[$key];
		} else {
			return $default;
		}
	}

	/*
	 * Returns the whole array of set values.
	 */
	static function get_all()
	{
		if( self::$data === null ){
			self::init();
		}
		return self::$data;
	}

	/*
	 * Reads the settings.ini file. Also checks whether
	 * "settings-<hostname>.ini" file exists and reads it too.
	 */
	private static function init()
	{
		if( self::$data ) return;
		self::$data = array();

		self::read( "settings.ini" );

		/*
		 * Split the domain name into parts and use them to build a
		 * "cascade" of additiona settings file names.
		 */
		$host = parse_url( CURRENT_URL, PHP_URL_HOST );
		$parts = explode( ".", $host );
		$spec = "";
		while( !empty( $parts ) ) {
			$part = array_pop( $parts );
			$spec .= ".".$part;
			self::read( "settings$spec.ini" );
		}
	}

	private static function read( $name )
	{
		$path = append_path( APPLICATION_PATH, $name );
		if( !file_exists( $path ) ) {
			return;
		}
		self::$data = array_merge( self::$data, parse_ini_file( $path ) );
	}
}

?>
