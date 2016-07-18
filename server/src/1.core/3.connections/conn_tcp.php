<?php
conf_add( 'listen', function( $listen )
{
	$s = new conn_tcp( $listen );
	conn::register_interface( $s );
});

init( 'conn::connect' );

/*
 * TCP connections box for the server conn interface.
 */
class conn_tcp
{
	/*
	 * The socket to listen.
	 */
	private $listen_sockets = array();

	/*
	 * Client sockets indexed by connection id. Connection ids are
	 * strings in the form "<ip>:<port>".
	 */
	private $client_sockets = array();

	/*
	 * Identifier that the connections module will assign to this
	 * instance.
	 */
	private $iid;

	/*
	 * Hooks to which the application will attach functions.
	 */
	private $on_connect; // on_connect( $iid, $cid )
	private $on_receive; // on_receive( $iid, $cid, $data )
	private $on_disconnect; // on_disconnect( $iid, $cid, $reason )
	private $on_send;

	private $conf;

	function __construct( $listen )
	{
		$this->conf = $listen;
	}

	/*
	 * Given a socket descriptor, returns its connection id.
	 */
	private function get_socket_id( $socket )
	{
		$address = $port = null;
		/*
		 * We use error suppression because we expect that this call
		 * may trigger an error and there is no way to check that in
		 * advance.
		 */
		$cid = stream_socket_get_name( $socket, true );
		if( $cid ) return $cid;

		/*
		 * A backup option in case the above fails, linear search.
		 * Was necessary with plain sockets, maybe not needed now with
		 * streams.
		 */
		$id = null;
		foreach( $this->client_sockets as $cid => $s )
		{
			if( $s == $socket ) {
				$id = $cid;
				break;
			}
		}
		return $id;
	}

	function assign( $iid, $on_connect, $on_disconnect, $on_receive )
	{
		$this->iid = $iid;
		$this->on_connect = $on_connect;
		$this->on_disconnect = $on_disconnect;
		$this->on_receive = $on_receive;
	}

	/*
	 * Start listening.
	 */
	function connect()
	{
		foreach( $this->conf as $addr => $options ) {
			logmsg( "Listening $addr" );
			$s = $this->listen( $addr, $options );
			if( !$s ) {
				return false;
			}
			$this->listen_sockets[] = $s;
		}
		return true;
	}

	private function listen( $addr, $options )
	{
		$s = stream_socket_server( $addr );
		if( !$s ) {
			return null;
		}

		if( !empty( $options ) )
		{
			$transport = substr( $addr, 0, strpos( $addr, ':' ) );
			$conf = array( $transport => $options );
			$ok = stream_context_set_option( $s, $conf );
			if( !$ok ) {
				fclose( $s );
				return null;
			}
		}

		if( strpos( $addr, "ssl://" ) === 0 ) {
			stream_set_timeout( $s, 3 );
		}

		return $s;
	}

	/*
	 * Checks all active sockets and calls corresponding on_* functions
	 * to process the data. Timeout is in milliseconds.
	 */
	function poll( $timeout = 0 )
	{
		$null = null;

		$readable_sockets = array_merge(
			$this->listen_sockets, $this->client_sockets
		);

		$sec = intval( $timeout/1000 );
		$usec = ($timeout % 1000) * 1000;

		$r = stream_select( $readable_sockets, $null, $null, $sec, $usec );
		if( !$r ) return;

		foreach( $readable_sockets as $socket )
		{
			if( in_array( $socket, $this->listen_sockets ) ) {
				$this->accept_connection( $socket );
			}
			else {
				$this->receive_data( $socket );
			}
		}
	}

	/*
	 * Accept new connection and register it.
	 */
	private function accept_connection( $socket )
	{
		debmsg( "Accepting connection" );
		@$new_socket = stream_socket_accept( $socket, 5, $cid );
		if( !$new_socket ) {
			logmsg( "Accept failed" );
			return;
		}
		if( !$cid ) {
			warning( "Empty cid in accept_connection" );
			return;
		}
		$this->client_sockets[$cid] = $new_socket;
		call_user_func( $this->on_connect, $this->iid, $cid );
	}

	/*
	 * Receive data from an already connected client.
	 */
	private function receive_data( $socket )
	{
		$cid = $this->get_socket_id( $socket );
		/*
		 * If there is data, pass it to the listener.
		 */
		$buffer = @fread( $socket, 4096 );
		if( $buffer ) {
			call_user_func( $this->on_receive, $this->iid, $cid, $buffer );
		}
		/*
		 * If not, then there is an error and the connection
		 * has to be closed (it is most likely already closed anyway).
		 */
		else {
			$this->close( $cid, '' );
		}
	}

	/*
	 * Closes the given client connection.
	 */
	function close( $cid, $reason = '' )
	{
		if( !isset( $this->client_sockets[$cid] ) ) {
			return false;
		}
		$socket = $this->client_sockets[$cid];
		stream_socket_shutdown( $socket, STREAM_SHUT_RDWR );
		unset( $this->client_sockets[$cid] );
		call_user_func( $this->on_disconnect, $this->iid, $cid, $reason );
		return true;
	}

	/*
	 * Send data to the given client.
	 * $cid is a connection id, $data is a string.
	 */
	function send( $cid, $data )
	{
		if( !isset( $this->client_sockets[$cid] ) ) {
			return false;
		}

		$socket = $this->client_sockets[$cid];
		/*
		 * Suppress errors because it is possible that the client has
		 * just disconnected and the server hasn't discovered it yet.
		 */
		_timer::in();
		$r = @fwrite( $socket, $data );
		_timer::out( "tcp write" );

		if( !$r || $r < strlen( $data ) ) {
			$err = error_get_last();
			if( $err ) {
				warning( "TCP write to $cid failed: $err[message]" );
			}
		}
		return $r;
	}
}

?>
