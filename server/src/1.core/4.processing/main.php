<?php
/*
 * Entry point for data coming from outside.
 * $c is a conn_client instance, $str is the received data.
 */
function receive_message( $c, $msg )
{
	$first_message = false;
	/*
	 * If the connection is not authorised, redirect all to
	 * authorisation.
	 */
	if( !$c->user )
	{
		$c->user = auth::authorise( $c, $msg );
		if( !$c->user ) {
			return;
		}
		$user = $c->user;
		$cid = $c->cid;
		logmsg( "Login: $user from $cid", $user->sid, $user->id );
		announce_event( $user->sid, EV_LOGIN, array( 'user' => $user ) );
		$first_message = true;
		/*
		 * Allow this message to be processed too.
		 */
		$c->push_line( $msg );
		if( $c->mode == 'line' ) {
			$c->mode = 'msg';
		}
		return;
	}
	$user = $c->user;

	$message = $msg;

	if( $first_message && $message->timestamp )
	{
		$delta = time() - $message->timestamp;
		debmsg( "timestamp delta: $delta s" );
		/*
		 * The delta is expected to be only as big as a network lag
		 * could be. If the delta is not "too big", we trust the
		 * client's clock without any corrections. But if it's
		 * "too big", then we assume the client's clock is screwed
		 * up.
		 */
		if( abs( $delta ) > 60 ) {
			logmsg( "Time difference for #$user->id is too big: $delta s",
				$user->sid, $user->id );
		}
		$step = 60;
		$delta = $step * round( $delta / $step );

		$client = conn_find_user( $user );
		if( !$client ) {
			error( "Could not find user $user" );
		}
		else {
			$client->time_delta = $delta;
		}
	}

	/*
	 * If this is a delivery confirmation, process it and return.
	 */
	if( $message->command == 'ack' )
	{
		$ack = $message->data;
		if( !is_numeric( $ack ) ) {
			$ack = $message->ack;
		}
		mdelivery::confirm( $ack, $c->user );
		return;
	}

	/*
	 * If confirmation is needed from us, send it.
	 */
	if( $message->ack ) {
		$conf = new message( 'ack', (string) $message->ack );
		write_message( $message->cid, $conf );
		debmsg( "confirmed $message->ack" );
	}

	/*
	 * Pass the message to the processing.
	 */
	mdispatch::dispatch( $message, $c );

	if( $first_message ) {
		mdelivery::resend( $c->user );
	}
}

/*
 * Sends the message as string to the given connection.
 */
function write_message( $cid, $msg ) {
	debmsg( "out: $msg" );
	return conn_send( $cid, $msg->to_json()."\n" );
}

?>
