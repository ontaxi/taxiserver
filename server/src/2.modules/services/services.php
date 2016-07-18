<?php
/*
 * Some service-wide options and other information are stored in the
 * database in the service record. Some of them can be queried very
 * often, so we cache the row to reduce the overhead.
 */

/*
 * The cache lifetime is limited to allow changing service options
 * without having to restart the server.
 */
create_cache( 'service_options', 300 );

/*
 * Returns value of the given option for the given service.
 */
function service_option( $sid, $name ) {
	return _services::option( $sid, $name );
}

function service_setting( $sid, $name, $default = null ) {
	return alt( service_settings::get_value( $sid, $name ), $default );
}

class _services
{
	static function option( $sid, $name )
	{
		$v = get_cache( 'service_options', $sid );
		/*
		 * If there is no cached row, load from the database.
		 */
		if( !$v )
		{
			$v = DB::getRecord( "SELECT * FROM taxi_services
				WHERE service_id = %d", $sid );
			if( !$v ) {
				warning( "Unknown service #$sid" );
				return null;
			}
			set_cache( 'service_options', $sid, $v );
		}

		if( !array_key_exists( $name, $v ) ) {
			warning( "Unknown service option: '$name'" );
			return null;
		}
		return $v[$name];
	}
}

?>
