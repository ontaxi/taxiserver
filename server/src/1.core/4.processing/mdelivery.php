<?php
/*
 * Messages sending and optional delivery confirmation.
 */

/*
 * Send a message to the given user. If marked as important, use the
 * confirmation.
 */
function send_message( $user, $message, $important = false ) {
	return mdelivery::send_message( $user, $message, $important );
}

class mdelivery
{
	/*
	 * Maximum number of messages queued for confirmation for a single
	 * client.
	 */
	const MAX_DELIVERY_QUEUE = 10;

	/*
	 * Current ack counter.
	 */
	private static $ack = 0;

	/*
	 * Register for messages awaiting delivery confirmation.
	 * Indexed by conn_user tuples (type+id).
	 */
	private static $register = array();

	static function send_message( $user, $message, $important )
	{
		/*
		 * If the message is important, mark it with a number and put
		 * to the confirmation register.
		 */
		if( $important ) {
			$message->ack = self::acknum();
			self::save_message( $user, $message );
		}
		return self::send( $user, $message );
	}

	/*
	 * Returns next ack value.
	 */
	private static function acknum()
	{
		self::$ack = (self::$ack + 1) % PHP_INT_MAX;
		if( !self::$ack ) {
			debmsg( 'Ack number wrapped' );
			self::$ack = 1;
		}
		return self::$ack;
	}

	/*
	 * Put important message to the "unconfirmed" register for
	 * the given user.
	 */
	private static function save_message( $user, $msg )
	{
		$key = self::ukey( $user );
		if( !isset( self::$register[$key] ) ) {
			self::$register[$key] = array();
		}
		self::$register[$key][] = $msg;

		/*
		 * If the register overfills, drop the oldest unconfirmed
		 * message.
		 */
		if( count( self::$register[$key] ) > self::MAX_DELIVERY_QUEUE )
		{
			$msg = array_shift( self::$register[$key] );
			debmsg( "Giving up to confirm message $msg for user $user" );
		}
	}

	/*
	 * Process receit confirmation.
	 */
	static function confirm( $ack, $user )
	{
		$key = self::ukey( $user );
		if( !isset( self::$register[$key] ) ) {
			warning( "No confirmation register for user $user" );
			return;
		}

		$pos = self::find_message( $key, $ack );
		if( $pos < 0 ) {
			warning( "Received unknown confirmation (ack=$ack) from $user" );
			return;
		}

		/*
		 * Find the message that is being confirmed and remove it from
		 * the register.
		 */
		if( $pos == 0 ) {
			array_shift( self::$register[$key] );
		}
		else {
			warning( "Confirmed message expected to be the first in the queue, but i=$i." );
			array_splice( self::$register[$key], $pos, 1 );
		}

		debmsg( "Ack #$ack OK" );
	}

	private static function find_message( $key, $ack )
	{
		foreach( self::$register[$key] as $i => $msg )
		{
			if( $msg->ack == $ack ) {
				return $i;
			}
		}
		return -1;
	}

	/*
	 * Resend all unconfirmed messages.
	 */
	static function resend( $user )
	{
		$key = self::ukey( $user );
		/*
		 * If there is no queue for this user, don't bother.
		 */
		if( !isset( self::$register[$key] ) ) {
			return;
		}

		debmsg( "Resending messages to $user->id" );

		foreach( self::$register[$key] as $msg )
		{
			if( !self::send( $user, $msg ) ) {
				warning( "Could not resend message $msg to $user" );
				return;
			}
		}
	}

	/*
	 * Returns register key for a given user.
	 */
	private static function ukey( $user ) {
		return $user->type.'_'.$user->id;
	}

	/*
	 * Do the actual sending.
	 */
	private static function send( $user, $msg )
	{
		$client = conn_find_user( $user );
		if( !$client ) {
			debmsg( "$user is not online." );
			return false;
		}

		if( !write_message( $client->cid, $msg ) ) {
			debmsg( "Could not send message to $user" );
			return false;
		}
		return true;
	}
}
?>
