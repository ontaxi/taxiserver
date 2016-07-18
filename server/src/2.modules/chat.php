<?php

define( 'EV_CHAT_MESSAGE', 'chat-message-event' );
register_event_type( EV_CHAT_MESSAGE );

class chat
{
	static function phrases( $sid, $type )
	{
		$s = service_setting( $sid, 'phrases_driver' );
		if( !$s ) $s = '';
		return array_map( 'trim', explode( "\n", $s ) );
	}

	static function send( $sid, $from, $to, $text ) {
		return self::add_msg( $sid, $from, $to, null, $text );
	}

	static function broadcast( $sid, $from, $to_type, $text ) {
		return self::add_msg( $sid, $from, null, $to_type, $text );
	}

	private static function add_msg( $sid, $from, $to, $to_type, $text )
	{
		if( !$sid || !$from || !$text ) {
			warning( "Illegal arguments in add_msg" );
			return false;
		}
		if( $to && $to_type ) {
			warning( "Illegal arguments in add_msg: to=$to, to_type=$to" );
			return false;
		}

		$acc1 = new taxi_account( $from, 'service_id, type, call_id, deleted' );
		$acc2 = null;

		if( $acc1->deleted() || strlen( $acc1->call_id() ) == 0 ) {
			warning( "Illegal message from account #$from" );
			return false;
		}

		/*
		 * If this is a direct message, check that both accounts exist
		 * and belong to the same service.
		 */
		if( $to )
		{
			$acc2 = new taxi_account( $to, 'service_id, type, deleted' );
			if( $acc2->deleted() || $acc2->service_id() != $acc1->service_id() ) {
				warning( "Illegal chat message from #$from to #$to" );
				return false;
			}
		}
		/*
		 * If this is a broadcast check that the addressee type is valid.
		 */
		else
		{
			if( $to_type != "dispatcher" && $to_type != "driver" ) {
				warning( "Illegal chat broadcast type: $type" );
				return false;
			}
		}

		/*
		 * Insert the row and get the timestamp the database has assigned.
		 */
		$id = DB::insertRecord( 'taxi_chat', array(
			'from' => $from,
			'to' => $to,
			'to_type' => $to_type,
			'text' => $text
		));
		$time = DB::getValue( "SELECT UNIX_TIMESTAMP(t) FROM taxi_chat
			WHERE msg_id = %d", $id );
		announce_event( $sid, EV_CHAT_MESSAGE, array(
			'id' => $id,
			'from' => $from,
			'to' => $to,
			'to_type' => $to_type,
			'text' => $text,
			'time' => $time
		));
		return true;
	}

	static function messages( $sid, $acc_id, $since, $until )
	{
		$sid = intval( $sid );
		$acc_id = intval( $acc_id );
		$type = DB::getValue( "SELECT type FROM taxi_accounts
			WHERE acc_id = %d AND service_id = %d
			AND deleted = 0", $acc_id, $sid );
		if( !$type ) {
			return null;
		}

		$since = intval( $since );
		$until = intval( $until );
		if( !$until ) $until = time() + 10;

		return DB::getRecords("
			SELECT msg_id, text,
				sender.call_id AS from_call_id,
				sender.type AS from_type,
				UNIX_TIMESTAMP(msg.t) AS utc
			FROM
			(
				SELECT `t`, `msg_id`, `text`, `from` FROM taxi_chat msg
				WHERE msg.from = $acc_id
				AND msg.t BETWEEN FROM_UNIXTIME($since) AND FROM_UNIXTIME($until)

				UNION
				SELECT `t`, `msg_id`, `text`, `from` FROM taxi_chat msg
				WHERE msg.to = $acc_id
				AND msg.t BETWEEN FROM_UNIXTIME($since) AND FROM_UNIXTIME($until)

				UNION
				SELECT `t`, `msg_id`, `text`, `from` FROM taxi_chat msg
				WHERE msg.to_type = 'driver'
				AND msg.t BETWEEN FROM_UNIXTIME($since) AND FROM_UNIXTIME($until)
			) msg
			JOIN taxi_accounts sender
				ON msg.from = sender.acc_id"
		);
	}
}

?>
