<?php
define( 'T_CENTER', 'center' );

$ns = 'master_proto::';
add_auth_func( $ns.'auth' );
add_cmdfunc( T_CENTER, 'auth-center', $ns.'msg_auth_center' );
add_cmdfunc( T_CENTER, 'ping', $ns.'msg_ping' );
add_cmdfunc( T_CENTER, 'get-free-cars', $ns.'msg_get_free_cars' );

class master_proto
{
	static function auth( $cid, $str )
	{
		$m = message::parse_from_json( $str );
		if( !$m || $m->command != 'auth-center' ) return null;

		$login = $m->data( 'login' );
		$password = $m->data( 'password' );

		$acc_id = taxi_accounts::check( T_CENTER, $login, $password );
		if( !$acc_id ) {
			write_message( $cid, new message( 'auth-failed' ) );
			return false;
		}
		$data = array( 'options' => array( 'vip', 'type' ) );
		write_message( $cid, new message( 'auth-ok', $data ) );

		$sid = taxi_accounts::service_id( $acc_id );
		return new conn_user( T_CENTER, $acc_id, $sid );
	}

	static function msg_auth_center( $msg, $user )
	{
		//
	}

	static function msg_ping( $msg, $user )
	{
		$rtt = $msg->data( 'prev_rtt' );

		$client = conn_find_user( $user );
		if( !$client ) {
			warning( "No client for $user" );
			return false;
		}

		$client->rtt = $rtt;

		$d = array( 't' => $msg->data( 't' ) );
		return write_message( $msg->cid, new message( 'pong', $d ) );
	}

	static function msg_get_free_cars( $msg, $user )
	{
		$keys = array( 'min_lat', 'max_lat', 'min_lon', 'max_lon' );
		$bounds = array();
		foreach( $keys as $k ) {
			$bounds[$k] = $msg->data( $k );
		}
		$cars = self::free_cars( $user->sid, $bounds );

		$data = array(
			'request_id' => $msg->data( 'request_id' ),
			'list' => $cars
		);
		return write_message( $msg->cid, new message( 'free-cars', $data ) );
	}

	private static function free_cars( $sid, $bounds, $max = 20 )
	{
		$sid = intval( $sid );
		$max = intval( $max );

		$keys = array( 'min_lat', 'max_lat', 'min_lon', 'max_lon' );
		foreach( $keys as $k )
		{
			if( !isset( $bounds[$k] ) ) {
				warning( "free_cars: incorrect bounds parameter" );
				return array();
			}
			$bounds[$k] = floatval( $bounds[$k] );
		}

		$q = "SELECT
			driver.latitude AS lat,
			driver.longitude AS lon
		FROM taxi_drivers driver
		JOIN taxi_accounts acc USING (acc_id)
		JOIN taxi_cars car USING (car_id, service_id)
		WHERE driver.deleted = 0
		AND driver.block_until < NOW()
		AND acc.service_id = $sid
		AND driver.is_online
		AND TIMESTAMPDIFF( SECOND, driver.last_ping_time, NOW() ) < 20
		AND (NOT EXISTS (SELECT order_id
				FROM taxi_orders
				WHERE taxi_id = driver.acc_id
				AND `status` NOT IN ('cancelled', 'dropped', 'finished')
		))
		AND driver.accept_new_orders
		AND driver.latitude BETWEEN $bounds[min_lat] AND $bounds[max_lat]
		AND driver.longitude BETWEEN $bounds[min_lon] AND $bounds[max_lon]
		LIMIT $max";
		return DB::getRecords( $q );
	}
}

?>
