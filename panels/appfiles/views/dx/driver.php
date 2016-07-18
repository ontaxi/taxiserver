<?php
dx::$oldformat = true;
dx::init( 'main' );

function main()
{
	$q = argv(1);

	if( $q == 'auth' ) {
		dx::output( q_auth() );
		return;
	}

	/*
	 * Every client has to pass their token. We get the corresponding
	 * driver identifier from the database.
	 */
	$tok = vars::get('t');
	if( !$tok ) {
		return dx::error( 'Missing token' );
	}

	$acc_id = taxi_accounts::check_token( $tok );
	if( !$acc_id ) {
		return dx::error( 'Invalid token' );
	}

	$allowed = array(
		'test',
		'orders-pool',
		'balance'
	);

	dx::dispatch( argv(1), $allowed, $acc_id );
}

function q_auth()
{
	$login = vars::post( 'name' );
	$pass = vars::post( 'password' );

	$acc_id = taxi_accounts::check( 'driver', $login, $pass );
	if( !$acc_id ) {
		return dx::error( 'Wrong login or password' );
	}

	return array(
		'token' => taxi_accounts::new_token( $acc_id, 86400 )
	);
}


function q_test( $driver_id ) {
	return dx::ok();
}

function q_orders_pool( $driver_id )
{
	$list = dx_driver::pool_orders( $driver_id );
	foreach( $list as $k => $v ) {
		$list[$k] = array_filter( $v );
	}
	return array( 'list' => $list );
}

function q_balance( $driver_id )
{
	return array( 'total' => 0 );
}

?>
