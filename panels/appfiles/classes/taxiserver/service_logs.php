<?php
class service_logs
{
	/*
	 * Returns messages (as arrays) for given service, for given time
	 * period.
	 */
	static function get_messages( $service_id, $from, $to = null )
	{
		if( !$to ) $to = time();
		return DB::getRecords( "
			SELECT
				message_id,
				UNIX_TIMESTAMP(t) AS t,
				text
			FROM taxi_logs L
			WHERE service_id = %d
			AND L.t BETWEEN FROM_UNIXTIME(%d) AND FROM_UNIXTIME(%d)
			ORDER BY t", $service_id, $from, $to
		);
	}

	/*
	 * Returns last $n messages for the given service.
	 */
	static function get_last_messages( $service_id, $n = 100 )
	{
		return DB::getRecords("
			SELECT * FROM (
				SELECT message_id,
					UNIX_TIMESTAMP(t) AS t,
					text
				FROM taxi_logs L
				WHERE service_id = %d
				ORDER BY L.t DESC
				LIMIT %d) rev
			ORDER BY t
		", $service_id, $n );
	}

	/*
	 * Returns service messages after the message with the given id.
	 */
	static function get_messages_after( $service_id, $id )
	{
		return DB::getRecords("
			SELECT message_id,
				UNIX_TIMESTAMP(t) AS t,
				text
			FROM taxi_logs L
			WHERE service_id = %d
			AND message_id > %d
			ORDER BY L.t
		", $service_id, $id );
	}

	/*
	 * Adds a message to the log with given service id and current
	 * timestamp.
	 */
	static function add_message( $service_id, $text )
	{
		return DB::insertRecord( 'taxi_logs', array(
			'service_id' => $service_id,
			'text' => $text
		));
	}
}
?>
