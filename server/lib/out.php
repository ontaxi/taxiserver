<?php

/*
 * Write a message to stderr.
 */
function err( $message )
{
	$m = date( 'd.m.Y H:i:s' ) . "\t" . $message . PHP_EOL;
	fwrite( STDERR, $m );
}

function out( $message )
{
	$m = date( 'd.m.Y H:i:s' ). "\t" . $message . PHP_EOL;
	fwrite( STDOUT, $m );
}

function deb( $msg, $___ = null ) {
	$args = func_get_args();
	$line = call_user_func_array( 'sprintf', $args );
	echo "\n *** $line *** \n";
}

?>
