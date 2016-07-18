<?php

class autoloaders
{
	private static $dirs = array();

	static function add_dir( $path ) {
		self::$dirs[] = $path;
	}

	static function seek( $class )
	{
		$name = strtolower( $class ).'.php';
		foreach( self::$dirs as $path )
		{
			$p = $path.'/'.$name;
			if( file_exists( $p ) )
			{
				include $p;
				return;
			}
		}
	}
}

/*
 * Separate autoloader for classes shared with the taxi server.
 */
spl_autoload_register( 'autoloaders::seek' );

?>
