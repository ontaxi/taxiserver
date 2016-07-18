<?php
// Allows convenient querying values from superglobals.

class Vars
{
	// For $_GET
	static function get( $key )
	{
		$v = self::get_value( $_GET, $key );
		// _GET values are already decoded, no need for urldecode.
		return $v;
	}
	static function gets( $prefix )
	{
		$v = self::get_values_by_prefix( $_GET, $prefix );
		return array_map( "urldecode", $v );
	}

	// For $_POST
	static function post( $key ){
		return self::get_value( $_POST, $key );
	}
	static function posts( $prefix ){
		return self::get_values_by_prefix( $_POST, $prefix );
	}

	static function postsl( $__list__ ){
		$args = func_get_args();
		return call_user_func( 'Vars::get_values_by_list', $_POST, $args );
	}


	// Implementation
	private static function get_values_by_prefix( &$arr, $prefix )
	{
		$values = array();
		$keys = array_keys( $arr );
		$out_key = "";

		foreach( $keys as $key )
		{
			if( $prefix == '' || strpos( $key, $prefix ) === 0 )
			{
				$out_key = substr( $key, strlen( $prefix ) );
				if( $out_key === "" ){
					continue;
				}
				$values[$out_key] = self::get_value( $arr, $key );
			}
		}
		return $values;
	}

	private static function get_values_by_list( &$arr, $keys )
	{
		$result = array();
		foreach( $keys as $key ){
			$result[$key] = self::get_value( $arr, $key );
		}
		return $result;
	}

	private static function get_value( &$arr, $key )
	{
		if( get_magic_quotes_gpc() ){
			$key = addslashes( $key );
		}

		if( !isset( $arr[$key] ) ){
			return null;
		}

		$value = $arr[$key];
		if( get_magic_quotes_gpc() ){
			$value = self::strip_slashes( $value );
		}

		$value = self::trim( $value );
		return $value;
	}

	private static function strip_slashes( &$var )
	{
		if( is_array( $var ) ){
			foreach( $var as $k => $v ){
				$var[$k] = self::strip_slashes( $v );
			}
			return $var;
		}
		else{
			return stripslashes( $var );
		}
	}

	private static function trim( $v )
	{
		if( is_array( $v ) )
		{
			foreach( $v as $k => $l ){
				$v[$k] = self::trim( $l );
			}
		}
		else $v = trim( $v );

		return $v;
	}
}

?>
