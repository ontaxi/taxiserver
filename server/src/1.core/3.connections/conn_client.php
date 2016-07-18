<?php

class conn_client
{
	/*
	 * Line buffer for received data.
	 */
	public $buffer = '';

	/*
	 * Measured RTT value in milliseconds.
	 */
	public $rtt = 0;

	/*
	 * Difference between the client's and the server's clocks.
	 */
	public $time_delta = 0;

	/*
	 * Creation time and last incoming activity time.
	 */
	public $time_connected;
	public $t;

	/*
	 * Connection identifier.
	 */
	public $cid;

	/*
	 * Interface identifier.
	 */
	public $iid;

	public $user = null;

	public $mode = 'line';

	function pop_message()
	{
		switch( $this->mode ) {
			case 'line':
				return $this->pop_line();
			case 'msg':
				return $this->pop_msg();
			case 'mime':
				return $this->pop_mime();
			default:
				error( "Unknown mode: $this->mode" );
				return null;
		}
	}

	/*
	 * Push a fetched line back into the buffer.
	 */
	function push_line( $line ) {
		$this->buffer = $line . $this->buffer;
	}

	private function pop_line() {
		$pos = strpos( $this->buffer, "\n" );
		if( $pos === false ) return null;

		$msg = substr( $this->buffer, 0, $pos + 1 );
		$this->buffer = substr( $this->buffer, $pos + 1 );
		return $msg;
	}

	private function pop_msg() {
		$line = $this->pop_line();
		if( !$line ) return null;
		$m = message::parse_from_json( $line );
		if( !$m ) {
			warning( "Could not parse message: $line" );
			return null;
		}
		$m->cid = $this->cid;
		return $m;
	}

	private function pop_mime() {
		$pos = strpos( $this->buffer, "\r\n\r\n" );
		if( $pos === false ) return null;

		$head = substr( $this->buffer, 0, $pos + 1 );
		$this->buffer = substr( $this->buffer, $pos + 4 );

		$lines = explode( "\r\n", $head );
		$line = array_shift( $lines );
		if( !preg_match( '/GET (.*?) HTTP/', $line, $m ) ) {
			warning( "Couldn't parse command: $line" );
			return null;
		}
		$cmd = "GET";
		$path = $m[1];
		foreach( $lines as $line ) {
			list( $k, $v ) = explode( ': ', $line, 2 );
			$data[$k] = trim( $v );
		}
		$data['path'] = $path;
		$m = new message( $cmd, $data );
		$m->cid = $this->cid;
		return $m;
	}

	function __toString()
	{
		return "conn_client($this->user)";
	}
}

?>
