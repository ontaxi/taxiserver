<?php
/*
 * This module allows sending generic dialogs to drivers and receive
 * yes/no/none responses.
 */

/*
 * Possible dialog results.
 */
define( 'DRESULT_YES', 'yes' );
define( 'DRESULT_NO', 'no' );
define( 'DRESULT_NONE', 'none' );
define( 'DRESULT_TIMEOUT', 'timeout' );

/*
 * Dialog structure.
 */
class mod_dialog
{
	public $title = '';
	public $text = '';
	public $yes = '';
	public $no = '';
	public $importance = 0; // 0, 1, 2
	public $timeout = 0; // seconds
}

/*
 * Send custom dialog to the taxi. $callback will be called when the
 * result arrives. Returns the dialog identifier, or null on error.
 */
function send_taxi_dialog( $taxi_id, mod_dialog $d, $callback ) {
	return taxi_dialogs::send_dialog( $taxi_id, $d, $callback );
}

init( function()
{
	$NS = 'taxi_dialogs::';
	add_cmdfunc( T_TAXI, 'dialog-result', $NS.'msg_dialog_result' );
});

class taxi_dialogs
{
	/*
	 * Dialog id => callback.
	 */
	private static $callbacks = array();

	static function send_dialog( $taxi_id, mod_dialog $d, $callback )
	{
		$id = uniqid( $taxi_id."_" );

		$lag = get_taxi_lag( $taxi_id );
		$corr = ceil( $lag / 1000 );
		$timeout = $d->timeout - $corr;
		if( $timeout < 3 ) {
			warning( "Not enough dialog time for #$taxi_id (timeout=$d->timeout, lag=$lag ms" );
			return null;
		}

		$m = new message( 'dialog', array(
			'id' => $id,
			'title' => $d->title,
			'text' => $d->text,
			'yes' => $d->yes,
			'no' => $d->no,
			'timeout' => $timeout,
			'importance' => $d->importance
		));

		logmsg( "Send dialog to #$taxi_id: '$d->text', id=$id, timeout=$d->timeout-$corr, importance=$d->importance (lag=$lag ms)",
			get_taxi_service( $taxi_id ), $taxi_id );

		if( !send_to_taxi( $taxi_id, $m ) ) {
			return null;
		}

		self::$callbacks[$id] = $callback;
		postpone( $d->timeout, 'taxi_dialogs::timeout', $id, $taxi_id );
		return $id;
	}

	static function timeout( $id, $taxi_id )
	{
		if( !isset( self::$callbacks[$id] ) ) {
			return;
		}
		logmsg( "Dialog $id has timed out",
			get_taxi_service( $taxi_id ), $taxi_id );
		$c = self::$callbacks[$id];
		unset( self::$callbacks[$id] );
		call_user_func( $c, $id, DRESULT_TIMEOUT, $taxi_id );
	}

	static function msg_dialog_result( $message, $user )
	{
		$taxi_id = $user->id;
		$id = $message->data( 'id' );
		$result = $message->data( 'result' );
		logmsg( "Dialog result: id=$id, result=$result",
			$user->sid, $taxi_id );

		if( !isset( self::$callbacks[$id] ) ) {
			warning( "Received dialog-result with unknown id ($id)" );
			return false;
		}

		$c = self::$callbacks[$id];
		unset( self::$callbacks[$id] );
		call_user_func( $c, $id, $result, $user->id );
	}

}
?>
