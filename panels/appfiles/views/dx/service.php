<?php

$sid = sid();
$type = user::get_type();
if( !$sid || $type != 'service' ) {
	error_forbidden();
}

$list = array(
	'login-taken'
);

dx::dispatch( argv(1), $list, $sid );

function q_login_taken( $sid )
{
	$login = vars::get( 'login' );
	$type = vars::get( 'type' );
	return DB::exists( 'taxi_accounts', array(
		'login' => $login,
		'type' => $type,
		'service_id' => $sid
	));
}

?>
