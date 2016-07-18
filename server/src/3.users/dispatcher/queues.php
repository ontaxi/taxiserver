<?php
init( function()
{
	$NS = 'proto_dispatcher_queues::';
	add_cmdfunc( T_DISPATCHER, 'put-into-queue', $NS.'msg_put_into_queue' );
	add_cmdfunc( T_DISPATCHER, 'remove-from-queue', $NS.'msg_remove_from_queue' );
	add_cmdfunc( T_DISPATCHER, 'restore-queue', $NS.'msg_restore_queue' );
	add_cmdfunc( T_DISPATCHER, 'change-driver-group', $NS.'msg_change_driver_group' );
	add_cmdfunc( T_DISPATCHER, 'suggest-queue', $NS.'msg_suggest_queue' );
	add_cmdfunc( T_DISPATCHER, 'change-queue', $NS.'msg_change_queue' );
});

class proto_dispatcher_queues
{
	/*
	 * Current queue suggestions.
	 * Dicts with keys "taxi_id", "cp_id" and "pos",
	 * indexed by dialog identifiers.
	 */
	private static $checkpoint_suggestions = array();

	static function msg_put_into_queue( $msg, $user )
	{
		$qid = $msg->data( 'queue_id' );
		$pos = $msg->data( 'pos' );

		if( !$qid ) {
			return disp_error( $msg->cid, "Empty or zero queue_id in put-into-queue" );
		}

		$driver_id = disp_get_driver_id( $msg, $user );
		if( !$driver_id ) {
			return disp_error( $msg->cid, "No driver id" );
		}

		if( !queue_unsave( $driver_id ) || !queue_set( $driver_id, $qid, $pos ) ) {
			return disp_error( $msg->cid, "Could not unsave or set queue" );
		}

		return disp_error( $msg->cid, null );
	}

	static function msg_remove_from_queue( $msg, $user )
	{
		$taxi_id = disp_get_driver_id( $msg, $user );
		return disp_result( $msg->cid,
			$taxi_id && queue_unsave( $taxi_id )
			&& queue_remove( $taxi_id )
		);
	}

	static function msg_restore_queue( $msg, $user )
	{
		$taxi_id = disp_get_driver_id( $msg, $user );
		return disp_result( $msg->cid,
			$taxi_id && queue_restore( $taxi_id )
		);
	}

	static function msg_change_driver_group( $msg, $user )
	{
		$driver_id = $msg->data( 'driver_id' );
		$gid = $msg->data( 'group_id' );

		if( get_taxi_service( $driver_id ) != $user->sid ) {
			return disp_error( $msg->cid, "Wrong driver id" );
		}

		$current = DB::getValue( "SELECT group_id FROM taxi_drivers
			WHERE acc_id = %d", $driver_id );
		if( $gid == $current ) {
			warning( "The group is the same, doing nothing." );
			return disp_result( $msg->cid, true );
		}

		$r = DB::getRecord( "SELECT name
			FROM taxi_driver_groups
			WHERE service_id = %d AND group_id = %d", $user->sid, $gid );

		if( !$r ) {
			return disp_error( $msg->cid, "Wrong group id" );
		}

		/*
		 * Remove from current queues and change group.
		 */
		service_log( $user->sid, '{d} перевёл {t`я} в группу «{?}»',
			$user->id, $driver_id, $r['name'] );
		queue_remove( $driver_id );
		queue_unsave( $driver_id );
		DB::exec( "UPDATE taxi_drivers
			SET group_id = %d
			WHERE acc_id = %d", $gid, $driver_id );

		/*
		 * Reassign and send the new list to the driver.
		 */
		update_driver_queues( $driver_id );
		send_text_to_taxi( $driver_id, "Вы переведены в группу «$r[name]»." );

		disp_broadcast( $user->sid, null, 'driver-changed', array(
			'driver_id' => $driver_id,
			'diff' => array(
				'group_id' => $gid
			)
		));

		return disp_result( $msg->cid, true );
	}

	static function msg_change_queue( $msg, $user )
	{
		$qid = $msg->data( 'queue_id' );
		$min = $msg->data( 'min' );
		$priority = $msg->data( 'priority' );

		$q = DB::getRecord( "SELECT parent_id, loc_id
			FROM taxi_queues
			WHERE queue_id = %d
			AND service_id = %d", $qid, $user->sid );
		if( !$q ) {
			return disp_error( $msg->cid, "Wrong queue id" );
		}

		$parent_id = $q['parent_id'];
		if( !taxi_queues::allocate_priority( $parent_id, $priority, $qid ) ) {
			return disp_error( $msg->cid, "Could not set priority of queue #$qid to $priority" );
		}

		DB::exec( "UPDATE taxi_queues SET priority = %d, `min` = %d
			WHERE queue_id = %d", $priority, $min, $qid );
		disp_broadcast( $user->sid, $q['loc_id'], 'queue-changed', array(
			'queue_id' => $qid,
			'min' => $min,
			'priority' => $priority
		));

		return disp_result( $msg->cid, true );
	}

	static function msg_suggest_queue( $msg, $user )
	{
		$taxi_id = disp_get_driver_id( $msg, $user );
		$qid = $msg->data( 'queue_id' );
		$pos = $msg->data( 'pos' );

		if( !$taxi_id || !$qid ) {
			return disp_error( $msg->cid, "driver_id and queue_id required" );
		}

		self::make_suggestion( $taxi_id, $qid, $pos );

		$name = queue_name( $qid );
		$pos = $msg->data( 'pos' );
		$text = 'Переместитесь в очередь «'.$name.'»';
		$str = '{d} отправил сообщение {t`ю}: {?}';
		service_log( $user->sid, $str, $user->id, $taxi_id, $text );

		return disp_result( $msg->cid, true);
	}

	static function make_suggestion( $taxi_id, $cpid, $pos )
	{
		$name = queue_name( $cpid );
		$sid = get_taxi_service( $taxi_id );

		logmsg( "Sending suggestion (q$cpid, $pos) to #$taxi_id",
			$sid, $taxi_id );

		$timeout = intval( service_setting( $sid, 'queue_dialog_time', 30 ) );

		$d = new mod_dialog();
		$d->title = 'Назначение от диспетчера';
		$d->text = 'Переместитесь в очередь «'.$name.'»';
		$d->yes = 'Принять';
		$d->no = 'Отказаться';
		$d->timeout = $timeout;
		$d->importance = 2;

		$callback = 'proto_dispatcher_queues::dialog_result';
		$id = send_taxi_dialog( $taxi_id, $d, $callback );
		if( !$id ) {
			warning( "Could not send suggestion dialog to #$taxi_id" );
			return;
		}

		self::$checkpoint_suggestions[$id] = array(
			'taxi_id' => $taxi_id,
			'cp_id' => $cpid,
			'pos' => $pos
		);
	}

	static function dialog_result( $id, $result )
	{
		if( !isset( self::$checkpoint_suggestions[$id] ) ) {
			warning( "Result for unknown dialog: $id" );
			return;
		}

		$s = self::$checkpoint_suggestions[$id];
		$taxi_id = $s['taxi_id'];
		$cp_id = $s['cp_id'];
		$pos = $s['pos'];
		unset( self::$checkpoint_suggestions[$id] );

		switch( $result )
		{
			case DRESULT_YES:
				/*
				 * The driver agrees, assign them to the queue.
				 */
				queue_unsave( $taxi_id );
				queue_set( $taxi_id, $cp_id, $pos );
				return true;

			case DRESULT_NO:
			case DRESULT_NONE:
				/*
				 * The driver disagrees, penalize by removing from the
				 * queue.
				 */
				queue_unsave( $taxi_id );
				queue_remove( $taxi_id );
				break;

			case DRESULT_TIMEOUT:
				/*
				 * Don't penalize for broken connection.
				 */
				break;

			default:
				warning( "Unknown dialog result: $result." );
				return false;
		}
	}
}

?>
