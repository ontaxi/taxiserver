<?php
/*
 * This module stores an instance of MySQL class and redirects calls to
 * it. The instance is created on demand.
 */
class DB
{
	// The MySQL object
	private static $db = null;

	/*
	Returns MySQL object that is stored in the $db variable.
	If there is no object, creates it using "DB_*" constants or
	"mysql_*" settings.
	*/
	static function c()
	{
		if( self::$db ) return self::$db;

		if( defined( 'DB_HOST' ) ) {
			$host = DB_HOST;
			$user = DB_USER;
			$pass = DB_PASS;
			$dbname = DB_NAME;
		}
		else {
			$host = setting( 'mysql_host' );
			$user = setting( 'mysql_user' );
			$pass = setting( 'mysql_pass' );
			$dbname = setting( 'mysql_dbname' );
		}

		if( !$host ) {
			error( 'Database connection parameters are not defined.' );
			return false;
		}

		try {
			self::$db = new MySQL( $host, $user, $pass, $dbname, 'UTF-8' );
		}
		catch( Exception $e ) {
			error( "MySQL exception: " . $e->getMessage() );
		}

		foreach( self::$onError as $f ){
			self::$db->add_error_callback( $f );
		}
		foreach( self::$onWarning as $f ){
			self::$db->add_warning_callback( $f );
		}
		foreach( self::$onQuery as $f ){
			self::$db->add_query_callback( $f );
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
	 * Returns time difference between PHP's and MySQL's timezones.
	 * Whenever we have to write a timestamp literal to the database,
	 * we should add the value returned by this function.
	 */
	static function time_diff()
	{
		// UTC + MySQL's timezone shift - PHP's timezone shift.
		$clock = strtotime( DB::getValue( "SELECT NOW()" ) );

		// time() = UTC (always, regardless of date_default_timezone)
		// Thus the following is:
		// UTC + (MySQL shift) - (PHP shift) - UTC
		// = (MySQL shift - PHP shift).
		$diff = $clock - time();

		return $diff;
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

	static function exists( $table, $filter ) {
		$args = func_get_args();
		return self::proxy( 'exists', $args );
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
}

?>
