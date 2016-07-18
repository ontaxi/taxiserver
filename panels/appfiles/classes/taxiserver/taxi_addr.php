<?php

class taxi_addr
{
	static function suggest_places( $term )
	{
		$term = trim( $term );
		$term = DB::escape( $term );
		if( !$term ) {
			return array();
		}

		$namecond = "name LIKE '$term%%' OR name LIKE '%% $term%%'";
		$list = DB::getValues( "
			SELECT name FROM taxi_a_towns
			WHERE $namecond
			ORDER BY name
			LIMIT 10" );
		return $list;
	}

	static function suggest_streets( $term, $town_name )
	{
		$term = trim( $term );
		$term = DB::escape( $term );

		$place_id = self::place_id( $town_name );

		if( !$place_id || !$term ) {
			return array();
		}

		$namecond = "name LIKE '$term%%' OR name LIKE '%% $term%%'";

		$list = DB::getValues( "
			SELECT name FROM taxi_a_streets
			WHERE town_id = $place_id
			AND $namecond
			ORDER BY name
			LIMIT 10" );
		return $list;
	}

	private static function place_id( $name )
	{
		return DB::getValue(
			"SELECT town_id FROM taxi_a_towns
			WHERE name = '%s'
			LIMIT 1", $name );
	}
}

?>
