<?php

define( 'EARTH_RADIUS_M', 6378137 );
define( 'PI', 3.1415926535897932384626433832795 );

function haversine_distance( $lat1, $lon1, $lat2, $lon2 )
{
	$d2r =  PI / 180;
	$dLat = ($lat2 - $lat1) * $d2r;
	$dLon = ($lon2 - $lon1) * $d2r;
	$lat1 = $lat1 * $d2r;
	$lat2 = $lat2 * $d2r;
	$sin1 = sin($dLat / 2);
	$sin2 = sin($dLon / 2);
	$a = $sin1 * $sin1 + $sin2 * $sin2 * cos($lat1) * cos($lat2);
	$d = EARTH_RADIUS_M * 2 * atan2( sqrt($a), sqrt(1 - $a));
	return $d;
}

?>
