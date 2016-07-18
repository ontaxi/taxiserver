<?php
/*
 * A high-level wrapper for MySQLi functions.
 */
class mysql
{
	private $connection = null; // mysqli instance

	private $host;
	private $port;
	private $user;
	private $pass;
	private $dbname;

	private $connection_charset;

	private $connected = false;

	private $onQuery = array();
	private $onError = array();
	private $onWarning = array();


	function __construct( $addr, $user, $pass, $dbname = "",
		$connection_charset = 'UTF8' )
	{
		$pos = strpos( $addr, ':' );
		if( $pos !== false ) {
			$host = substr( $addr, 0, $pos );
			$port = substr( $addr, $pos + 1 );
		}
		else {
			$host = $addr;
			$port = null;
		}

		$this->host = $host;
		$this->port = $port;
		$this->user = $user;
		$this->pass = $pass;
		$this->dbname = $dbname;

		/* The charset name is "UTF-8", but MySQL uses "UTF8". */
		if( strtoupper( $connection_charset ) == 'UTF-8' ){
			$connection_charset = 'UTF8';
		}
		$this->connection_charset = $connection_charset;
	}

	function add_query_callback( $callback ) {
		$this->onQuery[] = $callback;
	}
	function add_warning_callback( $callback ) {
		$this->onWarning[] = $callback;
	}
	function add_error_callback( $callback ) {
		$this->onError[] = $callback;
	}

	function connect()
	{
		ob_start();
		if( $this->port ) {
			$this->connection = new mysqli( $this->host, $this->user,
				$this->pass, $this->dbname, $this->port );
		}
		else {
			$this->connection = new mysqli( $this->host, $this->user,
				$this->pass, $this->dbname );
		}

		$s = ob_get_clean();

		if( mysqli_connect_error() ){
			throw new Exception( "MySQL: could not connect to the host." );
		}

		$this->connected = true;
		//$this->exec( "SET NAMES '$this->connection_charset'" );
		mysqli_set_charset( $this->connection, $this->connection_charset );
	}

	function checkConnection()
	{
		if( !$this->connection || !$this->connection->ping() ){
			$this->connect();
		}
	}

	/* Executes a mysql query using sprintf to substitute arguments.
	Every argument is escaped before being passed to sprintf.
	On error NULL is returned.
	Example:
		$mysql->exec( "UPDATE table SET field = %d
			WHERE field2 = '%s'", 12, 'howdy, globe' );
	*/

	function exec( $query, $_args_ = null )
	{
		if( !$this->connected ) {
			$this->connect();
		}

		$args = func_get_args();
		$query = $this->build_query( $args );

		$t = -microtime();
		$r = $this->connection->query( $query );
		$t += microtime();

		foreach( $this->onQuery as $f ){
			call_user_func( $f, $query, $t );
		}

		if( $r === false )
		{
			$error_message = $this->connection->error . '; query: '.$query;
			foreach( $this->onError as $f ) {
				call_user_func( $f, $error_message );
			}
			return $r;
		}

		if( !empty( $this->onWarning ) && $this->connection->warning_count )
		{
			$warnings = $this->getRecords( "SHOW WARNINGS" );
			foreach( $warnings as $warning )
			{
				// The columns are "Level", "Code", "Message".
				$msg = $warning['Message'];
				$msg .= ' *** query: ' . $query;
				foreach( $this->onWarning as $f ) {
					call_user_func( $f, $msg );
				}
			}
		}

		return $r;
	}

	private function build_query( $args )
	{
		/*
		 * First argument ($template) is a sprintf template and is
		 * considered safe (without injections). All other arguments
		 * are to be escaped before passing to the sprintf function.
		 */

		/*
		 * If there is only one argument, there is nothing to escape.
		 */
		$n = count( $args );
		if( $n == 1 ) {
			return $args[0];
		}

		for( $i = 1; $i < $n; $i++ ) {
			$args[$i] = $this->escape( $args[$i] );
		}

		return call_user_func_array( 'sprintf', $args );
	}

	/* Escapes given value or array of values. */
	function escape( $var )
	{
		if( is_array( $var ) )
		{
			foreach( $var as $k => $v ){
				$var[$k] = $this->escape( $v );
			}
			return $var;
		}
		if( $var === null ){
			return null;
		}
		if( !$this->connected ) {
			$this->connect();
		}
		return str_replace( '%', '%%',
			$this->connection->real_escape_string( $var ) );
	}

	function insertId(){
		return $this->connection->insert_id;
	}

	/* Fetches one associative array with the given query. */
	function getRecord( $mysql_query, $_args_ = null )
	{
		$args = func_get_args();
		$mysql_query .= ' LIMIT 1';

		$r = call_user_func_array( array( $this, 'exec' ), $args );
		if( $r === null ){
			return $r;
		}
		$row = $r->fetch_assoc();
		mysqli_free_result( $r );
		return $row;
	}

	/* Fetches array of associative arrays from the query. */
	function getRecords( $mysql_query, $_args_ = null )
	{
		$args = func_get_args();
		$r = call_user_func_array( array( $this, 'exec' ), $args );

		$ae = array();
		while( $e = $r->fetch_assoc() ){
			$ae[] = $e;
		}
		mysqli_free_result( $r );
		return $ae;
	}

	function getValue( $mysql_query, $_args_ = null )
	{
		$args = func_get_args();
		$r = call_user_func_array( array( $this, 'exec' ), $args );

		if( $r === null ){
			return $r;
		}

		$row = $r->fetch_row();
		mysqli_free_result( $r );
		return ( isset( $row[0] )? $row[0] : null );
	}

	/* Fetches queried scalar values. */
	function getValues( $mysql_query, $args = null )
	{
		$args = func_get_args();
		$r = call_user_func_array( array( $this, 'exec' ), $args );
		$a = array();
		while( $e = $r->fetch_row() ){
			$a[] = $e[0];
		}
		mysqli_free_result( $r );
		return $a;
	}

	/* Inserts a row into a table. */
	function insertRecord( $table, $record, $ignore = false )
	{
		$record = $this->escape( $record );

		$header = $this->header_string( array_keys( $record ) );
		$tuple = $this->tuple_string( $record );

		$this->exec(
			"INSERT " . ( $ignore ? " IGNORE" : "" )
			. " INTO `$table` $header VALUES $tuple"
		);

		return $this->insertId();
	}

	/* Inserts multiple rows into a table. */
	function insertRecords( $table, $records )
	{
		if( empty( $records ) ){
			return false;
		}

		$records = $this->escape( $records );

		$header = $this->header_string( array_keys( $records[0] ) );

		$tuples = array();
		foreach( $records as $record ){
			$tuples[] = $this->tuple_string( $record );
		}
		$tuples = implode( ', ', $tuples );

		return $this->exec( "INSERT INTO `$table` $header
			VALUES $tuples"
		);
	}

	/*
	 * Returns true if at least one record conforming to the given
	 * filter exists in the given table.
	 */
	function exists( $table, $filter )
	{
		$table = $this->escape( $table );

		$q = "SELECT 1 FROM `$table` WHERE "
			. $this->buildCondition( $filter );
		return (bool) $this->getValue( "SELECT EXISTS ($q)" );
	}

	/*
	 * Updates records of the table with given name.
	 *
	 * This method escapes everything in the $record and $filter,
	 * so don't escape them.
	 *
	 * The two examples below are equivalent:
	 * // 1
	 * updateRecords( 'tbl',
	 * 	array( 'id' => 42, 'field' => 'new-value' ), // the update
	 *  'id' // the filter
	 * );
	 * // 2
	 * updateRecords( 'tbl',
	 * 	array( 'field' => 'new-value' ), // the update
	 * 	array( 'id' => 42 ) // the filter
	 * );
	 *
	 * Form 2 can have more complex filters though
	 */
	function updateRecords( $table, $record, $filter, $limit = null )
	{
		// if the filter is a string, convert it to array
		if( is_string( $filter ) )
		{
			$filter_field = $filter;
			$filter = array( $filter => $record[$filter] );

			// we don't need this value anymore
			// since it's a part of the filter
			unset( $record[$filter_field] );
		}

		// build the condition
		$where = $this->buildCondition( $filter );

		// escape the values
		$record = $this->escape( $record );

		// build the update statement
		$tmp = array();
		foreach( $record as $field => $value )
		{
			if( $value === null ){
				$tmp[] = "`$field` = NULL";
				continue;
			}
			$tmp[] = "`$field` = '$value'";
		}
		$set = implode( ', ', $tmp );

		// run the update
		$q = "UPDATE $table SET $set WHERE $where";
		if( $limit ) $q .= ' LIMIT '.intval( $limit );
		$r = $this->exec( $q );
		if( $r ){
			return $this->connection->affected_rows;
		} else {
			return $r;
		}
	}

	function updateRecord( $table, $record, $filter ){
		return $this->updateRecords( $table, $record, $filter, 1 );
	}

	function deleteRecords( $table_name, $filter, $value = null, $limit = null )
	{
		if( is_string( $filter ) ){
			$filter = array( $filter => $value );
		}

		$condition = $this->buildCondition( $filter );
		$q = "DELETE FROM $table_name WHERE $condition";
		if( $limit ) $q .= ' LIMIT '.intval( $limit );
		$this->exec( $q );
		return $this->connection->affected_rows;
	}

	function deleteRecord( $table_name, $filter, $value = null )
	{
		if( is_string( $filter ) ){
			$filter = array( $filter => $value );
		}
		return $this->deleteRecords( $table_name, $filter, null, 1 );
	}

	/*
	 * Returns a stream object (see below) for the given query.
	 */
	function getStream( $mysql_query, $args = null )
	{
		$args = func_get_args();
		if( count( $args ) > 1 ){
			$mysql_query = $this->constructQuery( $mysql_query, $args );
		}
		return new mysql_stream( $this->exec( $mysql_query ) );
	}

	/* Creates condition clause for a query. */
	function buildCondition( $filter )
	{
		$filter = $this->escape( $filter );
		$parts = array();
		foreach( $filter as $field_name => $field_value )
		{
			if( $field_value === null )
			{
				$parts[] = "`$field_name` IS NULL";
				continue;
			}

			if( is_array( $field_value ) ){
				$parts[] = "`$field_name` IN ( '".implode( "', '", $field_value )."' )";
			} else {
				$parts[] = "`$field_name` = '$field_value'";
			}
		}
		$condition = implode( ' AND ', $parts );
		return $condition;
	}



	private function tuple_string( $tuple )
	{
		$values = array();
		foreach( $tuple as $value )
		{
			if( $value === null ){
				$values[] = 'NULL';
			} else {
				$values[] = "'$value'";
			}
		}

		$t = '(' . implode( ', ', $values ) .  ')';
		return $t;
	}

	private function header_string( $header )
	{
		return '(`' . implode( "`, `", $header ) . '`)';
	}

	private function constructQuery( $template, $__args__ = null )
	{
		$args = func_get_args();
		$n = count( $args );

		/* First argument ($template) is a sprintf template and is
		considered safe (without injections). All other arguments
		($__args__) are to be escaped before passing to the sprintf
		function. */

		// If we have arguments, escape each of them.
		if( $n > 1 )
		{
			for( $i = 1; $i < $n; $i++ ) {
				$args[$i] = $this->escape( $args[$i] );
			}
		}
		return call_user_func_array( 'sprintf', $args );
	}

}

class mysql_stream
{
	private $result;

	public function __construct( $result ){
		$this->result = $result;
	}

	public function getRecord(){
		return $this->result->fetch_assoc();
	}

	public function getValue(){
		$r = $this->result->fetch_row();
		return $r[0];
	}
}

?>
