<?php

function show_var( $var ) {
	echo format_var( $var ), PHP_EOL;
}

function format_var( $var, $max_length = 64, $max_arr = 64 )
{
	if( $var === null ) return 'null';
	if( is_bool( $var ) ) return $var ? 'true' : 'false';
	if( is_array( $var ) ) return format_array( $var, $max_arr );
	if( is_int( $var ) ) return "int: $var";
	if( is_float( $var ) ) return "float: $var";

	if( is_object( $var ) )
	{
		$s = 'object '.get_class( $var );
		if( method_exists( $var, '__toString' ) ){
			$s .= ": $var";
		}
		return $s;
	}

	if( is_string( $var ) )
	{
		if( $max_length != -1 && strlen( $var ) > $max_length ){
			$v = substr( $var, 0, $max_length - 3 )."...";
		} else{
			$v = $var;
		}
		return '"'.$v.'"';
	}

	// shouldn't occur
	return "(type): $var";
}

function format_array( $arr, $max_arr = 64 )
{
	if( !is_array( $arr ) ) {
		trigger_error( 'format_array: given variable is not an array.' );
		return format_var( $arr );
	}

	$parts = array();
	$i = 0;
	$max_len = 0;
	foreach( $arr as $k => $var )
	{
		if( $i++ == $max_arr ) {
			$parts[] = '...';
			break;
		}
		$s = "[$k] => ".format_var( $var );
		$parts[] = $s;

		$len = strlen( $s );
		if( $len > $max_len ) {
			$max_len = $len;
		}
	}

	/*
	 * If elements are compact enough, show them inline.
	 */
	if( $max_len < 20 ) {
		return '['.implode( ', ', $parts ).']';
	}

	$s = '['.PHP_EOL;
	$n = count( $parts );
	$i = 0;
	foreach( $parts as $k => $part )
	{
		$s .= "\t".str_replace( "\n", "\n\t", $part );
		if( $i < $n-1 ) {
			$s .= ",";
		}
		$i++;
		$s .= PHP_EOL;
	}
	$s .= ']';
	return $s;
}

?>
