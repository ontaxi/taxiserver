<?php
/*
 * Caching module for run-time data.
 */

/*
 * Create a cache.
 */
function create_cache( $dir, $lifetime = null ) {
	return server_caches::create_cache( $dir, $lifetime );
}

/*
 * Save a key-value pair under the given "domain"/"directory".
 */
function set_cache( $dir, $key, $value ) {
	server_caches::set( $dir, $key, $value );
}

/*
 * Get the value for the given key. Returns null if not set.
 */
function get_cache( $dir, $key ) {
	return server_caches::get( $dir, $key );
}

/*
 * Remove all data from the given directory. If $dir is null, all cache
 * is cleaned.
 */
function reset_cache( $dir = null ) {
	server_caches::reset( $dir );
}

function info_cache() {
	return server_caches::info();
}


/*
 * Every cached value has a life time, even static data that can't be
 * edited (it may get deleted). Thus all cache directories will have a
 * timeout.
 */

/*
 * The cache consists of "directories". Each "directory" is a hash table
 * with values and a lifetime value applying to all the values in the
 * table.
 */
class cache_dir {
	/*
	 * Duration in seconds.
	 */
	public $lifetime;

	/*
	 * key => cache_item
	 */
	public $data = array();
}

class cache_item
{
	public $data;
	public $expires;
	function __construct( $data, $expires ) {
		$this->data = $data;
		$this->expires = $expires;
	}
}


init( function()
{
	schedule( 60, 'server_caches::clean' );
});

class server_caches
{
	/*
	 * For those static values that are not expected to change some
	 * reasonably long duration will be used.
	 */
	const LONG_TIME = 3600;

	/*
	 * Array of cache_dir objects.
	 */
	private static $directories = array();

	/*
	 * Create a cache with the given name and lifetime.
	 */
	static function create_cache( $dir, $lifetime )
	{
		if( isset( self::$directories[$dir] ) ) {
			trigger_error( "Cache '$dir' is already used." );
			return false;
		}

		if( !$lifetime ) {
			$lifetime = self::LONG_TIME;
		}

		$d = new cache_dir();
		$d->lifetime = $lifetime;
		self::$directories[$dir] = $d;
		return true;
	}

	/*
	 * Put a value in the cache.
	 */
	static function set( $dir, $key, $value )
	{
		if( !isset( self::$directories[$dir] ) ) {
			trigger_error( "Unknown cache: $dir" );
			return null;
		}

		$d = self::$directories[$dir];
		$i = new cache_item( $value, time() + $d->lifetime );
		$d->data[$key] = $i;
	}

	static function get( $dir, $key )
	{
		if( !isset( self::$directories[$dir] ) ) {
			trigger_error( "Unknown cache: $dir" );
			return null;
		}
		$d = self::$directories[$dir];

		if( !isset( $d->data[$key] ) ) {
			return null;
		}
		$i = $d->data[$key];

		if( $i->expires <= time() ) {
			return null;
		}

		return $i->data;
	}

	/*
	 * Returns a small report about current state of the cache.
	 */
	static function info()
	{
		$info = array();
		foreach( self::$directories as $dir => $cache )
		{
			$info[] = array(
				'dir' => $dir,
				'lifetime' => $cache->lifetime,
				'count' => count( $cache->data )
			);
		}
		return $info;
	}

	static function clean()
	{
		foreach( self::$directories as $dir => $cache ) {
			self::clean_cache( $cache, $dir );
		}
	}

	private static function clean_cache( $cache, $dir )
	{
		$t = time();
		$keys = array();
		foreach( $cache->data as $k => $i )
		{
			if( $i->expires <= $t ) {
				$keys[] = $k;
			}
		}

		foreach( $keys as $k ) {
			unset( $cache->data[$k] );
		}
	}
}
?>
