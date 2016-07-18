<?php
class routes
{
	static function get_route( $lat1, $lon1, $lat2, $lon2 )
	{
		if( !$lat1 || !$lon1 || !$lat2 || !$lon2 ){
			warning( "get_route( $lat1, $lon1, $lat2, $lon2 )" );
			return null;
		}

		$url = setting( 'osrm_address' );
		if( !$url ){
			return null;
		}
		$url .= "viaroute?loc=$lat1,$lon1&loc=$lat2,$lon2";

		// TODO: see if cURL with keep-alive will be faster for bursts.
		$src = file_get_contents( $url );
		$data = json_decode( $src, true );

		/* OSRM response has format: {
			version: 0.3,
			status: 0,
			status_message: "Found route between points",
			route_geometry: "..." (encoded string),
			route_summary: {
				total_distance: <meters>,
				total_time: <seconds>,
				start_point: ?,
				alternative_geometris: [],
				alternative_instructions: [],
				alternative_summaries: [],
				route_name: ?,
				alternative_names: [],
				via_points: [ [<lat>,<lon>], ... ],
				hint_data: {
					checksum: <int>,
					locations: [ <encoded strings> ],
					...
				}
			}
		} */

		return $data;
	}

	/*
	 * Returns road distance in meters. If could not build route and
	 * $best_effort is true, return an estimation based on statistics.
	 */
	static function get_road_distance( $lat1, $lon1, $lat2, $lon2,
		$best_effort = true )
	{
		if( !$lat1 || !$lon1 || !$lat2 || !$lon2 ) {
			warning( "get_road_distance( null )" );
			return null;
		}

		$r = self::get_route( $lat1, $lon1, $lat2, $lon2 );

		// Non-zero status means error.
		if( $r && !$r['status'] ) {
			return intval( $r['route_summary']['total_distance'] );
		}

		log_message( "No route between ($lat1, $lon1) and ($lat2, $lon2).", 'no_routes' );

		if( !$best_effort ) return null;

		return self::estimate_distance( $lat1, $lon1, $lat2, $lon2 );
	}

	/*
	 * Fallback function that guesses distance based on predefined
	 * statistics.
	 */
	static function estimate_distance( $lat1, $lon1, $lat2, $lon2 )
	{
		/*
		 * We estimate real distance as "a*r + b", where "r" is straight
		 * line distance, and "a" and "b" are linear regression
		 * parameters. These values have been received from 335 random
		 * routes inside Minsk.
		 */
		$a = 0.772694; // +/- 0.01771 (2.292%)
		$b = -508.832; // +/- 86.11 (16.92%)

		// latitude and longitude deltas for 1 meter
		$meter_lat = 8.98315284E-6;
		$meter_lon = 1.52420726E-5;

		$y = ( $lat1 - $lat2 ) / $meter_lat;
		$x = ( $lon1 - $lon2 ) / $meter_lon;
		$r = sqrt( $x*$x + $y*$y );

		/*
		 * The result multiplied by 2 looks better.
		 */
		return max( 0, 2 * round( $a * $r + $b ) );
	}
}
?>
