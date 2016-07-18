<?php
/*
 * Returns its first non-"empty" argument or the last argument if all
 * are "empty".
 * alt( "hello", "world" ) // "hello"
 * alt( "", "world" ) // "world"
 */
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

function array_index( $a, $key )
{
	return array_combine( array_column( $a, $key ), $a );
}

?>
