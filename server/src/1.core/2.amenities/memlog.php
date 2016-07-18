<?php
/*
 * Memlog is a buffer in memory which holds recent log messages.
 * The messages are valuable only for debugging, so it is not
 * necessary to write them to files.
 */

function debmsg( $msg )
{
	memlog::msg( array( $msg ) );
}

/*
 * Dump the memlog contents to a file. If no file path given, a file
 * in the working directory will be created.
 */
function memlog_dump( $comments = '', $fpath = null ) {
	memlog::dump( $comments, $fpath );
}

/*
 * memlog_size setting tells how many last messages to keep in memory.
 */
conf_add( 'memlog_size', function( $size ) {
	memlog::$max_size = $size;
});

/*
 * Directory where memlog dumps are saved by default.
 */
conf_add( 'reports_dir', function( $dir ) {
	memlog::$dumps_dir = $dir;
});

init( 'memlog::init' );

class memlog
{
	/*
	 * The contents, a linked list.
	 */
	private static $lines;

	/*
	 * Current size and maximum size.
	 */
	private static $size = 0;
	static $max_size = 0;

	/*
	 * Path to dumps directory. Should be initialised to absolute path
	 * on startup to avoid problems with changed working directory on
	 * crash.
	 */
	static $dumps_dir = '.';

	static function init()
	{
		self::$lines = new SplDoublyLinkedList();
		self::init_dir();
		self::msg( array( 'init' ) );
	}

	private static function init_dir()
	{
		self::$dumps_dir = realpath( self::$dumps_dir );
		assert( self::$dumps_dir != false );
		if( !file_exists( self::$dumps_dir ) ) {
			mkdir( self::$dumps_dir );
		}
	}

	static function msg( $cols )
	{
		$t = floor( microtime( true ) * 1000 );
		$ms = sprintf( "%03d", $t % 1000 );
		$line = date( "H:i:s" ) . ".$ms\t" . implode( "\t", $cols );
		if( !self::$lines ) {
			error( $line );
			error( "memlog not ready" );
			return;
		}

		while( self::$size > 0 && self::$size >= self::$max_size ) {
			self::$lines->shift();
			self::$size--;
		}
		self::$lines->push( $line );
		self::$size++;
	}

	static function dump( $comments, $fpath )
	{
		if( !$fpath ) {
			$fpath = self::$dumps_dir . '/' . date( 'Y-m-d-H-i-s' ) . '.log';
		}
		$f = fopen( $fpath, 'w' );
		fwrite( $f, $comments . PHP_EOL.PHP_EOL );
		$l = self::$lines;
		for( $l->rewind(); $l->valid(); $l->next() ) {
			fwrite( $f, $l->current().PHP_EOL );
		}
		fclose( $f );
	}

	static function get()
	{
		$s = '';
		$l = self::$lines;
		for( $l->rewind(); $l->valid(); $l->next() ) {
			$s .= $l->current().PHP_EOL;
		}
		return $s;
	}
}

?>
