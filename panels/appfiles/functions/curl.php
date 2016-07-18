<?php

function curl_get( $url, &$errstr, $timeout = 3 )
{
	static $c = null;

	if( !$c ) {
		$c = curl_init();
		curl_setopt_array( $c, array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT => $timeout
		));
	}

	curl_setopt( $c, CURLOPT_URL, $url );
	$src = curl_exec( $c );
	if( curl_errno( $c ) ) {
		$errstr = curl_error( $c );
		return null;
	}

	$errstr = null;
	return $src;
}

?>
