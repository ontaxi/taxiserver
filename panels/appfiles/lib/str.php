<?php
/*
 * Makes first letter uppercase.
 */
function mb_ucfirst( $s )
{
	$first = mb_substr( $s, 0, 1 );
	$rest = mb_substr( $s, 1 );
	return mb_strtoupper( $first ).mb_strtolower( $rest );
}
?>
