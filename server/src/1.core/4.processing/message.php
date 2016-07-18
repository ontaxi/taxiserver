<?php
/*
 * A message object with serializing and unserializing functions.
 */
class message
{
	/*
	 * Id of the connection the message came from.
	 */
	public $cid;

	public $command;
	public $data;

	/*
	 * Confirmation number.
	 */
	public $ack = 0;

	public $timestamp = null; // UTC time in milliseconds

	function __construct( $command, $data = array() )
	{
		$this->command = $command;
		$this->data = $data;
		$this->timestamp = time();
	}

	function data( $name, $value = null )
	{
		if( $value === null ) {
			return $this->get_data( $name );
		}
		return $this->set_data( $name, $value );
	}

	private function get_data( $name )
	{
		if( !is_array( $this->data ) || !isset( $this->data[$name] ) ) {
			return null;
		}
		return $this->data[$name];
	}

	private function set_data( $name, $value )
	{
		if( !is_array( $this->data ) ) {
			if( $this->data !== null ) {
				warning( "Discarding message data: $this->data" );
			}
			$this->data = array();
		}
		$this->data[$name] = $value;
	}

	function to_json()
	{
		$a = array(
			'command' => $this->command,
			'data' => $this->data
		);
		if( $this->ack ) {
			$a['ack'] = $this->ack;
		}
		if( $this->timestamp ) {
			$a['timestamp'] = $this->timestamp;
		}
		return json_encode( $a );
	}

	static function parse_from_json( $s )
	{
		$a = json_decode( $s, true );
		if( !is_array( $a ) ) {
			return null;
		}

		if( !array_key_exists( 'command', $a ) ) {
			return null;
		}
		$command = $a['command'];
		if( !is_string( $command ) ) {
			return null;
		}

		if( array_key_exists( 'data', $a ) ) {
			$data = $a['data'];
		}
		else {
			$data = array();
		}

		$m = new message( $command, $data );

		if( isset( $a['timestamp'] ) )
		{
			$t = $a['timestamp'];
			/*
			 * If it's in milliseconds, convert to seconds.
			 */
			if( $t / time() >= 100 ) {
				$t = floor( $t / 1000 );
			}
			$m->timestamp = $t;
		}

		if( isset( $a['ack'] ) ) {
			$m->ack = $a['ack'];
		}

		return $m;
	}

	/*
	 * Parses text form of the message.
	 * Ex: message(text=hello): command is "message", "text" is "hello".
	 */
	static function parse_from_string( $s )
	{
		$command = trim( strtok( $s, '(' ) );
		$params = strtok( ')' );

		$data = array();

		$param = strtok( $params, '=' );
		while( $param )
		{
			$value = strtok( ',' );

			$data[trim($param)] = trim( $value );

			$param = strtok( '=' );
		}
		return new message( $command, $data );
	}

	function __toString()
	{
		$s = $this->command;
		if( $this->ack ) {
			$s .= "(#$this->ack)";
		}
		if( is_array( $this->data ) ) {
			$s .= self::show_dict( $this->data, 2 );
		} else {
			$s .= $this->data;
		}
		return $s;
	}

	private static function show_dict( $d, $recurse )
	{
		$parts = array();
		$i = 0;
		foreach( $d as $k => $v )
		{
			if( is_numeric($k) && $i >= 3 ) {
				$parts[] = '...';
				break;
			}
			$i++;

			if( is_array( $v ) )
			{
				if( $recurse > 0 ) {
					$v = self::show_dict( $v, $recurse - 1 );
				} else {
					$v = '(array)';
				}
			}
			else if( mb_strlen( $v ) > 50 ) {
				$v = mb_substr( $v, 0, 47 ).'...';
			}

			if( $k == 'password' ) {
				$v = ';)';
			}
			$parts[] = "$k=$v";
		}
		return '('.implode( ', ', $parts ).')';
	}

}

?>
