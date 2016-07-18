<?php
/*
 * Takes address parts (a map with keys 'place', 'street', 'house',
 * 'building', 'entrance') and returns the address as string in the
 * standard form.
 */
function write_address( $arr )
{
	$keys = array( 'house', 'building', 'entrance', 'apartment' );
	foreach( $keys as $key ) {
		if( !array_key_exists( $key, $arr ) ) {
			$arr[$key] = '';
		}
	}

	$addr = new address();
	$addr->set_place( $arr['place'] );
	$addr->set_street( $arr['street'] );
	$addr->set_house( $arr['house'] );
	$addr->set_building( $arr['building'] );
	$addr->house_entrance = $arr['entrance'];
	$addr->apartment = $arr['apartment'];
	return $addr->format_std();
}

/*
 * Takes address string in the standard form and returns parts as a map
 * with keys 'place', 'street', 'house', 'building', 'entrance',
 * 'apartment'.
 */
function parse_address( $str )
{
	$addr = address::parse_std( $str );
	return array(
		'place' => $addr->place,
		'street' => $addr->format_street(),
		'house' => $addr->house_number,
		'building' => $addr->house_building,
		'entrance' => $addr->house_entrance,
		'apartment' => $addr->apartment
	);
}

/*
 * Returns coordinates corresponding to the given address. The address
 * is a standard string, the coordinates are an array (lat, lon).
 */
function addr_point( $str ) {
	return __addr::address_point( $str );
}

function addr_bounds( $str ) {
	return __addr::address_bounds( $str );
}

function point_addr( $lat, $lon ) {
	return __addr::point_address( $lat, $lon );
}

class __addr
{
	/*
	 * Returns address for the given point as a string.
	 */
	static function point_address( $lat, $lon )
	{
		$url = setting( 'nominatim_url' );
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

	static function address_bounds( $str )
	{
		$url = setting( 'nominatim_url' );
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
		
		if( isset( $obj[0] ) ) {
			$obj = $obj[0];
		}
		
		if( !isset( $obj['lat'] ) || !isset( $obj['lon'] ) ) {
			warning( "Missing fields in $url" );
			return null;
		}

		$lat = $obj['lat'];
		$lon = $obj['lon'];

		if( isset( $obj['boundingbox'] ) ) {
			$box = $obj['boundingbox'];
		}
		else {
			$d = 0.0001;
			$box = array( $lat - $d, $lat + $d, $lon - $d, $lon + $d );
		}

		return array(
			'lat' => $lat,
			'lon' => $lon,
			'min_lat' => $box[0],
			'max_lat' => $box[1],
			'min_lon' => $box[2],
			'max_lon' => $box[3]
		);
	}

	/*
	 * Returns coordinates corresponding to the given address. The address
	 * is a standard string, the coordinates are an array (lat, lon).
	 */
	static function address_point( $str )
	{
		$b = self::address_bounds( $str );
		if( !$b ) {
			return null;
		}
		return array( $b['lat'], $b['lon'] );
	}

	private static function get( $url, &$err )
	{
		$err = null;

		$src = curl_get( $url, $err );
		if( !$src ) {
			$err = "Failed to get $url: $err";
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
