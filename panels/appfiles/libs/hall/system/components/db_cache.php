<?php

class db_cache
{
	/*
	 * Indexed by table, primary key.
	 * ($cache[$table][$key] gives a row)
	 */
	private static $cache = array();

	/*
	 * Preloads rows from the table $table.
	 * $key - column that is the primary key
	 * $columns - columns that need to be preloaded
	 * $condition - rows filter, same as for MySQL objects.
	 */
	static function create_cache( $table, $key, $columns, $condition = null )
	{
		if( !in_array( $key, $columns ) ) {
			array_unshift( $columns, $key );
		}

		$query = "SELECT ".implode( ", ", $columns )
			. " FROM ".$table;
		if( $condition ){
			$query .= " WHERE ". DB::buildCondition( $condition );
		}

		if( !isset( self::$cache[$table] ) ){
			self::$cache[$table] = array();
		}

		$r = DB::getRecords( $query );
		foreach( $r as $rec )
		{
			$id = $rec[$key];
			self::$cache[$table][$id] = $rec;
		}
	}

	static function cache_exists( $table, $key, $columns )
	{
		if( is_string( $columns ) ){
			$columns = array( $columns );
		}

		if( !isset( self::$cache[$table] )
		|| !isset( self::$cache[$table][$key] ) ) {
			return false;
		}
		foreach( $columns as $column )
		{
			if( !array_key_exists( $column, self::$cache[$table][$key] ) ){
				return false;
			}
		}
		return true;
	}

	static function get_record_from_cache( $table, $key, $columns )
	{
		if( !isset( self::$cache[$table] )
		|| !isset( self::$cache[$table][$key] ) ) {
			return null;
		}

		$_columns = $columns;

		assert( is_array( $columns ) );

		$data = array();
		foreach( $columns as $column )
		{
			if( !array_key_exists( $column, self::$cache[$table][$key] ) ){
				return null;
			}
			$data[$column] = self::$cache[$table][$key][$column];
		}

		return $data;
	}

	static function get_value_from_cache( $table, $key, $column )
	{
		$rec = self::get_record_from_cache( $table, $key, array( $column ) );
		if( !$rec ) return null;

		return $rec[$column];
	}
}

?>
