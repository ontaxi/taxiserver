<?php
/*
 * Client base to be extended.
 */
class server_client
{
	/*
	 * Connection with the server.
	 */
	private $socket;

	/*
	 * Connect to the server. $addr is a string in form "ip:port".
	 */
	function connect( $addr )
	{
		@$this->socket = stream_socket_client(
			$addr, $errno, $errstr, 10 );
		return (bool) $this->socket;
	}

	function connected() {
		return $this->socket != null;
	}

	/*
	 * Disconnect from the server.
	 */
	function disconnect()
	{
		fclose( $this->socket );
		$this->socket = null;
	}

	function __destruct()
	{
		if( $this->socket ) {
			$this->disconnect();
		}
	}

	protected function send_message( $cmd, $data = array() )
	{
		$m = array( 'command' => $cmd, 'data' => $data );
		return fwrite( $this->socket, json_encode( $m )."\n" );
	}

	protected function receive() {
		return fgets( $this->socket );
	}

	protected function receive_message() {
		return json_decode( fgets( $this->socket ), true );
	}
}

?>
