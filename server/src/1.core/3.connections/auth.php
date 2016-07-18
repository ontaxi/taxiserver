<?php
/*
 * Add authorisation function.
 */
function add_auth_func( $f ) {
	auth::add_func( $f );
}

class auth
{
	/*
	 * Array of authorisation procedures.
	 */
	private static $list = array();

	/*
	 * Register an authorisation function.
	 */
	static function add_func( $func )
	{
		if( !is_callable( $func ) ) {
			error( "Function '$func' is not callable" );
		}
		self::$list[] = $func;
	}

	/*
	 * Authorise the connection. Returns a conn_user object or null.
	 */
	static function authorise( $client, $msg )
	{
		$cid = $client->cid;
		debmsg( "authorising $cid" );

		/*
		 * Call all registered autorization functions.
		 * Expect a conn_user object, false, or null.
		 * Null means "continue", false means "failed, stop".
		 */
		$user = null;
		foreach( self::$list as $f )
		{
			$user = call_user_func( $f, $cid, $msg, $client );
			if( $user || $user === false ) break;
		}

		if( $user && (!$user instanceof conn_user) ) {
			error( "authorise: conn_user instance expected" );
			$user = null;
		}

		if( !$user ) {
			logmsg( "Authorisation failed: $cid, $msg" );
			return null;
		}
		return $user;
	}

}

?>
