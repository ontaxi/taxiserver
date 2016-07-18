<?php

function get_http( $url ) {
	return __http::get( $url );
}

class __http
{
	private static $c = null;

	static function get( $url )
	{
		if( !self::$c ) {
			self::init();
		}

		curl_setopt( self::$c, CURLOPT_URL, $url );
		$str = curl_exec( self::$c );
		$errno = curl_errno( self::$c );
		if( $errno ) {
			$errstr = curl_error( self::$c );
			warning( "Could not get $url: $errno $errstr" );
			return null;
		}
		return $str;
	}

	private static function init()
	{
		self::$c = curl_init();
		curl_setopt_array( self::$c, array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => 3
		));


		$headers = array(
			"User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:45.0) Gecko/20100101 Firefox/45.0",
			"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"DNT: 1",
			//"Accept-Encoding: gzip, deflate",
			//"Accept-Language: en-GB,en;q=0.5"
		);
		curl_setopt( self::$c, CURLOPT_HTTPHEADER, $headers );
	}
}

?>
