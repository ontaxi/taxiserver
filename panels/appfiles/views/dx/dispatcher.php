<?php
lib( 'cast' );
dx::init( function()
{
	$arg = argv(1);
	$list = array(
		'car-position',
		'channel-updates',
		'chat-messages',
		'cmd',
		'customer-info',
		'init',
		'locations',
		'ping',
		'prefs',
		'report',
		'route',
		'service-log',
		'service-log-update',
		'queues-snapshot'
	);

	if( !in_array( $arg, $list ) ) {
		return dx::error( "Unknown request" );
	}

	$sid = sid();
	$type = user::get_type();
	if( !$sid || $type != 'dispatcher' ) {
		return dx::error( "Unauthorised" );
	}
	$arg = str_replace( '-', '_', $arg );
	$func = "q_$arg";
	dx::output( $func( $sid ) );
});

//--

function q_chat_messages( $sid )
{
	$from = vars::get( 'from' );
	$to = vars::get( 'to' );
	$driver_id = vars::get( 'driver_id' );
	if( !$from || !$to || !$driver_id ) {
		return dx::error( "`from`, `to` and `driver_id` arguments are required" );
	}
	return dx_disp::chat_messages( $sid, $driver_id, $from, $to );
}

function q_cmd( $sid )
{
	$id = user::get_id();
	$type = user::get_type();

	if( !$sid || $type != 'dispatcher' ) {
		return dx::error( 'Forbidden' );
	}

	$cmd = vars::post( 'cmd' );
	$datastr = alt( vars::post( 'data' ), '{}' );
	if( !$cmd ) {
		return dx::error( "Missing cmd" );
	}
	$data = json_decode( $datastr, true );

	if( !disp_cmd( $id, $sid, $cmd, $data, $err ) ) {
		return dx::error( $err );
	}
	return null; // ok
}

function q_route( $sid )
{
	$from = vars::get( 'from' );
	$to = vars::get( 'to' );
	if( !$from || !$to ) {
		return dx::error( "from and to parameters are required" );
	}

	$url = setting( 'osrm_address' );
	if( !$url ){
		return dx::error( "No router available" );
	}
	$url .= "viaroute?loc=$from&loc=$to";

	$src = curl_get( $url, $err );
	if( !$src ) {
		return dx::error( "No response from router: $err" );
	}
	$data = json_decode( $src, true );
	if( !$data ) {
		return dx::error( "Bad response from router" );
	}
	/* OSRM response has format: {
		version: 0.3,
		status: 0,
		status_message: "Found route between points",
		route_geometry: "..." (encoded string),
		route_summary: {
			total_distance: <meters>,
			total_time: <seconds>,
			start_point: ?,
			alternative_geometris: [],
			alternative_instructions: [],
			alternative_summaries: [],
			route_name: ?,
			alternative_names: [],
			via_points: [ [<lat>,<lon>], ... ],
			hint_data: {
				checksum: <int>,
				locations: [ <encoded strings> ],
				...
			}
		}
	} */
	if( $data['status'] != 0 ) {
		return dx::error( $data['status_message'] );
	}
	/*
	 * Route geometry is compressed into a string.
	 */
	$data['route_geometry'] = osrm_decode( $data['route_geometry'] );
	return $data;
}

/*
 * Decode a string into an array of pairs of float values (polyline).
 * This is the algorithm that Google Maps uses, but with 6 numbers
 * instead of 5.
 */
function osrm_decode( $s )
{
	$precision = pow( 10, - 6 );
	$len = strlen( $s );
	$index = 0;
	$lat = 0;
	$lng = 0;
	$a = array();

	while( $index < $len)
	{
		$shift = 0;
		$result = 0;

		do {
			$b = ord( $s[$index++] ) - 63;
			$result |= ($b & 0x1f) << $shift;
			$shift += 5;
		} while ($b >= 0x20);

		$dlat = (($result & 1) ? ~($result >> 1) : ($result >> 1));
		$lat += $dlat;
		$shift = 0;
		$result = 0;
		do {
			$b = ord($s[$index++]) - 63;
			$result |= ($b & 0x1f) << $shift;
			$shift += 5;
		} while ($b >= 0x20);
		$dlng = (($result & 1) ? ~($result >> 1) : ($result >> 1));
		$lng += $dlng;
		$a[] = array( $lat * $precision, $lng * $precision );
	}
	return $a;
}

function q_locations( $sid )
{
	$term = vars::get( 'term' );
	return dx_disp::locations( $sid, $term );
}

/*
 * When starting, the dispatcher client will have to receive much data
 * to work with.
 */
function q_init( $service_id )
{
	$acc_id = intval( user::get_id() );
	$init = array();

	/*
	 * Who am I
	 */
	$init['who'] = array(
		'type' => user::get_type(),
		'login' => user::get_login(),
		'id' => $acc_id,
		'settings' => DB::getValue( "SELECT prefs FROM taxi_accounts
			WHERE acc_id = %d", user::get_id() )
	);

	/*
	 * Channel sequence and current time.
	 */
	$init["seq"] = channels::seq( $service_id, $acc_id );
	$init["now"] = time();
	/*
	 * Service fares.
	 */
	$init['fares'] = dx_disp::fares( $service_id );
	/*
	 * Drivers and cars lists.
	 */
	$init["drivers"] = dx_disp::drivers( $service_id );
	$init["cars"] = dx_disp::cars( $service_id );

	/*
	 * Driver groups
	 */
	$groups = DB::getRecords( "SELECT group_id, name
		FROM taxi_driver_groups
		WHERE service_id = %d", $service_id );
	$groups_map = array();
	foreach( $groups as $g ) {
		$id = $g['group_id'];
		$g['queues'] = array();
		$groups_map[$id] = $g;
	}

	/*
	 * Driver groups -> queues relations
	 */
	$r = DB::getRecords( "
		SELECT DISTINCT gr.group_id, q2.queue_id
		-- Get group-queue assignments
		FROM taxi_driver_groups gr
		LEFT JOIN taxi_driver_group_queues gq USING (group_id)

		-- Add parent queues to the list (they will not be in assignments)
		JOIN taxi_queues q USING (queue_id)
		LEFT JOIN taxi_queues q2
			ON q2.queue_id = q.queue_id
			OR q2.queue_id = q.parent_id
		WHERE gr.service_id = %d", $service_id );
	$group_queues = array();
	foreach( $r as $row )
	{
		$gid = $row['group_id'];
		$qid = intval( $row['queue_id'] );
		$groups_map[$gid]['queues'][] = $qid;
	}
	cast::table( $groups_map, array(
		'int group_id'
	));
	$init["groups"] = array_values( $groups_map );

	/*
	 * Driver types
	 */
	$init["driver_types"] = DB::getRecords( "SELECT type_id, name
		FROM taxi_driver_types
		WHERE service_id = %d", $service_id );
	cast::table( $init["driver_types"], array(
		'int type_id',
		'str name'
	));

	/*
	 * Driver queues
	 */
	$init["queues"] = dx_disp::queues( $service_id, $acc_id );

	/*
	 * Current queues assignments
	 */
	$init['queues_snapshot'] = q_queues_snapshot( $service_id );

	/*
	 * Recent orders.
	 */
	$init["recent_orders"] = dx_disp::recent_orders( $service_id, $acc_id );

	/*
	 * Locations associated with queues.
	 */
	$init["queue_locations"] = dx_disp::queue_locations( $service_id, $acc_id );

	$areas = DB::getRecords( "
		SELECT name, min_lat, max_lat, min_lon, max_lon
		FROM taxi_service_areas
		WHERE service_id = %d", $service_id );

	$options = service_settings::get_settings( $service_id );
	$options_add = DB::getRecord( "SELECT sessions, imitations,
		service_logs, gps_tracking
		FROM taxi_services WHERE service_id = %d", $service_id );
	$options = array_merge( $options, $options_add );

	/*
	 * Current driver alarms.
	 */
	$init['driver_alarms'] = DB::getRecords("
		SELECT acc_id AS driver_id
		FROM taxi_drivers JOIN taxi_accounts USING (acc_id)
		WHERE service_id = %d
		AND alarm_time IS NOT NULL
	", $service_id );


	$init = array_merge( $init, array(
		'map_areas' => $areas,
		'service_options' => $options,
		'sessions' => service_sessions::get_open_sessions_r( $service_id )
	));

	return $init;
}

/*
 * Get order stats and name of given customer
 */
function q_customer_info( $sid )
{
	$phone = Vars::get( 'phone' );
	$info = DB::getRecord( "
		SELECT
			customer_id,
			name,
			blacklist
		FROM taxi_customers
		WHERE service_id = %d AND phone = '%s'",
		$sid, $phone
	);

	if( isset( $info['customer_id'] ) )
	{
		$id = $info['customer_id'];
		$orders = DB::getRecords("
			SELECT DISTINCT
				o.src_addr
			FROM taxi_orders o
			WHERE service_id = %d
			AND customer_id = %d
			ORDER BY o.time_created DESC
			LIMIT 5",
			$sid, $info['customer_id']
		);
		$addresses = array();
		foreach( $orders as $i => $r ) {
			$addresses[] = parse_address( $r['src_addr'] );
		}
		$info['addresses'] = $addresses;
	}
	return $info;
}

function q_ping()
{
	return array(
		't' => Vars::get( 't' ),
		'server_time' => round( microtime( true ) * 1000 )
	);
}

function q_prefs( $sid )
{
	if( $_SERVER['REQUEST_METHOD'] == 'GET' ) {
		return dx::error( "Must be POST" );
	}

	$id = user::get_id();
	$prefs = vars::post( 'prefs' );
	DB::exec( "UPDATE taxi_accounts
		SET prefs = '%s'
		WHERE acc_id = %d", $prefs, $id );
}

function q_channel_updates( $sid )
{
	$acc_id = user::get_id();
	$seq = Vars::get( 'last-message-id' );
	$messages = channels::get_messages( $sid, $acc_id, $seq );
	return $messages;
}

/*
 * GET queues-snapshot.
 */
function q_queues_snapshot( $sid )
{
	$acc_id = user::get_id();
	return dx_disp::queues_snapshot( $sid, $acc_id );
}

/*
 * Get last $n messages from the server log.
 */
function q_service_log( $sid )
{
	$n = Vars::get( 'n' );
	return service_logs::get_last_messages( $sid, $n );
}
/*
 * Get server log updates.
 */
function q_service_log_update( $sid )
{
	$id = Vars::get( 'id' );
	return service_logs::get_messages_after( $sid, $id );
}

function q_car_position( $sid )
{
	$driver_id = vars::get( 'car_id' );
	$r = DB::getRecord( "SELECT latitude, longitude
		FROM taxi_accounts JOIN taxi_drivers USING (acc_id)
		WHERE acc_id = %d
		AND service_id = %d",
		$driver_id, $sid );
	if( !$r ) {
		return array();
	}
	return array(
		'lat' => $r['latitude'],
		'lon' => $r['longitude']
	);
}

function q_report()
{
	$log = vars::post( 'log' );
	$desc = vars::post( 'desc' );
	log_message( $desc, 'reports' );
	log_message( $log, 'reports' );

	$addr = setting( 'taxi_server_addr' );
	$c = new adm_client();
	$c->connect( $addr );
	$c->dump_memlog( $desc );
	return array();
}

?>
