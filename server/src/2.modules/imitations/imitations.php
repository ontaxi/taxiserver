<?php
/*
 * Imitations module.
 */

/*
 * Tells whether imitation is turned on for the given taxi.
 */
function is_imitation( $taxi_id ) {
	return mod_imitations::is_imitation( $taxi_id );
}

function set_imitation_online( $taxi_id, $online ) {
	mod_imitations::set_online( $taxi_id, $online );
}

$ns = 'mod_imitations::';
mod_imitations::$conn = new conn_imitations();
conn::register_interface( mod_imitations::$conn );

class mod_imitations
{
	static $conn;

	static function is_imitation( $taxi_id )
	{
		return DB::getValue( "SELECT is_fake
			FROM taxi_drivers
			WHERE acc_id = %d", $taxi_id );
	}

	static function set_online( $taxi_id, $online )
	{
		if( $online ) {
			self::$conn->_add_connection( $taxi_id );
		}
		else {
			self::$conn->_disconnect( $taxi_id );
		}

		DB::exec( "UPDATE taxi_drivers
			SET is_online = %d
			WHERE acc_id = %d", $online ? 1 : 0, $taxi_id );
	}
}
?>
