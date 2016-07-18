<?php
class routes
{
	private static $c = null;

	static function init()
	{
		self::$c = curl_init();
		curl_setopt_array( self::$c, array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => 3
		));
	}

	private static function get( $url )
	{
		if( !self::$c ) self::init();
		curl_setopt( self::$c, CURLOPT_URL, $url );
		return curl_exec( self::$c );
	}

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

		$src = self::get( $url );
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

		//logmsg( "No route between ($lat1, $lon1) and ($lat2, $lon2).", 'routes' );

		if( !$best_effort ) return null;

		return 2 * haversine_distance( $lat1, $lon1, $lat2, $lon2 );
	}
}
?>
