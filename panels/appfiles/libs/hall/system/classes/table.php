<?php

/*
There are two ways to build a table: by adding rows and by adding
columns. These two ways can be combined.

Every column has a name or at least a numeric index, as rows are arrays.

*/

class table
{
	/* We will store the table data in 2-dimensional array, first index
	corresponding to rows and second corresponding to columns. Column
	indices can be strings or numbers. rows_count is a cached number of
	rows*/

	private $data = array();
	private $rows_count = 0;


	/*
	 * The list of used column names. Any output will be generated with
	 * columns in the same order as in this list.
	 * When adding a row with a column that is not in this list, the
	 * list is automatically updated.
	 */
	public $columns = array();

	// specifies column titles; if empty, no header is drawn
	private $header = array();

	// CSS class name
	public $className = 'items';

	function __construct( $header = null )
	{
		if( $header ) {
			$this->set_header( $header );
		}
	}

	function set_header( $header ) {
		$this->header = $header;
	}

	function __toString() {
		return $this->format_as_html();
	}

	function column( $name, $index = null ) {
		return array_column( $this->data, $name, $index );
	}

	function get_column( $index )
	{
		if( !in_array( $index, $this->columns ) )
		{
			trigger_error( "There is no column '$index'" );
			return null;
		}

		$c = array();
		for( $i = 0; $i < $this->rows_count; $i++ )
		{
			$c[] = isset( $this->data[$i][$index] ) ?
				$this->data[$i][$index] : '';
		}
		return $c;
	}

	function get_rows( $include_header = false )
	{
		$rows = array();
		if( $include_header ) {
			$rows[] = $this->header;
		}
		for( $i = 0; $i < $this->rows_count; $i++ ){
			$rows[] = $this->data[$i];
		}
		return $rows;
	}

	/* Adds a row to the table. The given row is an assotiative array,
	with keys corresponding to column names and values corresponding to
	the data. */

	function add_row( $row )
	{
		/* First we are creating a new row. It is empty for a while. */

		$this->data[$this->rows_count] = array();

		/* Then for each value of given row, we check column name and
		update the $columns list if needed. */

		foreach( $row as $key => $value )
		{
			// If this key is not in the list of headers, add it there.
			if( !in_array( $key, $this->columns ) ){
				$this->columns[] = $key;
			}

			// Update the new row with the key and value we have just
			// checked.
			$this->data[$this->rows_count][$key] = $value;
		}

		// Increase the rows counter.
		$this->rows_count++;
	}

	function add_rows( $rows )
	{
		array_walk( $rows, array( $this, 'add_row' ) );
	}

	function get_rows_count(){
		return $this->rows_count;
	}

	// Adds a column to the table.
	function add_column( $column_name, $cells )
	{
		// If the column with given name is already present in this table,
		// return error.
		if( in_array( $column_name, $this->columns ) ){
			trigger_error( "Column with name '$column_name' already exists in the table." );
			return false;
		}

		// If a literal value is given, repeat it for all rows.
		if( !is_array( $cells ) ){
			$cells = array_fill( 0, $this->rows_count, $cells );
		}

		// Check that the number of cells is the same as the number of rows
		// already present in the table, except the case when the table is
		// still empty.

		if( $this->rows_count > 0 && $this->rows_count != count( $cells ) ){
			trigger_error( "Number of cells in the column '$column_name' is not the same as the number of table rows." );
			return false;
		}

		// If everyting is correct, just iterate through the rows and add
		// new cells.

		foreach( $cells as $row_number => $value ){
			$this->data[$row_number][$column_name] = $value;
		}

		// If the rows counter is not initialized, set it to the correct
		// value.

		if( $this->rows_count == 0 ){
			$this->rows_count = count( $cells );
		}

		// Then add the new column name to the $columns.
		$this->columns[] = $column_name;
	}


	function get_row( $row_index )
	{
		$r = array();
		$row = $this->data[$row_index];
		foreach( $this->columns as $column )
		{
			if( isset( $row[$column] ) ){
				$r[] = $row[$column];
			} else {
				$r[] = '';
			}
		}
		return $r;
	}

	function get_header()
	{
		$r = array();
		foreach( $this->columns as $column )
		{
			if( isset( $this->header[$column] ) ){
				$r[] = $this->header[$column];
			} else {
				$r[] = '';
			}
		}
		return $r;
	}

	function format_as_tsv()
	{
		// If the table is empty, just return empty string.
		if( $this->rows_count == 0 ){
			return '';
		}

		$filter = create_function( '$v',
			'return str_replace( array( "\t", "\n", "\r" ), "", $v );'
		);

		$s = '';
		// Print header, if provided.
		if( !empty( $this->header ) )
		{
			$s .= implode( "\t",
				array_map( $filter, $this->get_header() )
			).PHP_EOL;
		}

		for( $i = 0; $i < $this->rows_count; $i++ )
		{
			$s .= implode( "	",
				array_map( $filter, $this->get_row( $i ) )
			).PHP_EOL;
		}

		return $s;
	}

	// Formats the table in HTML code.
	function format_as_html()
	{
		// If the table is empty, just return empty string.
		if( $this->rows_count == 0 ){
			return '';
		}

		$s = '<table class="'.$this->className.'">';

		// Print header, if provided.
		if( !empty( $this->header ) )
		{
			$s .= '<thead><tr><th>'
				.implode( '</th><th>', $this->get_header() )
				.'</th></tr></thead>';
		}

		// Print rows
		$s .= '<tbody>';
		for( $i = 0; $i < $this->rows_count; $i++ )
		{
			$s .= '<tr><td>'
				.implode( '</td><td>', $this->get_row( $i ) )
				.'</td></tr>';
		}
		$s .= '</tbody>';
		$s .= '</table>';
		return $s;
	}


	static function create_from_file( $file_path, $header = true, $cols_separator = "\t" )
	{
		if( !file_exists( $file_path ) ){
			trigger_error( "Could not open file: '$file_path'" );
			return null;
		}

		$t = new Table();

		$f = fopen( $file_path, 'r' );
		if( $header ){
			$line = trim( fgets( $f ) );
			$cols = explode( $cols_separator, $line );
			$t->set_header( $cols );
		}

		while( ( $line = fgets( $f ) ) !== false )
		{
			$cols = explode( $cols_separator, trim( $line ) );
			$t->add_row( $cols );
		}

		fclose( $f );

		return $t;
	}

	static function create_from_array( $array, $derive_header = false )
	{
		$t = new Table();
		if( $derive_header ) {
			$header = array_combine(
				array_keys( $array[0] ), array_keys( $array[0] )
			);
			$t->set_header( $header );
		}

		foreach( $array as $row ){
			$t->add_row( $row );
		}
		return $t;
	}
}

?>
