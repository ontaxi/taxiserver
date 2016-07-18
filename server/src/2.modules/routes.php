<?php
conf_add( 'osrm_address', function( $addr ) {
	mod_routes::$addr = $addr;
});

class mod_routes
{
	static $addr = 'localhost:5000';

	static function get_route( $lat1, $lon1, $lat2, $lon2 )
	{
		if( !$lat1 || !$lon1 || !$lat2 || !$lon2 ){
			warning( "get_route( $lat1, $lon1, $lat2, $lon2 )" );
			return null;
		}

		$url = self::$addr;
		if( !$url ){
			return null;
		}
		$url .= "viaroute?loc=$lat1,$lon1&loc=$lat2,$lon2";

		$src = get_http( $url );
		if( !$src ) {
			return null;
		}
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
	 * Returns road distance in meters.
	 */
	static function get_road_distance( $lat1, $lon1, $lat2, $lon2 )
	{
		if( !$lat1 || !$lon1 || !$lat2 || !$lon2 ) {
			trigger_error( "get_road_distance: null parameters ($lat1, $lon1, $lat2, $lon2)" );
			return null;
		}

		$r = self::get_route( $lat1, $lon1, $lat2, $lon2 );
		// Non-zero status means error.
		if( $r && !$r['status'] ) {
			return intval( $r['route_summary']['total_distance'] );
		}

		logmsg( "No route between ($lat1, $lon1) and ($lat2, $lon2)." );
	}
}
?>
