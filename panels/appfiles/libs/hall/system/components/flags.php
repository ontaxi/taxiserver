<?php
class flags
{
	static function update_flag( $name )
	{
		$dir = 'cache/flags/';
		$path = $dir.$name;

		if( !file_exists( $dir ) ) {
			mkdir( $dir, 0777, true );
		}
		touch( $path );
	}

	static function get_flag_time( $name )
	{
		$dir = 'cache/flags/';
		if( !file_exists( $dir ) ) {
			mkdir( $dir, 0777, true );
		}

		$path = $dir.$name;
		if( !file_exists( $path ) ) {
			touch( $path );
		}

		return filemtime( $path );
	}
}
?>
