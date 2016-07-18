<?php
class channels
{
	/*
	 * Puts a message to the channel.
	 */
	static function broadcast( $channel_id, $loc_id, $type, $data = array() )
	{
		if( !$channel_id ) return false;

		$message = array(
			'type' => $type,
			'data' => $data
		);

		return DB::insertRecord( 'taxi_channels', array(
			'channel_id' => $channel_id,
			'loc_id' => $loc_id,
			'message' => json_encode( $message )
		));
	}

	/*
	 * Returns messages with id greater than $start_message_id.
	 * If $start_message_id is null, an "init" message is returned.
	 */
	static function get_messages( $service_id, $acc_id, $start_message_id = null )
	{
		/*
		 * If no sequence number is given, return init message with
		 */
		if( $start_message_id === null ) {
			return array(
				'message_id' => self::seq( $service_id, $acc_id ),
				'type' => 'init'
			);
		}

		$service_id = intval( $service_id );
		$acc_id = intval( $acc_id );
		$start_message_id = intval( $start_message_id );

		$where = "message_id > $start_message_id";
		$filter = self::filter( $service_id, $acc_id );
		if( $filter ) {
			$where .= " AND " . $filter;
		}

		$q = "SELECT message_id, message
			FROM taxi_channels
			WHERE $where
			ORDER BY message_id";

		$A = DB::getRecords( $q );
		$messages = array();
		foreach( $A as $a )
		{
			$m = json_decode( $a['message'], true );
			$m['message_id'] = $a['message_id'];
			$messages[] = $m;
		}
		return $messages;
	}

	static function seq( $service_id, $acc_id )
	{
		$where = self::filter( $service_id, $acc_id );
		if( $where == '' ) {
			trigger_error( "Empty filter" );
			return 0;
		}
		$id = DB::getValue( "SELECT MAX(message_id)
			FROM taxi_channels
			WHERE $where" );
		if( !$id ) $id = '0';
		return $id;
	}

	private static function filter( $service_id, $acc_id )
	{
		$loc_id = DB::getValue( "SELECT loc_id FROM taxi_dispatchers
			WHERE acc_id = %d", $acc_id );

		$filter = array();
		if( $service_id ) {
			$filter[] = "channel_id IS NULL OR channel_id = $service_id";
		}
		if( $acc_id ) {
			$filter[] = "acc_id IS NULL OR acc_id = $acc_id";
		}
		if( $loc_id ) {
			$filter[] = "loc_id IS NULL OR loc_id = $loc_id";
		}
		if( empty( $filter ) ) {
			return '';
		}

		return "(" . implode( ") AND (", $filter ) . ")";
	}
}

?>
