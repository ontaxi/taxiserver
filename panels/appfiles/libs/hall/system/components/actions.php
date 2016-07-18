<?php

// REV: would it do any good to add link rel="canonical" on a page with
// action* query vars to a page without them?

/*
 * As there is no reliable way to keep state in the session, we add
 * special query vars to indicate that the page has been loaded after
 * some action.
 */

/*
 * The datakey is a session key which can be used to get data associated
 * with the last action. The data is what was submitted to the action
 * in _POST and _GET globals, plus any errors that the action returned.
 */

/*
 * Example:

$_GET:
	action-name=login
	action-result=0
	action-datakey=8fe23fa

$_SESSION:
	8fe23fa:
		__errors: array( "Wrong password" )
		login: "johnsmith"
		password: "qwerty"
*/

class Actions
{
	const QUERYKEY_ACTION_NAME = 'action-name';
	const QUERYKEY_ACTION_RESULT = 'action-result';
	const QUERYKEY_ACTION_DATAKEY = 'action-datakey';

	const DATAKEY_ACTION_ERRORS = '__action-errors';

	// Tells what was the last action.
	static function last_action_name()
	{
		return Vars::get( self::QUERYKEY_ACTION_NAME );
	}

	// Returns errors the last action returned.
	static function last_action_errors( $action_name = null )
	{
		$last_action = self::last_action_name();
		if( !$last_action ) return null;

		// If the last action is not the one we are interested in,
		// return.
		if( $action_name && $action_name != $last_action ){
			return null;
		}

		// Get the data that the action had.
		$data = self::last_action_data();

		// If the data has error messages, return them.
		if( isset( $data[self::DATAKEY_ACTION_ERRORS] ) ){
			return $data[self::DATAKEY_ACTION_ERRORS];
		} else {
			return null;
		}
	}

	//
	// Runs an action
	//
	static function run_action( $node )
	{
		$action_name = $node->name;

		/* In action names dashes are treated as underscores. */
		$action_name = str_replace( '-', '_', $action_name );

		/*
		 * Actions are functions defined in special files. Those files
		 * must be included only from here. If the function is already
		 * defined, then it is an illegal call.
		 */
		if( function_exists( $action_name ) ) {
			warning( "Trying to access function '$action_name' as action." );
			error_forbidden();
		}

		/* We have to find the action among the action files. */
		$paths = array_merge(
			array( append_path( APPLICATION_PATH, 'actions.php' ) ),
			glob( append_path( APPLICATION_PATH, 'actions/'.'*.php') )
		);

		foreach( $paths as $path )
		{
			if( !file_exists( $path ) ) continue;

			/* Reset access to default level. The actions fill override
			it if necessary. */
			self::set_access_list( 'admin' );

			require_once( $path );
			if( function_exists( $action_name ) ){
				break;
			}
		}

		if( !function_exists( $action_name ) ){
			warning( "Could not find action '$action_name'" );
			error_notfound();
			return null;
		}

		if( !self::user_has_access() )
		{
			warning( "Denied access to action '$action_name', user type = '".user::get_type()."'" );

			if( user::get_type() ) {
				error_forbidden();
			} else {
				error_unauthorized();
			}
		}

		$redirect_success = $node->ext_args['redirect_success'];
		$redirect_error = alt( $node->ext_args['redirect_error'], $redirect_success );

		// run the action

		ob_start();
		$result = call_user_func( $action_name );
		$out = ob_get_clean();

		/* To indicate an error, the action can return false, an error
		message (a string), or an array of error messages. */
		$errors = array();
		if( $result === false ){
			$errors[] = "Unknown error";
		}
		else if( is_string( $result ) ){
			$errors[] = $result;
		}
		else if( is_array( $result ) ){
			$errors = $result;
		}

		$error = !empty( $errors );

		$redirect_path = !empty( $errors ) ?
			$redirect_error : $redirect_success;

		/* If "ajax" parameter is added to the URL, redirect paths are
		ignored and the result is reported in plain text. */

		if( Vars::get( "ajax" ) || !$redirect_path )
		{
			$reply = array(
				'status' => $error ? 'error' : 'ok',
				'errors' => $errors
			);
			announce_json();
			echo json_encode( $reply );
			exit;
		}


		$url = new URL_HTTP( $redirect_path );
		$url->query_var( self::QUERYKEY_ACTION_NAME, $action_name );
		$url->query_var( self::QUERYKEY_ACTION_RESULT, $error ? '0' : '1' );

		if( $error )
		{
			// cast the error result to array
			if( $result === false ){
				$result = array( 'Requested action error' );
			} else if( is_string( $result ) ){
				$result = array( $result );
			}
			// pack the action data
			$data_id = self::pack_action_data( $result );
			$url->query_var( self::QUERYKEY_ACTION_DATAKEY, $data_id );
		}
		else
		{
			$url->query_var( self::QUERYKEY_ACTION_DATAKEY, null );
		}
		redirect( $url );
	}

	private static function pack_action_data( $errors = false )
	{
		$data = array_merge( $_GET, $_POST );
		if( is_array( $errors ) ){
			$data[self::DATAKEY_ACTION_ERRORS] = $errors;
		}
		$key = uniqid();
		user::set_data( $key, serialize( $data ) );
		return $key;
	}

	/*
	 * If action name is not given, returns the result regardless of
	 * what was the action. Otherwise, checks first if the last action
	 * name is the one given.
	 */
	static function last_action_result( $action_name = null )
	{
		if( $action_name && self::last_action_name() != $action_name ){
			return null;
		}

		$r = Vars::get( self::QUERYKEY_ACTION_RESULT );
		if( $r === '1' ){
			return true;
		} else if( $r === '0' ){
			return false;
		} else {
			return null;
		}
	}

	//
	// Returns data sent to the last action.
	// If the key is given, returns only the value under that key.
	// If no key given, return all the data for the action.
	//
	static function last_action_data( $action_name = null, $key = null )
	{
		// If there was no action, return.
		$last_action = self::last_action_name();
		if( !$last_action ) return null;

		// If the last action is not the one we are interested in,
		// return null.
		if( $action_name && ($action_name != $last_action ) ){
			return null;
		}

		// Get the session key for the data.
		$id = Vars::get( self::QUERYKEY_ACTION_DATAKEY );
		if( !$id ) return null;

		// Get and unpack the data.
		$data = user::get_data( $id );
		if( !$data ) return null;
		$data = unserialize( $data );

		// If no specific key is given, return all the data.
		if( !$key ) return $data;

		// If the key is given, return the value for that key.
		if( isset( $data[$key] ) ){
			return $data[$key];
		} else {
			return null;
		}
	}

	static function clean_action_data()
	{
		$id = Vars::get( self::QUERYKEY_ACTION_DATAKEY );
		if( !$id ){
			return null;
		}
		user::set_data( $id, null );
	}

	private static $access_list = array();
	static function set_access_list( $list )
	{
		if( is_string( $list ) ){
			$list = array_map( 'trim', explode( ',', $list ) );
		}
		self::$access_list = $list;
	}

	static function user_has_access()
	{
		$user_type = user::get_type();
		foreach( self::$access_list as $type )
		{
			if( $type == 'all' || $user_type == $type ){
				return true;
			}
		}
		return false;
	}
}

?>
