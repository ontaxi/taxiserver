<?php

function input_datetime( $time ) {
	return date( 'Y-m-d', $time ) . 'T' . date( 'H:i:s', $time );
}

/*
 * Takes raw phone number string and formats it nicely.
 * The format is "+375 <code> <3d>-<2d>-<2d>".
 */
function format_phone( $str )
{
	if( !$str ) return $str;
	$original = $str;
	if( strpos( $str, "+375" ) === 0 ) {
		$str = substr( $str, 4 );
	}

	$str = preg_replace( '/[^\d]/', '', $str );

	$parts = array(
		substr( $str, 0, 2 ),
		substr( $str, 2, 3 ),
		substr( $str, 5, 2 ),
		substr( $str, 7 )
	);

	if( $parts[3] == '' ) return $original;

	$s = '+375 ' . array_shift( $parts );
	if( count( $parts ) > 0 ) {
		$s .= ' ' . implode( '-', $parts );
	}
	return $s;
}

?>
