<?php
/*
 * Declared areas on the map covered by services.
 */
/*
	Each service may cover one or more area on map. For simplicity we
	consider them to be rectangular. Each area can be also seen as a
	view for dispatcher's map, if the map has a swtich that allows
	"jumping" between views.

	To represent an area we need four parameters: min and max latitude
	and longitude. We also add a center latitude and longitude which
	is not necessary but will spare repeated center calculation. Also
	this way the center might be shifted, if there's ever need for this.
*/
class service_areas
{
	const T = 'taxi_service_areas';

	/*
	 * Returns all areas of the given service.
	 */
	static function get_areas( $service_id )
	{
		return DB::getRecords( "SELECT * FROM ".self::T."
			WHERE service_id = %d", $service_id );
	}

	/*
	 * Returns all areas of the given service containing the given
	 * point.
	 */
	static function get_containing_areas( $service_id, $lat, $lon )
	{
		return DB::getRecords( "SELECT * FROM ".self::T."
			WHERE service_id = %d
			AND %f BETWEEN min_lat AND max_lat
			AND %f BETWEEN min_lon AND max_lon",
			$service_id, $lat, $lon
		);
	}
}
?>
