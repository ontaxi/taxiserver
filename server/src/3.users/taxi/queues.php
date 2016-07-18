<?php

init( function()
{
	$NS = 'taxi_base_queues::';
	create_cache( 'queue_report_time' );

	listen_events( null, EV_QUEUE_CHANGE, $NS.'ev_queue_change' );
	listen_events( null, EV_ORDER_ASSIGNED, $NS.'ev_order_assigned' );
	listen_events( null, EV_ORDER_CANCELLED, $NS.'ev_order_cancelled' );
	listen_events( null, EV_SESSION_CLOSED, $NS.'ev_session_closed' );
	listen_events( null, EV_TAXI_BANNED, $NS.'ev_taxi_banned' );
	add_cmdfunc( T_TAXI, 'taxi-login', $NS.'msg_taxi_login_q' );
	add_cmdfunc( T_TAXI, 'set-checkpoint', $NS.'msg_set_checkpoint' );
	add_cmdfunc( T_TAXI, 'update-checkpoints', $NS.'msg_update_checkpoints' );
	add_cmdfunc( T_TAXI, 'update-queues', $NS.'msg_update_queues' );
	add_cmdfunc( T_TAXI, 'ping', $NS.'msg_ping_q' );
});

function update_driver_queues( $driver_id ) {
	taxi_base_queues::send_queues_list( $driver_id );
}

class taxi_base_queues
{
	static function ev_queue_change( $event )
	{
		$taxi_id = $event->data['driver_id'];
		$pos = $event->data['pos'];
		$qid = $pos ? $pos->qid : 0;

		/*
		 * The mandatory "set-checkpoint" message.
		 */
		$m1 = new message( 'set-checkpoint', array(
			'checkpoint_id' => $qid
		));

		/*
		 * The optional status update.
		 */
		if( $pos ) {
			$message = sprintf( "%d/%d", $pos->pos + 1, $pos->len );
		} else {
			$message = "---";
		}
		$m2 = new message( 'status-message', array(
			'message' => $message
		));
		debmsg( "queue position of #$taxi_id: $message" );

		send_to_taxi( $taxi_id, $m1 ) && send_to_taxi( $taxi_id, $m2 );
	}

	static function ev_order_assigned( $event )
	{
		$order = $event->data['order'];
		$taxi_id = $order->taxi_id();

		/*
		 * Save the position in case the order goes wrong.
		 */
		if( !queue_save( $taxi_id, 'order' ) ) {
			return;
		}
		logmsg( "Removing #$taxi_id due to assigned order",
			$event->sid, $taxi_id );
		queue_remove( $taxi_id );
	}

	static function ev_order_cancelled( $event )
	{
		$order = $event->data['order'];
		$taxi_id = $order->taxi_id();
		if( !service_setting( $event->sid, 'restore_queues' ) ) {
			return;
		}

		$reason = $order->cancel_reason();
		if( $reason != 'no_customer' && $reason != 'bad_customer' ) {
			return;
		}

		logmsg( "Restoring queue position ($reason)",
				$event->sid, $taxi_id );
		if( queue_restore( $taxi_id, 'order' ) ) {
			service_log( $event->sid, 'Позиция {t`я} в очереди восстановлена.', $taxi_id );
		}
	}

	/*
	 * Every taxi receives a list of checkpoints upon login in the form
	 * of service-checkpoints message. The list in the message has
	 * checkpoint identifiers, names and sizes.
	 */
	static function msg_taxi_login_q( $message, $user )
	{
		$taxi_id = $user->id;
		/*
		 * Always send queues list regardless of the relogin parameter
		 * because the list might change.
		 */
		self::send_queues_list( $taxi_id );
	}

	/*
	 * Send the queues list to the driver.
	 */
	static function send_queues_list( $taxi_id )
	{
		/*
		 * Get queues accessible to this driver.
		 */
		$Q = taxi_queues( $taxi_id );
		$Q = self::format_queues( $Q );
		$list = array_values( $Q );
		$m = new message( 'service-checkpoints',
			array( 'list' => $list ) );
		return send_to_taxi( $taxi_id, $m );
	}

	/*
	 * Reformat the taxi_queues for the driver client.
	 */
	private static function format_queues( $Q )
	{
		$map = array();
		foreach( $Q as $qid => $q )
		{
			$pid = $q['parent_id'];
			$q = array(
				'subqueues' => array(),
				'checkpoint_id' => $qid,
				'name' => $q['name']
			);
			if( $pid ) {
				$map[$pid]['subqueues'][] = $q;
			}
			else {
				$map[$qid] = $q;
			}
		}
		return $map;
	}

	static function ev_taxi_banned( $event )
	{
		$taxi_id = $event->data['taxi_id'];
		queue_unsave( $taxi_id );
		queue_remove( $taxi_id );
	}

	/*
	 * A taxi sends set-checkpoint(checkpoint_id=<id>) to assign itself to
	 * a checkpoint. If <id> is zero, then the car is removed from its
	 * current point and not assigned anywhere.
	 */
	static function msg_set_checkpoint( $message, $user )
	{
		$taxi_id = $user->id;
		$qid = $message->data( 'checkpoint_id' );
		if( !$qid ) {
			return self::queue_withdraw( $user );
		}

		if( session_needed( $taxi_id ) ) {
			logmsg( "Denied set-checkpoint for #$taxi_id: no open session.",
				$user->sid, $taxi_id );
			send_text_to_taxi( $taxi_id, "У вас не открыта смена." );
		}

		/*
		 * If this queue is a subqueue, deny.
		 */
		$parent_id = upstream_queue( $qid );
		if( $parent_id ) {
			driver_error( $message->cid, "#$taxi_id: set-checkpoint for subqueue q#$qid" );
			return false;
		}

		logmsg( "#$taxi_id pushes to q#$qid", $user->sid, $user->id );

		if( !queue_push( $taxi_id, $qid ) ) {
			driver_error( $message->cid, "#$taxi_id: no access to queue #$qid" );
			return false;
		}

		/*
		 * Because the queue change is intentional, we don't need any
		 * fallbacks.
		 */
		queue_unsave( $taxi_id );

		$name = queue_name( $qid );
		service_log( $user->sid, '{t} записывается в очередь «'.$name.'»', $taxi_id );
	}

	private static function queue_withdraw( $user )
	{
		$taxi_id = $user->id;
		logmsg( "#$taxi_id withdraws from queues",
			$user->sid, $user->id );
		queue_unsave( $taxi_id );

		$pos = get_queue_position( $taxi_id );
		if( $pos ) {
			$name = queue_name( $pos->qid );
			service_log( $user->sid, '{t} уходит из очереди «'.$name.'»', $taxi_id );
		}
		queue_remove( $taxi_id );
	}

	/*
	 * To refresh sizes of the checkpoints a taxi can send
	 * update-checkpoints, and the server will reply with a
	 * checkpoints-update which is almost identical to service-checkpoints
	 * except it doesn't have checkpoint names in the list (only id's and
	 * sizes).
	 */
	static function msg_update_checkpoints( $message, $user )
	{
		$taxi_id = $user->id;
		$sid = $user->sid;

		$counts = DB::getRecords("
			SELECT
				a.queue_id AS checkpoint_id,
				COUNT(*) AS queue_length
			FROM taxi_drivers driver
			JOIN taxi_driver_group_queues USING (group_id)
			LEFT JOIN taxi_queue_drivers a USING (queue_id)
			JOIN taxi_accounts acc ON a.driver_id = acc.acc_id
			WHERE driver.acc_id = $taxi_id
			GROUP BY a.queue_id
		");

		$data = array( 'list' => $counts );
		$m = new message( 'checkpoints-update', $data );
		return send_to_taxi( $taxi_id, $m );
	}

	static function msg_update_queues( $message, $user )
	{
		$taxi_id = $user->id;

		if( session_needed( $taxi_id ) ) {
			debmsg( "Denied update-queues: no session" );
			return false;
		}

		$list = self::queue_drivers( $taxi_id );
		$data = array( 'queues' => $list );
		$m = new message( 'queues-update', $data );
		return write_message( $message->cid, $m );
	}

	/*
	 * Returns driver lists in accessible queues.
	 * The format is special.
	 */
	private static function queue_drivers( $driver_id )
	{
		$r = DB::getRecords("
			SELECT DISTINCT q2.queue_id, qd.pos, acc.call_id
			FROM taxi_drivers driver

			-- add assigned queues
			JOIN taxi_driver_group_queues dq
			USING (group_id)
			JOIN taxi_queues q
			USING (queue_id)

			-- add parent queues to the assigned queues
			JOIN taxi_queues q2
			ON q2.queue_id = q.queue_id
			OR q2.queue_id = q.parent_id

			-- add signed in drivers
			LEFT JOIN taxi_queue_drivers qd
			ON qd.queue_id = q2.queue_id

			-- add driver info
			LEFT JOIN taxi_accounts acc
			ON acc.acc_id = qd.driver_id

			WHERE driver.acc_id = %d
			ORDER BY q2.queue_id, qd.pos
		", $driver_id );

		$result = array();
		foreach( $r as $row )
		{
			$qid = $row['queue_id'];
			if( !isset( $result[$qid] ) ) {
				$result[$qid] = array();
			}
			if( $row['pos'] === null ) continue;
			$result[$qid][] = array( 'call_id' => $row['call_id'] );
		}

		$data = array();
		foreach( $result as $qid => $drivers )
		{
			$data[] = array(
				'checkpoint_id' => $qid,
				'drivers' => $drivers
			);
		}

		return $data;
	}

	static function msg_ping_q( $message, $user )
	{
		$taxi_id = $user->id;

		if( taxi_is_banned( $taxi_id ) ) {
			return;
		}

		$now = time();
		$time = alt( get_cache( 'queue_report_time', $taxi_id ), 0 );
		if( $now - $time < 10 ) {
			return true;
		}
		set_cache( 'queue_report_time', $taxi_id, $now );

		/*
		 * Send current queue status.
		 */
		// TODO: make this an independent task.
		$pos = $size = 0;
		$r = get_queue_position( $taxi_id );
		if( $r ) {
			$pos = $r->pos + 1;
			$size = $r->len;
		}

		if( !$pos || !$size ) {
			$message = "---";
		} else {
			$message = "$pos/$size";
		}
		$m = new message( 'status-message', array(
			'message' => $message
		));
		return send_to_taxi( $taxi_id, $m );
	}

	/*
	 * When a session is closed, the driver has to be removed from any queues.
	 */
	static function ev_session_closed( $event )
	{
		$taxi_id = $event->data['taxi_id'];
		queue_unsave( $taxi_id );
		queue_remove( $taxi_id );
	}
}

?>
