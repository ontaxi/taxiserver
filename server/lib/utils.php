<?php

/*
 * Sort table by given column in ascending order.
 */
function column_sort( &$array, $column )
{
	static $cmp = array();

	if( count( $array ) < 2 ) {
		return;
	}

	if( !isset( $cmp[$column] ) )
	{
		$cmp[$column] = create_function( '$a, $b', '
			return $a[\''.$column.'\'] - $b[\''.$column.'\'];
		');
	}
	usort( $array, $cmp[$column] );
}

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
