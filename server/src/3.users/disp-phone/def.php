<?php

define( 'T_PHONE', 'phone' );

add_auth_func( function( $cid, $str )
{
	$msg = message::parse_from_json( $str );
	if( !$msg || $msg->command != 'phone-auth' ) {
		return null;
	}

	$login = $msg->data( 'login' );
	$pass = $msg->data( 'password' );
	$line_id = $msg->data( 'line_id' );
	$city = $msg->data( 'city' );

	logmsg( "Login: $login, $pass from $line_id" );

	$acc_id = taxi_accounts::check( 'dispatcher', $login, $pass );
	if( !$acc_id ) {
		write_message( $cid, new message( 'auth-failed' ) );
		return false;
	}

	$sid = DB::getValue( "SELECT service_id FROM taxi_accounts
		WHERE acc_id = %d", $acc_id );

	write_message( $cid, new message( 'auth-ok' ) );
	$user = new conn_user( T_PHONE, $acc_id, $sid );
	$user->data( 'line_id', $line_id );
	$user->data( 'city', $city );
	return $user;
});

add_cmdfunc( T_PHONE, 'phone-auth', function( $msg, $user ) {
	disp_channels::send( $user->id, 'line-connected', array(
		'line_id' => $user->data( 'line_id' )
	));
});

listen_events( null, EV_LOGOUT, function( $event ) {
	$user = $event->data['user'];
	if( $user->type != T_PHONE ) {
		return;
	}
	disp_channels::send( $user->id, 'line-disconnected', array(
		'line_id' => $user->data( 'line_id' )
	));
});



add_cmdfunc( T_PHONE, 'ping', function( $msg, $user ) {
	$t = $msg->data( 'time' );
	$lag = $msg->data( 'lag' );
	write_message( $msg->cid, new message( 'pong', array( 'time' => $t ) ) );
});

add_cmdfunc( T_PHONE, 'call', function( $msg, $user )
{
	$phone = $msg->data( 'phone' );
	$t1 = $msg->data( 'time_created' );
	$t2 = $msg->data( 'time_began' );
	$t3 = $msg->data( 'time_ended' );
	$dir = $msg->data( 'dir' );

	if( !$t1 ) {
		warning( "Missing time_created" );
		return false;
	}

	$call_id = sprintf( "%d-%s-%d", $user->id, $phone, $t1 );

	$rec = DB::getRecord( "SELECT creation_time, begin_time, end_time
		FROM taxi_calls WHERE call_id = '%s'", $call_id );

	if( !$rec )
	{
		DB::insertRecord( 'taxi_calls', array(
			'dir' => $dir,
			'call_id' => $call_id,
			'disp_id' => $user->id,
			'phone' => $phone,
			'creation_time' => date( 'Y-m-d H:i:s', $t1 )
		));
	}

	if( $t2 && !$rec['begin_time'] )
	{
		DB::updateRecord( 'taxi_calls',
			array( 'begin_time' => date( 'Y-m-d H:i:s', $t2 ) ),
			array( 'call_id' => $call_id )
		);

		if( $dir == 'in' ) {
			disp_channels::send( $user->id, 'call-accepted', array(
				'call_id' => $call_id,
				'line_id' => $user->data( 'line_id' ),
				'city' => $user->data( 'city' ),
				'caller_id' => $phone,
				'time' => $t2
			));
		}
	}

	if( $t3 )
	{
		DB::updateRecord( 'taxi_calls',
			array( 'end_time' => date( 'Y-m-d H:i:s', $t3 ) ),
			array( 'call_id' => $call_id )
		);
		if( $dir == 'in' ) {
			disp_channels::send( $user->id, 'call-ended', array(
				'call_id' => $call_id
			));
		}
	}
});

?>
