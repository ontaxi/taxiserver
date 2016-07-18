<?php
/*
 * Generic framework for scripts in the "dx" directory.
 */
class dx
{
	static $oldformat = false;

	/*
	 * dx::init is called when some special actions have to be taken
	 * before dispatching. A page may have multiple calls to init.
	 * If the given function returns a non-null value, it is formatted
	 * and sent to the browser, and subsequent inits are not called.
	 */
	static function init( $func )
	{
		$r = $func();
		if( $r ) {
			self::output( $r );
		}
	}

	/*
	 * Outputs value returned by a call to the function named q_$query
	 * with arguments starting from _args_. If $query is not in the
	 * $allowed_queries array, an error is output.
	 */
	static function dispatch( $query, $allowed_queries, $_args_ = null )
	{
		if( !$query || !in_array( $query, $allowed_queries ) ) {
			error_notfound();
		}

		$args = func_get_args();
		$args = array_slice( $args, 2 );
		$f = 'q_'.str_replace( '-', '_', $query );
		$r = call_user_func_array( $f, $args );
		self::output( $r );
	}

	static function output( $r )
	{
		if( self::$oldformat )
		{
			if( !isset( $r['errno'] ) ) {
				$r['errno'] = 0;
				$r['errstr'] = 'ok';
			}
		}
		else
		{
			if( isset( $r['__err'] ) ) {
				$r = $r['__err'];
			}
			else {
				$r = array(
					'data' => $r,
					'errno' => 0,
					'errstr' => 'ok'
				);
			}
		}

		announce_json();
		echo json_encode( $r );
		exit;
	}

	/*
	 * Standard error response.
	 */
	static function error( $errstr )
	{
		$err = array( 'errno' => 1, 'errstr' => $errstr );
		if( self::$oldformat ) {
			return $err;
		}
		else {
			return array( '__err' => $err );
		}
	}

	/*
	 * Standard success response.
	 */
	static function ok() {
		$err = array( 'errno' => 0, 'errstr' => 'ok' );
		if( self::$oldformat ) {
			return $err;
		}
		else {
			return array( '__err' => $err );
		}
	}

	static function to_int( $val ) {
		return ($val === null)? $val : intval($val);
	}

	static function to_float( $val ) {
		return ($val === null)? $val : floatval($val);
	}
}

?>
