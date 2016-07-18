<?php
/*
 * This class represents a row in a database table. Extend this class
 * redefining $table_name and $table_key (the primary key column's
 * name).
 */

abstract class BaseItem
{
	/*
	 * Name of the table with items.
	 */
	protected $table_name = 'items';
	/*
	 * Primary key name for the items.
	 */
	protected $table_key = 'id';
	/*
	 * Column with parent identifiers for parent-children queries.
	 */
	protected $parent_key = 'parent_id';


	private $child_nodes = null;
	private $ancestor_nodes = null;

	/*
	 * Parent node. False means "unknown", null means "no parent".
	 */
	private $parent_node = false;


	/*
	 * Primary key of this item, a value to the table's key.
	 */
	protected $id = null;

	/*
	 * This flag is set to true if there is no row with the given id.
	 */
	private $invalid = false;

	/*
	 * Data cache.
	 */
	private $data = array();

	/*
	 * Data to be written to the database on the next "save" call.
	 */
	private $update = array();

	/*
	 * Data and update for TIMESTAMP fields, since we can't pass SQL
	 * function calls as values.
	 */
	private $data_utc = array();
	private $update_utc = array();

	/*
	 * $preload is a comma-separated list of fields to load from the
	 * table. It is not escaped in any way.
	 */
	function __construct( $item_id = null, $preload = '' )
	{
		if( $item_id === '' ) {
			$item_id = null;
		}
		if( $item_id === null )
		{
			if( $preload != '' ) {
				error( "trying to preload data ($preload) from undefined item_id" );
			}
			return;
		}

		if( !is_numeric( $item_id ) ) {
			error( 'item_id passed to BaseItem constructor has wrong type ('.gettype( $item_id ).')' );
			$this->invalid = true;
			return;
		}

		$this->id = intval( $item_id );
		$this->preload( trim( $preload ) );
	}

	private function preload( $preload )
	{
		if( !$preload ) return;

		// Get the data
		$data = DB::getRecord(
			"SELECT $preload FROM $this->table_name
			WHERE $this->table_key = %d",
			$this->id
		);

		if( !$data ) {
			$this->invalid = true;
		}
		else {
			$this->data = $data;
		}
	}

	public function id(){
		return $this->id;
	}

	/*
	 * General template for getset. Returns value corresponding to
	 * the key. If a value is provided, sets it to the key. Keys are
	 * database fields for the item.
	 */
	function __call( $name, $arguments )
	{
		if( count( $arguments ) > 0 ){
			$arg = $arguments[0];
		} else {
			$arg = false;
		}

		if( $arg !== false ) {
			return $this->set( $name, $arg );
		}
		else {
			return $this->get( $name );
		}
	}

	private function set( $key, $value )
	{
		$this->data[$key] = $value;
		$this->update[$key] = $value;
	}

	private function get( $key )
	{
		if( array_key_exists( $key, $this->data ) ) {
			return $this->data[$key];
		}

		if( !$this->id || $this->invalid ) {
			return null;
		}

		$t = $this->table_name;
		$k = $this->id;
		$col = $key;

		$r = DB::getRecord(
			"SELECT `$key` FROM $this->table_name
			WHERE $this->table_key = '%s'",
			$this->id
		);
		if( !$r ) {
			$this->invalid = true;
			return null;
		}

		$this->data[$key] = $r[$key];
		return $this->data[$key];
	}

	// Save changes to the database.
	function save()
	{
		if( !$this->id ) {
			$this->id = DB::insertRecord( $this->table_name, $this->data );
			$this->update = array();
			$this->utc_save();
			return $this->id;
		}

		if( empty( $this->update ) && empty( $this->update_utc ) ) {
			return;
		}

		$filter = array( $this->table_key => $this->id );
		DB::updateRecord(
			$this->table_name, $this->data, $filter
		);
		$this->update = array();
		$this->utc_save();
		return $this->id;
	}


	function utc( $name, $value = false )
	{
		if( $value === false ) {
			return $this->utc_get( $name );
		}
		else {
			return $this->utc_set( $name, $value );
		}
	}

	private function utc_get( $name )
	{
		if( array_key_exists( $name, $this->data_utc ) ) {
			return $this->data_utc[$name];
		}

		if( !$this->id || $this->invalid ) {
			return null;
		}

		$r = DB::getRecord( "
			SELECT UNIX_TIMESTAMP(`$name`) AS t
			FROM $this->table_name
			WHERE $this->table_key = %d",
			$this->id );
		if( !$r ) {
			$this->invalid = true;
			return null;
		}

		$this->data_utc[$name] = $r['t'];
		return $this->data_utc[$name];
	}

	private function utc_set( $name, $time )
	{
		$this->data_utc[$name] = $time;
		$this->update_utc[$name] = $time;
	}

	private function utc_save()
	{
		foreach( $this->update_utc as $name => $time )
		{
			DB::exec( "UPDATE $this->table_name
				SET $name = FROM_UNIXTIME(%d)
				WHERE $this->table_key = %d",
				$time, $this->id
			);
		}
		$this->update_utc = array();
	}

	/* Allows to assign data collected in array in one call. */
	function addData( $data )
	{
		foreach( $data as $name => $value ){

			/* We are not calling getset directly because some methods
			can be overridden by child classes. Calling by name will
			call the overridden method as expected. */

			$this->$name( $value );
		}
	}

	/*
	 * Returns array of child nodes as instances of this class.
	 */
	function child_nodes()
	{
		if( !isset( $this->child_nodes ) )
		{
			$this->child_nodes = array();
			$class = get_class( $this );

			$ids = DB::getValues( "
				SELECT $this->table_key
				FROM $this->table_name
				WHERE $this->parent_key = %d", $this->id
			);

			foreach( $ids as $id ) {
				$this->child_nodes[] = new $class( $id );
			}
		}
		return $this->child_nodes;
	}

	/*
	 * Returns this node's parent node, or null.
	 */
	function parent_node()
	{
		if( $this->parent_node === false )
		{
			$id = DB::getValue("
				SELECT $this->parent_key
				FROM $this->table_name
				WHERE $this->table_key = %d
				", $this->id
			);
			$class = get_class( $this );
			$this->parent_node = $id ? new $class( $id ) : null;
		}
		return $this->parent_node;
	}

	/*
	 * Returns array of ancestor nodes in order from the root to this
	 * node's parent.
	 */
	function ancestor_nodes()
	{
		if( !$this->ancestor_nodes )
		{
			$this->ancestor_nodes = array();
			$node = $this->parent_node();
			while( $node )
			{
				array_unshift( $this->ancestor_nodes, $node );
				$node = $node->parent_node();
			}
		}
		return $this->ancestor_nodes;
	}

	/*
	 * Clear all cache so that values will be requested again from the
	 * database.
	 */
	function refresh()
	{
		$this->data = array();
		$this->data_utc = array();
	}
}
?>
