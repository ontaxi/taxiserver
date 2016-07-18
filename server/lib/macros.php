<?php

function alt( $value1, $value2 )
{
	$args = func_get_args();
	$n = count( $args );
	for( $i = 0; $i < $n; $i++ ){
		if( $args[$i] ){
			return $args[$i];
		}
	}
	return $args[$n-1];
}

function array_alt( $array, $key, $default_value )
{
	if( array_key_exists( $key, $array ) ) {
		return $array[$key];
	}
	else return $default_value;
}

function is_closure( $f ) {
	static $test = null;
	if( !$test ) $test = function() {};
	return is_object( $f ) && $f instanceof $test;
}

?>
