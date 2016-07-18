<?php
define( 'T_WEB', 'web' );

add_auth_func( function( $cid, $str, $client ) {
	if( !strpos( $str, "HTTP/1.1" ) ) {
		return null;
	}
	// switch client to mime format
	$client->mode = 'mime';
	return new conn_user( T_WEB, 0, 0 );
});

add_cmdfunc( T_WEB, 'GET', function( $msg, $user ) {
	http_server::handle( $msg );
});

function http_mount( $path, $func ) {
	if( substr( $path, -1 ) != '/' ) {
		$path .= '/';
	}
	http_server::$mounts[$path] = array(
		'func' => $func,
		'strict' => false
	);
}

function http_add( $path, $func ) {
	http_server::$mounts[$path] = array(
		'func' => $func,
		'strict' => true
	);
}

function http_not_found( $path, $msg, $response ) {
	warning( "Unknown path: $path" );
	$response->set_body( "Not found: $path", "text/plain" );
	return 404;
}

function http_request_auth( $response, $realm = "taxi server" ) {
	$response->set_header( 'WWW-Authenticate', 'Basic realm="$realm"' );
	return 401;
}

function http_get_auth( $msg )
{
	$h = $msg->data( 'Authorization' );
	if( !$h ) {
		return null;
	}

	if( strpos( $h, 'Basic ' ) !== 0 ) {
		return null;
	}

	$val = ltrim( substr( $h, strlen( 'Basic ' ) ) );
	$val = base64_decode( $val );
	return explode( ':', $val, 2 );
}

class http_response
{
	private $headers = array(
		'Content-Type' => 'text/html'
	);
	private $body = '';
	private $status = 200;

	function set_body( $body, $type = 'text/html' )
	{
		$this->body = $body;
		$this->headers['Content-Length'] = strlen( $this->body );
		$this->headers['Content-Type'] = $type;
	}

	function set_status( $code ) {
		$this->status = $code;
	}

	function set_header( $k, $v ) {
		$this->headers[$k] = $v;
	}

	function begin() {
		ob_start();
	}

	function end() {
		$this->set_body( ob_get_clean() );
	}

	function format()
	{
		$codes = array(
			200 => 'OK',
			401 => 'Unauthorized',
			404 => 'Not Found'
		);
		$codename = $codes[$this->status];

		$lines = array(
			"HTTP/1.1 $this->status $codename",
		);

		foreach( $this->headers as $name => $value ) {
			$lines[] = "$name: $value";
		}
		$lines[] = '';
		if( $this->body != '' ) {
			$lines[] = $this->body;
		}
		$lines[] = '';
		return implode( "\r\n", $lines );
	}
}

class http_server
{
	static $mounts = array();

	static function handle( $msg )
	{
		$path = $msg->data['path'];
		$cid = $msg->cid;

		/*
		 * Find the function to call.
		 */
		$func = null;
		foreach( self::$mounts as $pref => $mount )
		{
			if( strpos( $path, $pref ) !== 0 ) {
				continue;
			}
			if( $mount['strict'] && $path != $pref ) {
				continue;
			}
			$func = $mount['func'];
			break;
		}

		if( !$func ) {
			$func = 'http_not_found';
		}

		/*
		 * Create an empty response and give it
		 * to the function to fill.
		 */
		$response = new http_response();
		$code = call_user_func( $func, $path, $msg, $response );
		if( $code ) {
			$response->set_body( "Status $code", "text/plain" );
			$response->set_status( $code );
		}

		/*
		 * Send the response.
		 */
		conn_send( $cid, $response->format() );
		return;
	}
}


?>
