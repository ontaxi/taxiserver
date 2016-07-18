<?php

conf_add( 'database', function( $s )
{
	if( !DB::set_name( $s ) ) {
		error( "Could not parse database name" );
	}
});

conf_add( 'sql_log', function( $path )
{
	if( !$path ) return;
	init( function() use ($path)
	{
		$log = fopen( $path, 'a+' );
		logmsg( "Opening SQL log $path", 'db' );
		if( !$log ) {
			error( "Could not open sql_log $path for writing" );
			return;
		}

		$last_query_time = time();
		DB::onQuery( function( $q, $mt ) use (&$last_query_time, $log) {
			$ms = (int) ( $mt * 1000 );
			$t = time();
			$diff = $t - $last_query_time;
			$last_query_time = $t;
			fprintf( $log, "+%d s, %d ms	%s\n", $diff, (int) $ms, $q );
		} );
	});
});

DB::onWarning( 'warning' );
DB::onError( 'error' );

/*
The purpose of this class is to store an instance of MySQL class and
redirect calls to that instance. Thus we can use DB::whatever() calls
rather than something like S::$db->whatever, and we don't have to worry
whether the $db has been defined yet.

The instance is created only on the first call. Therefore, if the
current page doesn't need to make any SQL queries, the MySQL instance
will not be created.
*/

class DB
{
	// The MySQL object
	private static $db = null;

	private static $host;
	private static $user;
	private static $pass;
	private static $name;

	static function set_name( $s )
	{
		// user:pass@host/dbname
		$p = '|^([^:]+):([^@]*)@([^/]+)/(.*)$|';
		if( !preg_match( $p, $s, $m ) ) {
			return false;
		}
		self::$user = $m[1];
		self::$pass = $m[2];
		self::$host = $m[3];
		self::$name = $m[4];
		return true;
	}

	/*
	Returns MySQL object that is stored in the $db variable.
	If there is no object, creates it using "DB_*" constants or
	"mysql_*" settings.
	*/
	static function c()
	{
		if( self::$db )
		{
			self::$db->checkConnection();
			return self::$db;
		}

		$host = self::$host;
		$user = self::$user;
		$pass = self::$pass;
		$dbname = self::$name;

		if( !$host ) {
			error( 'Database connection parameters are not defined.' );
			return false;
		}

		self::$db = new MySQL( $host, $user, $pass, $dbname, 'UTF-8' );

		foreach( self::$onError as $f ){
			self::$db->onError[] = $f;
		}
		foreach( self::$onWarning as $f ){
			self::$db->onWarning[] = $f;
		}
		foreach( self::$onQuery as $f ){
			self::$db->onQuery[] = $f;
		}

		if( !self::$db->connect() ) {
			exit;
		}
		return self::$db;
	}

	/* To assign onError and onWarning callbacks, we have to create the
	MySQL object. But we might not event need the object. So we check
	here if the object has been created. If it has, then we add the
	callbacks to it. If not, we store the callbacks in our property, and
	then the "c" function will add those callbacks when it will be
	creating the object. */

	private static $onError = array();
	private static $onWarning = array();
	private static $onQuery = array();

	/*
	 * Returns time at the database server as unixtime.
	 */
	static function time()
	{
		return DB::getValue( "SELECT UNIX_TIMESTAMP(NOW())" );
	}

	static function onError( $callback )
	{
		if( self::$db ){
			self::$db->onError[] = $callback;
		} else {
			self::$onError[] = $callback;
		}
	}
	static function onWarning( $callback )
	{
		if( self::$db ){
			self::$db->onWarning[] = $callback;
		} else {
			self::$onWarning[] = $callback;
		}
	}

	static function onQuery( $callback )
	{
		if( self::$db ){
			self::$db->onQuery[] = $callback;
		} else {
			self::$onQuery[] = $callback;
		}
	}

	/* This allows to roughly estimate an "overhead" for a single query. */
	static function ping()
	{
		$t = microtime( true );
		DB::exec( "SELECT 1" );
		return microtime( true ) - $t;
	}


	/*
	Redirects method calls from this static object to the MySQL class
	instance in the $db variable.
	*/
	private static function proxy( $name, $args ){
		return call_user_func_array( array( self::c(), $name ), $args );
	}

	static function startTransaction(){
		self::c()->exec( "START TRANSACTION" );
	}
	static function finishTransaction(){
		self::c()->exec( "COMMIT" );
	}

	static function exec( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'exec', $args );
	}

	static function escape( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'escape', $args );
	}

	static function getValues( $query, $args = null ){
		$args = func_get_args();
		return self::proxy( 'getValues', $args );
	}

	static function getValue( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'getValue', $args );
	}

	static function getRecord( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'getRecord', $args );
	}

	static function getRecords( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'getRecords', $args );
	}

	static function updateRecord( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'updateRecord', $args );
	}

	static function updateRecords( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'updateRecords', $args );
	}

	static function deleteRecord( $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'deleteRecord', $args );
	}

	static function deleteRecords( $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'deleteRecords', $args );
	}

	static function insertRecord( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'insertRecord', $args );
	}

	static function insertRecords( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'insertRecords', $args );
	}

	static function buildCondition( $query, $__args__ = null ){
		$args = func_get_args();
		return self::proxy( 'buildCondition', $args );
	}

	static function exists( $__args__ ) {
		$args = func_get_args();
		return self::proxy( 'exists', $args );
	}
}

?>
