<?php

init( function()
{
	$NS = 'taxi_chat::';
	add_cmdfunc( T_TAXI, 'get-chat-phrases', $NS.'msg_get_chat_phrases' );
	add_cmdfunc( T_TAXI, 'get-chat-messages', $NS.'msg_get_chat_messages' );
	add_cmdfunc( T_TAXI, 'send-chat-message', $NS.'msg_send_chat_message' );
	listen_events( null, EV_CHAT_MESSAGE, $NS.'ev_chat_message' );
});

class taxi_chat
{
	static function msg_get_chat_phrases( $msg, $user )
	{
		$phrases = chat::phrases( $user->sid, "driver" );
		$m = new message( 'chat-phrases', $phrases );
		return write_message( $msg->cid, $m );
	}

	static function msg_get_chat_messages( $msg, $user )
	{
		$t1 = $msg->data( "since" );
		$t2 = $msg->data( "until" );
		if( !$t1 || !is_numeric( $t1 ) ) {
			driver_error( $msg->cid, "The `since` field must be a UTC timestamp" );
			return false;
		}
		if( $t2 && !is_numeric( $t2 ) ) {
			driver_error( $msg->cid, "The `until` field must be a UTC timestamp or `null`" );
			return false;
		}

		$messages = chat::messages( $user->sid, $user->id, $t1, $t2 );
		if( $messages === null ) {
			warning( "Couldn't get messages for $user" );
			return false;
		}
		$list = array();
		foreach( $messages as $m ) {
			$list[] = array(
				'id' => $m['msg_id'],
				'time' => $m['utc'],
				'text' => $m['text'],
				'from' => "$m[from_type]:$m[from_call_id]"
			);
		}
		return write_message( $msg->cid, new message( 'chat-messages', $list ) );
	}

	static function msg_send_chat_message( $msg, $user )
	{
		$to = $msg->data( 'to' );
		$text = $msg->data( 'text' );

		if( !is_string( $to ) || !is_string( $text ) ) {
			driver_error( $msg->cid, "The `to` and `text` fields must be strings" );
			return false;
		}

		$text = trim( $text );
		if( strlen( $text ) == 0 ) {
			driver_error( $msg->cid, "Empty text in send-chat-message" );
			return false;
		}

		$pos = strpos( $to, ':' );
		if( !$pos ) {
			driver_error( $msg->cid, "The `to` field must be in form 'type:id'" );
			return false;
		}
		/*
		 * Parse the address.
		 */
		$type = substr( $to, 0, $pos );
		$call_id = substr( $to, $pos + 1 );
		/*
		 * Here we allow drivers only to send dispatcher broadcasts.
		 */
		if( $type != "dispatcher" ) {
			driver_error( $msg->cid, "Unknown account type '$type' in address '$to' ('dispatcher' expected)" );
			return false;
		}
		if( strlen( $call_id ) > 0 ) {
			driver_error( $msg->cid, "Only dispatcher broadcast is allowed" );
			return false;
		}

		return chat::broadcast( $user->sid, $user->id, $type, $text );
	}

	/*
	 * Transmit relevant chat messages to drivers.
	 */
	static function ev_chat_message( $event )
	{
		/*
		 * If to a single driver or from a single driver,
		 * pass to that driver.
		 */
		$from = $event->data['from'];
		$to = $event->data['to'];
		if( is_driver( $from ) || is_driver( $to ) )
		{
			if( is_driver( $from ) ) {
				$driver_id = $from;
			} else {
				$driver_id = $to;
			}

			$m = self::format_message( $event );
			send_to_taxi( $driver_id, $m );
			return;
		}

		/*
		 * If to all drivers, broadcast to all drivers.
		 */
		if( $event->data['to_type'] == "driver" ) {
			$m = self::format_message( $event );
			taxi_broadcast( $event->sid, $m );
			return;
		}
	}

	private static function format_message( $event )
	{
		$acc = new taxi_account( $event->data['from'], 'type, call_id' );
		$from_addr = sprintf( "%s:%s", $acc->type(), $acc->call_id() );
		$m = new message( 'chat-message', array(
			'id' => $event->data['id'],
			'text' => $event->data['text'],
			'time' => $event->data['time'],
			'from' => $from_addr
		));
		return $m;
	}
}

?>
