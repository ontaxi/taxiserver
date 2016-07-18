<?php
/*
 * Sets the debugging error handler.
 */
function stop_on_error()
{
	set_error_handler( function( $level, $msg, $file, $line ) {
		if( !error_reporting() ) return;
		fwrite( STDERR, "\nError: $msg at $file:$line\n\n" );
		deb_print_source( $file, $line );
		deb_print_stack();
	});
}

function deb_print_stack()
{
	fwrite( STDERR, "The stack:\n" );
	/*
	 * Remove 2 last entries that are the __print_stack and the
	 * error handler calls.
	 */
	$stack = array_reverse( debug_backtrace() );
	foreach( $stack as $i => $info )
	{
		$f = $info['function'];
		if( isset( $info['class'] ) ) {
			$f = $info['class'].$info['type'].$f;
		}
		$call = $f;
		$args = "...";
		fwrite( STDERR, "$i\t$call($args)\n" );
	}
	fwrite( STDERR, "\n" );
}

function deb_print_source( $file, $line )
{
	/*
	 * Define the range of lines to print.
	 */
	$margin = 4;
	$line--; // make it count from zero.
	$l1 = $line - $margin;
	if( $l1 < 0 ) $l1 = 0;
	$l2 = $line + $margin;

	$lines = file( $file );
	$n = count( $lines );
	if( $l2 >= $n ) {
		$l2 = $n - 1;
	}

	for( $i = $l1; $i <= $l2; $i++ )
	{
		/*
		 * If this is the error line, mark it with an arrow.
		 */
		if( $i == $line ) {
			fwrite( STDERR, "->" );
		}
		/*
		 * Print the line number and the line itself.
		 */
		fprintf( STDERR, "\t%d\t%s", $i + 1, $lines[$i] );
	}
	fwrite( STDERR, "\n" );
}

?>
