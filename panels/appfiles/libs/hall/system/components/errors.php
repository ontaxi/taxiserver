<?php

class Errors
{
	/* This variable will be set to true after any error. This is used
	as indicator to avoid a loop where error handler causes error
	itself. */

	private static $error = false;

	/* All errors are directed here, from strict notices to fatal
	errors. MySQL warnings and errors too. */

	static function error( $message )
	{
		/* If $error flag is set to true, then this is the second call
		to the error, which means that the first call to the error
		has caused another error. */
		if( self::$error )
		{
			ob_destroy();
			if( !setting( 'debug' ) ) {
				die( "Internal server error" );
			}

			echo "<samp>$message</samp><br>";
			echo "Error loop occured, terminating<br>";

			/* This call can potentially also cause an error,
			continuing the loop. We use it here only for the
			debug configuration. */

			self::log( $message );
			self::log( "Error loop occured, terminating." );
			exit;
		}

		self::$error = true;
		self::log( $message . "\t" . CURRENT_URL . "\t" . USER_AGENT . PHP_EOL );

		if( setting( 'debug' ) )
		{
			/*
			 * If we got an error inside a tag, close it first so that
			 * the error message won't get hidden by the tag.
			 */
			$src = ob_get_contents();
			$pos_o = strrpos( $src, '<' );
			if( $pos_o )
			{
				$pos_c = strrpos( $src, '>' );
				if( !$pos_c || $pos_c < $pos_o ) {
					echo '>">';
				}
			}

			//ob_destroy();
			echo $message;

			$tr = array_reverse( debug_backtrace() );
			$t = new table();
			foreach( $tr as $r )
			{
				$f = $r['function'];
				if( isset( $r['class'] ) ) {
					$f = $r['class'].$r['type'].$f;
				}
				$t->add_row( array(
					'function' => $f
				));
			}

			echo $t;
			exit;
		}

		self::error_server(); // show "internal server error"
	}

	static function error_notfound() {
		log_message( CURRENT_URL."\t".USER_AGENT."\t".$_SERVER["REMOTE_ADDR"], "404" );
		self::http_error( '404' );
	}

	static function error_forbidden() {
		self::http_error( '403' );
	}

	private static function error_server() {
		self::http_error( '500' );
	}

	private static function http_error( $code )
	{
		ob_destroy();
		$codes = array(
			'403' => 'Forbidden',
			'404' => 'Not Found',
			'500' => 'Internal Server Error'
		);

		if( !isset( $codes[$code] ) ) {
			warning( "Unknown http status code: $code" );
			$code = '500';
		}

		$str = $codes[$code];

		$s = self::try_template( ':' . $code );
		if( !$s ) $s = $str;

		header( "$_SERVER[SERVER_PROTOCOL] $code $str" );
		echo $s;
		exit;
	}

	private static function try_template( $node_string )
	{
		$node = parse_node_string( $node_string );
		$src = S::get_template( $node );
		return $src;
	}

	private static function log( $message, $add_user_info = false )
	{
		if( $add_user_info ){
			$message .= "\t". USER_AGENT;
		}
		log_message( $message, 'errors' );
	}
}

?>
