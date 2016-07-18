<?php
error_reporting(-1);
date_default_timezone_set( 'Europe/Minsk' );
set_time_limit(0);

/*
 * Init object holds an array of functions to be called by the main
 * function just before starting the loop.
 */
class init
{
	static $F = array();
	static function run() {
		foreach( self::$F as $f ) {
			call_user_func( $f );
		}
	}
}
/*
 * Module initialisers are added to this list using the "init" function.
 */
function init( $func ) {
	init::$F[] = $func;
}

function main( $args )
{
	$progname = array_shift( $args );
	read_config( $args );
	init::run();

	$t = time();
	$period = 5;
	schedule( $period, function() use(&$t, $period) {
		$t1 = time();
		$dt = $t1 - $t - $period;
		$t = $t1;
		if( $dt > 10 ) {
			warning( "Late by $dt s" );
		}
	});

	$timeout = 1000; // 1s
	while( true )
	{
		conn::poll( $timeout );
		tasks::tick();
	}
}

function read_config( &$args )
{
	$conf_path = array_shift( $args );
	if( !$conf_path ) {
		$conf_path = 'taxiserver.conf';
	}

	if( !file_exists( $conf_path ) ) {
		fprintf(STDERR, "Config file '%s' does not exist", $conf_path );
		return 1;
	}

	$conf = ejson::parse( file_get_contents( $conf_path ) );
	if( !$conf ) {
		fprintf(STDERR, "Could not parse config file '%s'", $conf_path );
		return 1;
	}
	config::init( $conf );
}

main( $argv );

?>
