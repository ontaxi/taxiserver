<?php

/*

// use case:

$url = new URL_HTTP( 'http://mysite.com/subfolder/subfolder2/index.php?a=one&b=two&url='.urlencode( 'http://a.com' ) );

var_dump( $url->query_var( 'a' ) ); // 'one'
var_dump( $url->query_var( 'c' ) ); // null

$url->query_var( 'c', '3' );
var_dump( $url->query_var( 'c' ) ); // '3'

var_dump( $url->pwd() ); // '/subfolder/subfolder2/'
var_dump( $url->file() ); // index.php
// note: there is no way to tell whether the last element is a directory
// or a file. We will consider a name as directory if it has a slash at
// the end:
// "/subfolder" - file
// "/subfolder/" - directory

var_dump( (string)$url ); // http://mysite.com/subfolder/subfolder2/index.php?a=one&b=two&url=http%3A%2F%2Fa.com&c=3

$url->file( 'new.php' ); // query vars will be dropped, assign them again manually if needed
var_dump( (string)$url ); // 'http://mysite.com/subfolder/subfolder2/new.php'

//$url->cd( '/' ) // http://mysite.com; file will be dropped, assign it again manually if needed
/**/

class URL_HTTP
{
	private $scheme = ''; // http
	// ://
	private $host = ''; // mysite.com
	private $port = ''; // 8080
	private $directories = array(); // /dir/subdir/
	private $_file = ''; // index.htm
	private $query_vars = array(); // ?a=b&c=d
	private $fragment = ''; // #anchor


	function __construct( $url )
	{
		$data = parse_url( $url );

		if( isset( $data['scheme'] ) ){
			$this->scheme = $data['scheme'];
		}

		if( isset( $data['port'] ) ){
			$this->port = $data['port'];
		}

		if( isset( $data['host'] ) ){
			$this->host = $data['host'];
		}

		if( isset( $data['path'] ) )
		{
			$path = $data['path'];
			// if we don't have a slash at the end,
			// then we assume there is a filename
			if( substr( $path, -1 ) != '/' )
			{
				// get position of the last slash
				// to separate it from the directory
				$pos = strrpos( $path, '/' );

				// if there is no slash at all, then the $path is
				// only a filename, without directories
				if( $pos === false ){
					$this->_file = $path;
					$path = '';
				} else {
					$this->_file = substr( $path, $pos + 1 );
					$path = substr( $path, 0, $pos + 1 );
				}
			}

			// trim the '/' from the ends
			$path = trim( $path, '/' );
			if( !$path ){
				$this->directories = array();
			} else {
				$this->directories = explode( '/', $path );
			}
		}

		if( isset( $data['fragment'] ) ){
			$this->fragment = $data['fragment'];
		}

		if( isset( $data['query'] ) ){
			parse_str( $data['query'], $this->query_vars );
		}
	}

	private function path( $path = false )
	{
		if( $path === false ){
			return $this->pwd().$this->file();
		}

		// reset all that is not above the path
		$this->query_vars = array();
		$this->_file = '';
		$this->fragment = '';

		// if we don't have a slash at the end,
		// then we assume there is a filename
		if( substr( $path, -1 ) != '/' )
		{
			// get position of the last slash
			// to separate it from the directory
			$pos = strrpos( $path, '/' );

			// if there is no slash at all, then the $path is
			// only a filename, without directories
			if( $pos === false ){
				$this->_file = $path;
				$path = '';
			} else {
				$this->_file = substr( $path, $pos + 1 );
				$path = substr( $path, 0, $pos + 1 );
			}
		}

		// trim the '/' from the ends
		$path = trim( $path, '/' );
		if( !$path ){
			$this->directories = array();
		} else {
			$this->directories = explode( '/', $path );
		}
	}

	function query_var( $name, $value = false )
	{
		if( $value === false )
		{
			if( isset( $this->query_vars[$name] ) ){
				return $this->query_vars[$name];
			} else {
				return null;
			}
		}
		if( $value === null ){
			unset( $this->query_vars[$name] );
		} else {
			$this->query_vars[$name] = $value;
		}
	}

	function pwd()
	{
		$path = implode( '/', $this->directories );
		if( $path ){
			$path .= '/';
		}
		return '/'.$path;
	}

	function file( $file = false )
	{
		if( $file === false ){
			return $this->_file;
		}

		$this->_file = $file;
		$this->query_vars = array();
		$this->fragment = '';
		return;
	}

	function set( $path )
	{
		$data = parse_url( $path );

		if( isset( $data['path'] ) ){
			$this->path( $data['path'] );
		}

		if( isset( $data['query'] ) ){
			parse_str( $data['query'], $this->query_vars );
		}

		if( isset( $data['fragment'] ) ){
			$this->fragment = $data['fragment'];
		}
	}

	function __toString()
	{
		$url = '';
		if( $this->scheme ){
			$url .= $this->scheme . '://';
		}

		$url .= $this->host;

		if( $this->port ){
			$url .= ':'.$this->port;
		}

		$url .= $this->pwd().$this->_file;

		$query = '';
		foreach( $this->query_vars as $name => $value )
		{
			$query .= $query ? '&' : '?';
			$query .= $name.'='.urlencode( $value );
		}
		$url .= $query;
		if( $this->fragment ){
			$url .= '#'.$this->fragment;
		}
		return $url;
	}

}

?>
