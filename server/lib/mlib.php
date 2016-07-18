<?php

define( 'MLIB_PATH', dirname( __FILE__ ) . '/' );

// Determine whether we are on a command line interface.
define( 'IS_CLI', (PHP_SAPI == 'cli') );

error_reporting( -1 );

date_default_timezone_set( 'UTC' );
mb_internal_encoding( 'UTF-8' );

function get_backtrace()
{
	$output = array();
	$t = array_reverse( debug_backtrace() );
	$output[] = 'Trace:';
	foreach( $t as $i => $o )
	{
		$f = $o['function'];
		if( isset( $o['class'] ) ) {
			$f = $o['class'].$o['type'].$f;
		}
		$call = $f;
		$call .= '('._format_args( $o['args'] ) .')';
		$output[] = '-> '.$call;
	}
	return $output;
}

function _format_args( $args )
{
	$parts = array();
	foreach( $args as $arg ) {
		$parts[] = format_var( $arg, 32, 10 );
	}
	return implode( ', ', $parts );
}

/*
 * Shared classes use this function. In this environment everything is
 * included statically, so this function shouldn't do anything.
 */
function mlib_load() {
	// Nothing.
}

/*
 * lib() is also a function from shared classes.
 */
function lib() {
	// Nothing.
}

?>
