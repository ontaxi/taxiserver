<?php

/* Generates password hashes and checks passwords against stored hashes.
Hash generation:
1. $salt = random salt
2. $hash = $salt . $password
3. repeat( $hash = md5( $hash ) ) for some given time (about 10 ms
by default), but not less than 10 times.
4. $hash = $hash . $salt . (number of iterations in hexademical form)

Hash checking is similar, salt and number of iterations are
substrings of the result hash. */

class PasswordHash
{
	const SALT_SIZE = 10;
	const HASH_SIZE = 32;
	const MIN_ITERATIONS = 10;

	static function generate( $password, $time_ms = 10 )
	{
		$salt = substr( md5( uniqid() ), 0, self::SALT_SIZE );
		$hash = $salt.$password;

		$i = 0;
		$t = microtime(true) + $time_ms / 1000;

		while( microtime(true) < $t ) {
			$hash = md5( $hash );
			$i++;
		}
		while( $i < self::MIN_ITERATIONS ) {
			$hash = md5( $hash );
			$i++;
		}

		return $hash . $salt . dechex( $i );
	}

	static function test( $password, $hash )
	{
		$ch = substr( $hash, self::SALT_SIZE + self::HASH_SIZE );
		$c = hexdec( $ch );
		$salt = substr( $hash, self::HASH_SIZE, self::SALT_SIZE );
		$hash = substr( $hash, 0, self::HASH_SIZE );

		$test_hash = $salt.$password;
		for( $i = 0; $i < $c; $i++ ){
			$test_hash = md5( $test_hash );
		}
		return $test_hash == $hash;
	}
}

?>
