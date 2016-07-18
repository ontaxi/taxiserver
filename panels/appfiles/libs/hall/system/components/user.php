<?php

/*
This is a specialized session interface for storing authentication
results. Common tasks are "remembering" user "login", user id and user
type. Not all of them are required. The most frequently used parameter
is "type". Actions (see actions implementation and description) are
accessed based on user types. Following is "id" that is used mostly for
getting data from the database. And finally, login can be remembered
mostly for display purposes, but also sometimes for getting data too.

The only intended function to be used by applications is the high-level
"set( $type, $id, $login )". The type parameter is required, and id and
login are optional. Note that changing one of the parameters should
invalidate the two others. That's why the "set" function is recommended.
The more specific set_login, set_type and set_id are provided
experimentally.

There may also be need for storing some arbitrary data along with the
authentication results. This is done using set_data and get_data. When
the main parameter are changed (using set), this data is reset.

The question is whether we should confine this module solely to
authentication data or let it also handle arbitrary data. The answer
becomes more apparent when thinking about what that data might be. If it
is not associated with the user, then it should not be in the session.
So that arbitrary data ("shopping cart", for example) is tied to the
user. And it also becomes evident that that data must be cleared when
the user logs out, or otherwise another user could log in and see the
"shopping cart" of the previous user.
*/

class user
{
	const KEY_PREFIX = '_userdata_';

	static function set( $type, $id = null, $login = null )
	{
		self::sclean();
		self::sset( 'type', $type );
		self::sset( 'id', $id );
		self::sset( 'login', $login );
	}

	static function set_type( $type ) {
		self::sset( 'type', $type );
	}

	static function set_login( $name ) {
		self::sset( 'login', $name );
	}

	static function set_id( $id ) {
		self::sset( 'id', $id );
	}

	static function get_type() {
		return self::sget( 'type' );
	}

	static function get_login() {
		return self::sget( 'login' );
	}

	static function get_id() {
		return self::sget( 'id' );
	}


	static function set_data( $key, $value ) {
		self::sset( 'data-'.$key, $value );
	}

	static function get_data( $key ) {
		return self::sget( 'data-'.$key );
	}

	private static function sset( $key, $value )
	{
		$key = self::KEY_PREFIX . $key;
		$s = &self::s();
		if( $value === null ){
			unset( $s[$key] );
		} else {
			$s[$key] = $value;
		}
	}

	private static function sget( $key, $default = null )
	{
		$key = self::KEY_PREFIX . $key;
		$s = &self::s();
		if( !isset( $s[$key] ) ){
			return $default;
		} else {
			return $s[$key];
		}
	}

	/*
	 * Unsets all data that has been set by this module.
	 */
	private static function sclean()
	{
		$s = &self::s();
		foreach( $s as $k => $v )
		{
			if( strpos( self::KEY_PREFIX, $k ) === 0 ) {
				unset( $s[$k] );
			}
		}
	}

	/*
	 * Initializes the session if needed.
	 * Returns a reference to the $_SESSION superglobal.
	 */
	private static function &s()
	{
		if( !isset( $_SESSION )  ){
			session_start();
		}
		return $_SESSION;
	}
}

?>
