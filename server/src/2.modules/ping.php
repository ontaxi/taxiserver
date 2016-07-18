<?php

/*
 * This module is supposed to "ping" some remote host to find out
 * whether the network is working or not.
 */

conf_add( 'ping_url', function( $url ) {
	mod_ping::$url = $url;
});

conf_add( 'ping_period', function( $t ) {
	if( !is_numeric( $t ) ) {
		warning( "ping_period must be a number" );
		$t = 60;
	}
	mod_ping::$period = $t;
});

init( 'mod_ping::init' );

class mod_ping
{
	static $url = null;
	static $period = 60;

	static function init() {
		if( !self::$url || !self::$period ) return;
		schedule( self::$period, 'mod_ping::ping' );
	}

	static function ping()
	{
		debmsg( "ping ".self::$url );
		$ch = curl_init();
		curl_setopt_array( $ch, array(
			CURLOPT_URL => self::$url,
			CURLOPT_NOBODY => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_CONNECTTIMEOUT => 2,
			CURLOPT_TIMEOUT => 2
		));
		$body = curl_exec( $ch );
		if( $body === false ) {
			warning( "Ping: could not connect to ".self::$url );
		}
		curl_close( $ch );
	}
}

?>
