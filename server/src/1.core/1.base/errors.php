<?php

set_error_handler( 'errors::on_error' );
register_shutdown_function( 'errors::on_shutdown' );

function warning( $message ) {
	errors::warn( $message );
}

function error( $message ) {
	trigger_error( $message, E_USER_ERROR );
}

function fatal( $message ) {
	trigger_error( $message );
	err( "Fatal: $message" );
	exit(1);
}

conf_add( 'debug', function( $debug ) {
	errors::$debug = $debug;
});

class errors
{
	static $debug = false;

	static function warn( $message )
	{
		logmsg( "Warning: $message" );
		err( "Warning: $message" );
		if( self::$debug ) {
			memlog_dump( $message );
		}
	}

	private static function stop( $msg = null )
	{
		if( $msg ) {
			logmsg( "stop: $msg" );
			fprintf( STDERR, "\nstop: %s\n\n", $msg );
		}
		echo chr( 7 ); // bell
		exit(1);
	}

	static function on_shutdown()
	{
		$e = error_get_last();
		if( $e ) {
			logmsg( "$e[message] at $e[file]:$e[line]" );
		}
		logmsg( "Shutdown" );
	}

	static function on_error( $num, $str, $file, $line )
	{
		if( !error_reporting() ) return;

		$msg = "Error: $str at $file:$line";
		logmsg( $msg );
		err( $msg );

		if( self::$debug ) {
			memlog_dump( $str );
			fwrite( STDERR, "\nError: $str\n\n" );
			deb_print_source( $file, $line );
			deb_print_stack();
			self::stop();
		}
	}
}

?>
