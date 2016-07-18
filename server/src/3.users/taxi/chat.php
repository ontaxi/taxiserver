<?php

init( function()
{
	$NS = 'taxi_chat_prev::';
	add_cmdfunc( T_TAXI, 'get-road-messages', $NS.'msg_get_road_messages' );
	add_cmdfunc( T_TAXI, 'road-message', $NS.'msg_road_message' );
});

class chat_message
{
	static $c = 0;
	public $id;
	public $time;
	public $author;
	public $text;

	function __construct( $author, $text )
	{
		$this->id = ++self::$c;
		$this->time = time();
		$this->author = $author;
		$this->text = $text;
	}
}

class taxi_chat_prev
{
	/*
	 * How old messages should become to be deleted.
	 */
	const KEEP_TIME = 7200;

	/*
	 * Array of arrays of messages, indexed by service id.
	 */
	private static $msg = array();

	private static function clean()
	{
		$now = time();
		foreach( self::$msg as $sid => $list )
		{
			$n = count( $list );
			while( $n > 0 &&
				($now - self::$msg[$sid][0]->time > self::KEEP_TIME ) )
			{
				array_shift( self::$msg[$sid] );
				$n--;
			}
		}
	}

	static function msg_get_road_messages( $msg, $user )
	{
		$sid = $user->sid;
		$list = array();
		if( isset( self::$msg[$sid] ) )
		{
			self::clean();
			foreach( self::$msg[$sid] as $cm )
			{
				$list[] = array(
					'message_id' => $cm->id,
					'author' => $cm->author,
					'text' => $cm->text,
					'timestamp' => $cm->time
				);
			}
		}

		$m = new message( 'road-messages', array( 'list' => $list ) );
		return send_to_taxi( $user->id, $m );
	}

	static function msg_road_message( $msg, $user )
	{
		$sid = $user->sid;
		if( !isset( self::$msg[$sid] ) ) {
			self::$msg[$sid] = array();
		}
		else {
			self::clean();
		}

		/*
		 * Add the message to the history.
		 */
		$text = $msg->data( 'text' );
		$author = get_taxi_call_id( $user->id );
		$cm = new chat_message( $author, $text );
		self::$msg[$sid][] = $cm;

		/*
		 * Retranslate the message.
		 */
		$m = new message( 'road-message', array(
			'message_id' => $cm->id,
			'timestamp' => $cm->time,
			'author' => $author,
			'text' => $text
		));
		taxi_broadcast( $sid, $m );
	}

}

?>
