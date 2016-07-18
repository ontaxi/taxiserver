<?php

class taxi_accounts
{
	const T = 'taxi_accounts';

	static function create( $type, $login, $password )
	{
		lib( 'bcrypt' );
		return DB::insertRecord( self::T, array(
			'type' => $type,
			'login' => $login,
			'password_hash' => bcrypt( $password )
		));
	}

	static function delete( $acc_id )
	{
		return DB::updateRecord( self::T,
			array(
				'password_hash' => 'deleted',
				'old_password_hash' => null,
				'login' => null,
				'deleted' => 1
			),
			array( 'acc_id' => $acc_id )
		);
	}

	static function exists( $type, $login )
	{
		return DB::exists( self::T, array(
			'type' => $type,
			'login' => $login
		));
	}

	static function get_login( $acc_id )
	{
		return DB::getValue( "SELECT login FROM ".self::T."
			WHERE acc_id = %d", $acc_id );
	}

	static function get_type( $acc_id )
	{
		return DB::getValue( "SELECT type FROM ".self::T."
			WHERE acc_id = %d", $acc_id );
	}

	/*
	 * Returns acc_id or null.
	 */
	static function check( $type, $login, $password )
	{
		lib( 'bcrypt' );
		$r = DB::getRecord( "SELECT acc_id, password_hash
			FROM ".self::T."
			WHERE `type` = '%s' AND login = '%s' AND deleted = 0",
			$type, $login
		);
		if( !$r ) {
			return null;
		}

		$acc_id = $r['acc_id'];

		if( bcrypt_check( $password, $r['password_hash'] ) ) {
			return $acc_id;
		}
		return null;
	}

	static function service_id( $acc_id )
	{
		return DB::getValue( "SELECT service_id FROM ".self::T."
			WHERE acc_id = %d", $acc_id );
	}

	/*
	 * Returns acc_id or null.
	 */
	static function check_token( $token )
	{
		return DB::getValue( "SELECT acc_id FROM ".self::T."
			WHERE token = '%s'
			AND token_expires > NOW()", $token );
	}

	/*
	 * Generates and returns a new token for given account.
	 */
	static function new_token( $acc_id, $lifetime = 86400 )
	{
		$tok = md5(uniqid( true ));
		DB::exec( "START TRANSACTION" );
		while( DB::exists( self::T, array( 'token' => $tok ) ) ) {
			warning( "Token collision: $tok" );
		}

		DB::exec( "UPDATE ".self::T."
			SET token = '%s',
				token_expires = DATE_ADD(NOW(), INTERVAL %d SECOND)
			WHERE acc_id = %d",
			$tok, $lifetime, $acc_id );

		DB::updateRecord( self::T,
			array( 'token' => $tok,  ),
			array( 'acc_id' => $acc_id )
		);

		DB::exec( "COMMIT" );

		return $tok;
	}

	static function change_password( $acc_id, $pass )
	{
		lib( 'bcrypt' );
		return DB::updateRecord( self::T,
			array( 'password_hash' => bcrypt( $pass ),
				'old_password_hash' => null ),
			array( 'acc_id' => $acc_id )
		);
	}
}

?>
