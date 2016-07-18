<?php

class cache
{
	static function set( $dir, $key, $value )
	{
		$dirname = 'cache/'.$dir;
		if( !file_exists( $dirname ) ) {
			mkdir( $dirname, 0766, true );
		}
		return file_put_contents( $dirname.'/'.$key, $value );
	}

	static function get( $dir, $key )
	{
		$path = 'cache/'.$dir.'/'.$key;
		if( !file_exists( $path ) ) return null;
		return file_get_contents( $path );
	}

	static function get_time( $dir, $key )
	{
		$dirname = 'cache/'.$dir;
		if( !file_exists( $dirname ) ) {
			return 0;
		}

		$path = $dirname.'/'.$key;
		if( !file_exists( $path ) ) {
			return 0;
		}

		return filemtime( $path );
	}
}

?>
