<?php
/*
 * A wrapper around crypt function to use the Blowfish hashing.
 */
// License: MIT (https://opensource.org/licenses/MIT)
function bcrypt_check( $pass, $hash ) {
	return bcrypt::check( $pass, $hash );
}

/*
 * Cost is a number between 4 and 31 (inclusive). It results in running
 * time multiplied by 2^cost. >= 10 is recommended.
 */
function bcrypt( $str, $cost = 10 ) {
	return bcrypt::crypt( $str, $cost );
}

class bcrypt
{
	const SALT_SIZE = 22;

	private static $alpha = null;
	private static $alpha_size;

	static function crypt( $str, $cost )
	{
		if( !CRYPT_BLOWFISH ) {
			trigger_error( "bcrypt: missing Blowfish support" );
			return '';
		}

		$cost = intval( $cost );
		if( $cost < 4 || $cost > 31 ) {
			trigger_error( "bcrypt: cost parameter must be an integer in range [4..31]" );
			return '';
		}

		if( strlen( $str ) > 72 ) {
			trigger_error( 'bcrypt: the input string will be truncated to 72 characters.' );
		}

		$salt = sprintf( '$2y$%02d$%s', $cost, self::salt() );
		return crypt( $str, $salt );
	}

	private static function salt()
	{
		if( !self::$alpha )
		{
			self::$alpha = './0123456789'
				.'abcdefghijklmnopqrstuvwxyz'
				.'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			self::$alpha_size = strlen( self::$alpha );
		}

		$rand = openssl_random_pseudo_bytes( self::SALT_SIZE, $ok );
		if( !$ok ) {
			trigger_error( "Weak openssl generator" );
			return '';
		}

		$s = '';
		for( $i = 0; $i < self::SALT_SIZE; $i++ )
		{
			// Fold 0-255 to 0-64 and use as index in the alphabet.
			$n = ord($rand[$i]) % self::$alpha_size;
			$s .= self::$alpha[$n];
		}

		return $s;
	}

	static function check( $pass, $hash )
	{
		/*
		 * Sane way is just to compare the two hashes.
		 */
		return $hash === crypt( $pass, $hash );
		/*
		 * A fancy way would be to pretend that someone will bother
		 * trying a timing attack and to make sure that every call to
		 * this function involves the same amount of all operations.
		 */
	}
}

?>
