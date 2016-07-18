<?php

function conf_add( $section, $func ) {
	config::add_section( $section, $func );
}

class config
{
	private static $funcs = array();

	static function add_section( $section, $func )
	{
		if( isset( self::$funcs[$section] ) ) {
			error( "Config parameter $section defined twice" );
		}
		self::$funcs[$section] = $func;
	}

	static function init( $conf )
	{
		foreach( $conf as $section => $value )
		{
			if( !isset( self::$funcs[$section] ) ) {
				warning( "Unknown config parameter: $section" );
				continue;
			}
			$f = self::$funcs[$section];
			call_user_func( $f, $value, $section );
		}
	}
}

?>
