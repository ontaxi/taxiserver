<?php

conf_add( 'nominatim_url', function( $url ) {
	__addr::$url = $url;
});

function point_address( $lat, $lon ) {
	return __addr::point_address( $lat, $lon );
}

function address_point( $str ) {
	return __addr::address_point( $str );
}

class __addr
{
	static $url = null;

	/*
	 * Returns address for the given point as a string.
	 */
	static function point_address( $lat, $lon )
	{
		logmsg( sprintf( "Getting address for (%.7f, %.7f)", $lat, $lon ) );

		$url = self::$url;
		if( !$url ) {
			warning( "Nominatim URL not defined" );
			return null;
		}
		$url .= "/reverse?format=json&lat=$lat&lon=$lon&addressdetails=1";

		$obj = self::get( $url, $err );
		if( $err ) {
			warning( "Couldn't get point address: $err" );
			return null;
		}

		if( !isset( $obj['address'] ) ) {
			warning( "Missing 'address' field in $url" );
			return null;
		}

		$addr = $obj['address'];
		$keys = array( 'city', 'road', 'house_number', 'building' );
		$parts = array();
		foreach( $keys as $k ) {
			if( !isset( $addr[$k] ) ) continue;
			$parts[] = $addr[$k];
		}
		return implode( ', ', $parts );
	}

	/*
	 * Returns coordinates corresponding to the given address. The address
	 * is a standard string, the coordinates are an array (lat, lon).
	 */
	static function address_point( $str )
	{
		logmsg( 'Getting coordinates for '.$str );

		$url = self::$url;
		if( !$url ) {
			warning( "Nominatim URL not defined" );
			return null;
		}

		$url .= "/?format=json&addressdetails=1&q=" . urlencode( $str );

		$obj = self::get( $url, $err );
		if( $err ) {
			warning( "Couldn't get address coordinates: $err" );
			return null;
		}

		if( !isset( $obj['lat'] ) || !isset( $obj['lon'] ) ) {
			warning( "Missing fields in $url" );
			return null;
		}

		return array( $obj['lat'], $obj['lon'] );
	}

	private static function get( $url, &$err )
	{
		$err = null;

		$src = get_http( $url );
		if( !$src ) {
			$err = "Failed to get $url";
			return null;
		}

		$obj = json_decode( $src, true );
		if( !$obj ) {
			$err = "Not a JSON response from $url";
			return null;
		}

		if( isset( $obj['error'] ) ) {
			$err = $obj['error'];
			return null;
		}

		return $obj;
	}

}

?>
