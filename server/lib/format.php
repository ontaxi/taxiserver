<?php
/*
 * Formats bytes to "human-readable" form.
 */
function format_bytes( $bytes )
{
	$units = array( 'B','kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' );

	$size = (float) $bytes;
	$i = 0;
	while( ($size / 1024) > 0.5 ){
		$size = $size / 1024;
		$i++;
	}
	return sprintf( "%.2f %s", $size, $units[$i] );
}

/*
 * Formats seconds to "human-readable" form.
 */
function format_seconds( $seconds )
{
	$t = $seconds;

	$s = $t % 60;
	$t = floor( $t / 60 );

	$m = $t % 60;
	$t = floor( $t / 60 );

	$h = $t % 24;
	$t = floor( $t / 24 );

	$d = $t;

	return sprintf( '%dd %dh %dm %ds', $d, $h, $m, $s );
}

/*
 * Takes array of dicts (representing rows with named or numbered
 * columns) and formats them as ASCII table.
 * $formats is a dict having sprintf format specifies for some or all
 * columns.
 */
function format_table( $arr, $formats = array() )
{
	if( empty( $arr ) ) {
		return '';
	}

	/*
	 * Apply formats, if any given.
	 */
	if( !empty( $formats ) )
	{
		foreach( $arr as $i => $row ) {
			foreach( $formats as $col => $format ) {
				$arr[$i][$col] = sprintf( $format, $row[$col] );
			}
		}
	}

	// Get rid of associative indexes of the table rows.
	$arr = array_values( $arr );

	// Get indexes of table columns (these may be associative).
	$header = array_keys( $arr[0] );

	// Add the header to the table.
	array_unshift( $arr, array_combine( $header, $header ) );

	$sizes = array();
	foreach( $header as $col )
	{
		// Get max. width of this column.
		$sizes[$col] = call_user_func_array( 'max',
			array_map( 'mb_strlen', array_column( $arr, $col ) )
		);
	}

	$cols_margin = 2;

	$total_size = array_sum( $sizes )
		+ $cols_margin * ( count( $sizes ) - 1 );

	$line = str_repeat( '-', $total_size );

	$s = $line . PHP_EOL;

	foreach( $arr as $i => $row )
	{
		// Print row.
		foreach( $header as $col )
		{
			/* If the strings are multibyte, then sprintf will count
			sizes wrong. Thus this manual filling. */
			$size = $sizes[$col];
			$v = $row[$col];
			$s .= $v;
			$w = mb_strlen( $v );
			if( $w < $size ) {
				$s .= str_repeat( ' ', $size - $w );
			}
			$s .= str_repeat( ' ', $cols_margin );
		}
		$s .= PHP_EOL;

		// If this is the header, underline it.
		if( $i == 0 ){
			$s .= $line.PHP_EOL;
		}
	}
	// Underline the table.
	$s .= $line.PHP_EOL;

	return $s;
}

?>
