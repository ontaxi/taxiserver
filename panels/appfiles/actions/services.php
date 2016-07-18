<?php

set_actions_access( 'service' );

function save_driver()
{
	$service_id = sid();
	$driver_id = Vars::post( 'id' );
	$pass = Vars::post( 'password' );

	if( !$driver_id )
	{
		$login = Vars::post( 'login' );
		if( taxi_accounts::exists( 'driver', $login ) ) {
			return "Логин &laquo;$login&raquo;уже занят";
		}

		$acc_id = taxi_accounts::create( 'driver', $login, $pass );
		if( !$acc_id ) {
			return false;
		}

		$acc = new taxi_account( $acc_id );
		$acc->service_id( $service_id );

		$driver = new driver();
		$driver->acc_id( $acc_id );
	}
	else
	{
		$driver = new driver( $driver_id, 'acc_id' );
		$acc_id = $driver->acc_id();
		$acc = new taxi_account( $acc_id, 'service_id' );
		if( $service_id != $acc->service_id() ) {
			return false;
		}

		if( vars::post( 'set-password' ) )
		{
			log_message( "$service_id\tNew password for #$driver_id",
				'service_actions' );
			taxi_accounts::change_password( $acc_id, $pass );
		}
	}

	$acc->call_id( Vars::post( 'call_id' ) );
	$acc->name( Vars::post( 'driver-name' ) );
	$acc->work_phone( Vars::post( 'driver-phone' ) );
	$acc->personal_phone( vars::post( 'personal_phone' ) );
	$acc->birth_date( alt(vars::post( 'birth_date' ), null ) );

	$driver->firm( alt( Vars::post( 'driver-firm' ), '' ) );
	$driver->is_fake( Vars::post( 'driver-fake' ) ? '1' : '0' );
	$driver->is_brig( Vars::post( 'driver-brig' ) ? '1' : '0' );
	$driver->has_bank_terminal(
		Vars::post( 'driver-has-bank-terminal' ) ? '1' : '0' );
	$car_id = alt( Vars::post( 'car_id' ), null );
	$driver->car_id( $car_id );

	$group_id = Vars::post( 'group_id' );
	if( !$group_id ) {
		return 'Не указана группа';
	}

	/*
	 * Create new driver group if needed.
	 */
	if( $group_id == -1 ) {
		$g = new driver_group();
		$g->service_id( $service_id );
		$g->name( '№' );
		$group_id = $g->save();
		$g->name( '№ '.$group_id );
		$g->save();
	}

	$driver->group_id( $group_id );

	$type_id = alt( vars::post( 'type_id' ), null );
	$driver->type_id( $type_id );

	if( Vars::post( 'health_cert' ) !== null )
	{
		$names = array(
			'dl_num',
			'dl_expires',
			'health_cert',
			'health_cert_expires',
			'taxi_cert',
			'taxi_cert_expires'
		);
		foreach( $names as $k ) {
			$driver->$k( alt( Vars::post( $k ), null ) );
		}

		$files = Uploads::process_input( 'photo', 'content/drivers' );
		if( !empty( $files ) ) {
			$driver->photo( $files[0] );
		}
	}

	$driver->save();
	$acc->save();

	if( Vars::post( 'block' ) )
	{
		/*
		 * We assume that the PHP's timezone is the same as the client's
		 * timezone. Otherwise we would have to get the client's zone
		 * (possibly from accounts table) and append it to the date
		 * string.
		 */
		$until = strtotime( Vars::post( 'driver-block-until' ) );
		$reason = Vars::post( 'driver-block-reason' );
		$now = time();
		$time = $until - time();

		if( $time > 0 )
		{
			$data = array(
				'driver_id' => $acc_id,
				'seconds' => $time,
				'reason' => $reason
			);
			disp_cmd( 0, $service_id, 'ban-taxi', $data, $err );
			if( $err ) {
				return $err;
			}
		}
	}
	else
	{
		$block_before = taxi_drivers::end_block_time( $acc_id );
		if( $block_before > time() )
		{
			$data = array(
				'driver_id' => $acc_id
			);
			disp_cmd( 0, $service_id, 'unban-taxi', $data, $err );
			if( $err ) return $err;
		}
	}
}

function delete_driver()
{
	$id = argv(1);
	$service_id = sid();
	if( !$id || !$service_id ) {
		warning( "delete_driver: missing driver id or service id" );
		return false;
	}

	$driver = new driver( $id, 'acc_id' );
	if( !$driver->acc_id() ) {
		warning( "delete_driver: no acc_id" );
		return false;
	}

	$acc = new taxi_account( $driver->acc_id(), 'service_id' );
	if( $service_id != $acc->service_id() ) {
		warning( "delete_driver: service id mismatch" );
		return false;
	}

	taxi::delete_taxi( $service_id, $id );
	taxi_accounts::delete( $driver->acc_id() );
}

function save_car()
{
	$service_id = sid();

	$id = Vars::post( 'car-id' );

	if( $id ) {
		$car = new car( $id );
	} else {
		$car = new car();
		$car->service_id( $service_id );
	}
	$car->name( Vars::post( 'car-name' ) );
	$car->class( vars::post( 'class' ) );
	$color = Vars::post( 'car-color' );
	if( $color ) $color = mb_ucfirst( $color );
	$car->color( $color );
	$car->plate( strtoupper( Vars::post( 'car-plate' ) ) );
	$car->body_type( Vars::post( 'car-body_type' ) );

	$gid = Vars::post( 'group-id' );
	if( !$gid ) {
		$group = new car_group();
		$group->service_id( $service_id );
		$group->name( 'Обычная' );
		$gid = $group->save();
	}
	$car->group_id( $gid );

	$driver_id = Vars::post( 'driver-id' );
	if( $id  )
	{
		$old_driver_id = taxi_drivers::get_by_car( $id );
		if( $old_driver_id && $old_driver_id != $driver_id )
		{
			$driver = new driver( $old_driver_id );
			$driver->car_id( null );
			$driver->save();
		}
	}

	if( Vars::post( 'year_made' ) !== null )
	{
		$fields = array( 'warrant_date', 'warrant_expires',
			'insurance_num', 'insurance_expires',
			'certificate_num', 'certificate_expires',
			'year_made', 'odometer' );
		foreach( $fields as $f ) {
			$car->$f( alt( Vars::post( $f ), null ) );
		}
	}

	$id = $car->save();
	if( $driver_id )
	{
		$driver = new driver( $driver_id );
		$driver->car_id( $id );
		$driver->save();
	}

	$files = Uploads::process_input( 'car-photo', 'images/cars', array(
		'.jpg', '.png', '.gif' )
	);

	if( !empty( $files ) ){
		$car->photo( $files[0] );
	}

	return intval( $car->save() );
}

function delete_car()
{
	$service_id = sid();
	$car_id = argv(1);

	$driver_id = taxi_drivers::get_by_car( $car_id );
	if( $driver_id ) {
		return "У автомобиля назначен водитель.";
	}
	taxi::delete_car( $service_id, $car_id );
}

function save_dispatcher()
{
	$service_id = sid();
	$acc_id = vars::post( 'id' );

	$name = vars::post( 'i-name' );
	$call_id = vars::post( 'call_id' );
	$pass = vars::post( 'password' );
	$loc_id = alt( vars::post( 'loc_id' ), null );

	if( !$acc_id )
	{
		$login = vars::post( 'login' );
		if( taxi_accounts::exists( 'dispatcher', $login ) ) {
			return "Имя пользователя &laquo;$login&raquo; уже занято.";
		}
		$acc_id = taxi_accounts::create( 'dispatcher', $login, $pass );
		$acc = new taxi_account( $acc_id );
		$acc->service_id( $service_id );
	}
	else
	{
		if( vars::post( 'set-password' ) ) {
			taxi_accounts::change_password( $acc_id, $pass );
		}
		$acc = new taxi_account( $acc_id );
	}

	$acc->call_id( $call_id );
	$acc->name( $name );

	$bd = vars::post( 'birth_date' );
	$acc->birth_date( alt( $bd, null ) );

	$files = Uploads::process_input( 'photo', 'content/dispatchers' );
	if( !empty( $files ) ) {
		$acc->photo( $files[0] );
	}

	$acc_id = $acc->save();

	if( !DB::exists( 'taxi_dispatchers', array( 'acc_id' => $acc_id ) ) ) {
		DB::insertRecord( 'taxi_dispatchers', array(
			'acc_id' => $acc_id,
			'loc_id' => $loc_id
		));
	}
	else {
		DB::updateRecord( 'taxi_dispatchers',
			array( 'loc_id' => $loc_id ),
			array( 'acc_id' => $acc_id )
		);
	}
}

function delete_dispatcher()
{
	$acc_id = argv(1);
	if( !$acc_id ) {
		return "Missing id";
	}

	taxi_accounts::delete( $acc_id );
}

function change_service_password()
{
	$old = Vars::post( 'current-password' );
	$new = Vars::post( 'new-password' );
	$new2 = Vars::post( 'new-password-confirm' );

	if( $new != $new2 ) {
		return "Две строки с новым паролем не совпали.";
	}

	$id = user::get_id();
	$login = user::get_login();
	$acc_id = taxi_accounts::check( 'admin', $login, $old );
	if( !$acc_id ) {
		return "Текущий пароль указан неверно.";
	}

	taxi_accounts::change_password( $acc_id, $new );
	return true;
}

function save_car_group()
{
	$service_id = sid();
	$id = alt( Vars::post( 'group-id' ), null );

	$g = new car_group( $id );
	$g->name( Vars::post( 'group-name' ) );
	$g->service_id( $service_id );
	$id = intval( $g->save() );

	$fares = alt( Vars::post( 'fare-id' ), array() );
	fares::set_car_group_fares( $id, $fares );
}

function delete_car_group()
{
	$id = argv(1);
	$service_id = sid();
	return taxi::delete_park( $service_id, $id );
}

function save_driver_group()
{
	$service_id = sid();
	$id = intval( Vars::post( 'group-id' ) );

	$g = new driver_group( $id );
	$g->name( Vars::post( 'group-name' ) );
	$g->service_id( $service_id );
	$id = $g->save();

	$Q = alt( vars::post( 'queues' ), array() );
	taxi_drivers::set_group_queues( $id, $Q );
}

function delete_driver_group()
{
	$id = argv(1);
	$service_id = sid();
	return driver_groups::delete_group( $id, $service_id );
}

function save_checkpoint()
{
	$service_id = sid();
	$name = Vars::post( 'name' );

	// Point coordinates
	$lat = Vars::post( 'a-latitude' );
	$lon = Vars::post( 'a-longitude' );

	// Queue coordinates, equal to the point coordinates by default.
	$plat = alt( Vars::post( 'b-latitude' ), $lat );
	$plon = alt( Vars::post( 'b-longitude' ), $lon );

	if( !$lat || !$lon ) {
		return "Не заданы координаты точки.";
	}
	if( !$name ) {
		return "Не указано имя";
	}

	$cpid = Vars::post( 'id' );
	$qid = vars::post( 'qid' );
	if( !$cpid )
	{
		$loc = new taxi_location();
		$loc->service_id( $service_id );

		$q = new taxi_queue();
		$q->service_id( $service_id );
	}
	else
	{
		$loc = new taxi_location( $cpid );
		$q = new taxi_queue( $qid );
	}

	$loc->latitude( $lat );
	$loc->longitude( $lon );
	$loc->name( $name );
	$loc->do_reports( '1' );
	$loc->contact_name( Vars::post( 'contact-name' ) );
	$loc->contact_phone( Vars::post( 'contact-phone' ) );
	$loc->address( point_addr( $lat, $lon ) );

	$q->latitude( $plat );
	$q->longitude( $plon );
	$q->addr( point_addr( $lat, $lon ) );
	$q->name( $name );
	$q->radius( 0 );

	$id = $loc->save();
	$q->loc_id( $id );
	$q->save();

	save_location_dispatch( $id );
	return $id;
}

function save_location()
{
	$service_id = sid();
	$id = intval( vars::post( 'id' ) );
	$name = vars::post( 'name' );
	if( !$name ) {
		return 'Missing name';
	}
	$lat = vars::post( 'a-latitude' );
	$lon = vars::post( 'a-longitude' );

	$K = array( 'place', 'street', 'house', 'building' );
	$addr = array();
	foreach( $K as $k ) {
		$addr[$k] = vars::post( "a-$k" );
	}

	$loc = new taxi_location( $id );
	$loc->name( vars::post( 'name' ) );
	$loc->service_id( $service_id );
	$loc->latitude( $lat );
	$loc->longitude( $lon );
	$loc->address( write_address( $addr ) );
	$loc->do_reports( vars::post( 'do_reports' ) ? '1' : '0' );
	$loc->contact_phone( vars::post( 'contact-phone' ) );
	$loc->contact_name( vars::post( 'contact-name' ) );
	$loc->comments( vars::post( 'comments' ) );
	$loc_id = $loc->save();

	save_location_dispatch( $loc_id );
}

function save_location_dispatch( $loc_id )
{
	for( $i = 0; ; $i++ )
	{
		$type = vars::post( "dispatch_type-$i" );
		if( $type === null ) break;
		if( $type == '' ) continue;

		$qid = vars::post( "dispatch_queue-$i" );
		$bid = vars::post( "dispatch_brig-$i" );
		$mode = vars::post( "dispatch_mode-$i" );
		$imp = vars::post( "dispatch_importance-$i" ) ? 1 : 0;

		$ref_id = null;
		if( $type == 'queue' ) {
			if( !$qid ) continue;
			$ref_id = $qid;
		}
		if( $type == 'brigade' ) {
			if( !$bid ) continue;
			$ref_id = $bid;
		}

		$rows[] = array(
			'loc_id' => $loc_id,
			'ref_type' => $type,
			'ref_id' => $ref_id,
			'mode' => $mode,
			'importance' => $imp,
			'order' => $i
		);
	}

	DB::exec( "START TRANSACTION" );
	DB::exec( "DELETE FROM taxi_location_dispatches
		WHERE loc_id = %d", $loc_id );
	if( !empty( $rows ) ) {
		DB::insertRecords( "taxi_location_dispatches", $rows );
	}
	DB::exec( "COMMIT" );
}

function delete_location()
{
	$service_id = sid();
	$loc_id = argv(1);
	/*
	 * If the location is a "checkpoint", delete the related queue.
	 */
	DB::exec( "DELETE FROM taxi_queues WHERE loc_id = %d", $loc_id );
	DB::exec( "UPDATE taxi_locations SET deleted = 1
		WHERE loc_id = %d", $loc_id );
}

function save_service_settings()
{
	$sid = sid();
	$settings = service_settings::$defaults;
	foreach( service_settings::$defaults as $k => $default ) {
		$v = vars::post( 's-'.$k );
		if( $v === null ) {
			$v = '0';
		}
		$settings[$k] = $v;
	}
	service_settings::save( $sid, $settings );
}

function save_fare()
{
	$id = Vars::post( 'id' );
	$service_id = sid();
	$name = Vars::post( 'name' );

	/*
	 * Order records will hold references for fares to save information
	 * about which fare was used for a particular order. If we just
	 * update the fare record, the information for older records will
	 * become wrong. That's why we don't update fares but create a new
	 * record and mark the previous one as deleted.
	 */
	// TODO: remove fare if there are no links to it.
	$f = new fare();
	$f->name( $name );
	$f->service_id( $service_id );

	// TODO: rethink city/town
	$f->location_type( 'city' );

	$params = array(
		'start_price',
		'minimal_price',
		'kilometer_price',
		'slow_hour_price'
	);

	// 157 extensions.
	if( Vars::post( 'special_price' ) !== null )
	{
		$params = array_merge( $params, array(
			'hour_price', 'day_price', 'special_price'
		));
	}

	foreach( $params as $k )
	{
		$v = intval( Vars::post( $k ) );
		if( $v < 0 ) $v = 0;
		$f->$k( $v );
	}

	$new_id = $f->save();

	if( $id ) {
		fares::swap_fare( $id, $new_id );
	}
}

function delete_fare()
{
	$service_id = sid();
	$fare_id = argv(1);

	return fares::delete_fare( $fare_id, $service_id );
}


function save_service_customer()
{
	$id = Vars::post( 'customer_id' );
	if( !$id ) return 'no customer';

	$c = new customer( $id );

	$F = array( 'name', 'firm', 'phone', 'phone1', 'phone2',
		'passport', 'tin_num', 'bank_account',
		'dl_num', 'dl_expires',
		'birth_date',
		'address1', 'address2',
		'discount' );

	foreach( $F as $f ) {
		$c->$f( alt( Vars::post( $f ), null ) );
	}

	$c->blacklist( Vars::post( 'blacklist' ) ? 1 : 0 );
	$c->is_valid( Vars::post( 'is_valid' ) ? 1 : 0 );
	$c->comments( alt( Vars::post( 'comments' ), '' ) );

	return $c->save();
}

function delete_order()
{
	$service_id = sid();
	$order_id = argv(1);

	return orders::delete_order( $service_id, $order_id );
}

function save_queue()
{
	$id = vars::post( 'id' );
	$q = new taxi_queue( $id );

	$q->name( vars::post( 'name' ) );
	$q->service_id( sid() );
	$q->order( intval( vars::post( 'order' ) ) );
	$q->min( intval( vars::post( 'min' ) ) );

	/*
	 * Address.
	 */
	$addr = write_address( array(
		'place' => vars::post( 'place' ),
		'street' => vars::post( 'street' ),
		'house' => vars::post( 'house' ),
		'building' => vars::post( 'building' )
	));
	$q->addr( $addr );

	/*
	 * Coordinates and radius.
	 */
	$lat = vars::post( 'latitude' );
	$lon = vars::post( 'longitude' );
	if( !$lat || !$lon ) {
		$coords = addr_point( $addr );
		if( $coords ) {
			list( $lat, $lon ) = $coords;
		}
	}
	$q->latitude( $lat );
	$q->longitude( $lon );
	$q->radius( intval( vars::post( 'radius' ) ) );

	/*
	 * If this is an upstream queue, assign downstream queues.
	 */
	if( vars::post( 'upstream' ) )
	{
		$q->upstream( '1' );
		$q->mode( vars::post( 'mode' ) );
		$id = $q->save();
		DB::exec( "START TRANSACTION" );
		DB::exec( "UPDATE taxi_queues SET parent_id = NULL
			WHERE parent_id = %d", $id );
		DB::updateRecords( 'taxi_queues', array( 'parent_id' => null ),
			array( 'parent_id' => $id ) );
		DB::updateRecords( 'taxi_queues', array( 'parent_id' => $id ),
			array( 'queue_id' => vars::post( 'sub_queues' ) ) );
		DB::exec( "COMMIT" );
	}
	else
	{
		/*
		 * Parent queue and priority.
		 */
		$q->upstream( '0' );
		$q->parent_id( alt( vars::post( 'parent_id' ), null ) );
		if( $q->parent_id() )
		{
			$priority = vars::post( 'priority' );
			if( !taxi_queues::allocate_priority( $q->parent_id(), $priority, $q->id() ) ) {
				$name = DB::getValue( "SELECT name FROM taxi_queues
					WHERE queue_id = %d", $q->parent_id() );
				return 'Группа «'.$name.'» заполнена';
			}
			$q->priority( $priority );
		}
	}

	/*
	 * Driver groups.
	 */
	$id = $q->save();
	DB::exec( "START TRANSACTION" );
	DB::exec( "DELETE FROM taxi_driver_group_queues
		WHERE queue_id = %d", $q->id() );
	$groups = alt( vars::post( 'driver_groups' ), array() );
	foreach( $groups as $gid ) {
		DB::insertRecord( 'taxi_driver_group_queues', array(
			'queue_id' => $q->id(),
			'group_id' => $gid
		));
	}
	DB::exec( "COMMIT" );
}

function delete_queue()
{
	$sid = sid();
	$qid = argv(1);

	$r = DB::getRecord( "SELECT service_id, loc_id FROM taxi_queues
		WHERE queue_id = %d", $qid );
	if( !$r ) {
		return 'Not found';
	}
	if( $r['service_id'] != $sid ) {
		warning( "Service mismatch" );
		return 'Not found';
	}
	if( $r['loc_id'] ) {
		return 'Can\'t delete a checkpoint queue.';
	}
	DB::exec( "DELETE FROM taxi_queues WHERE queue_id = %d", $qid );
}

function save_qaddr()
{
	$sid = sid();
	$qid = vars::post( 'qid' );
	$range_id = vars::post( 'id' );

	if( !$qid ) {
		return 'Missing queue_id';
	}

	$range = new qaddr_range( $range_id );
	$range->queue_id( $qid );
	$range->city( vars::post( 'city' ) );
	$range->street( vars::post( 'street' ) );

	$min = intval( vars::post( 'min_house' ) );
	$max = intval( vars::post( 'max_house' ) );
	if( !$range->city() || !$range->street() || !$min || !$max ) {
		return 'Missing address value';
	}

	if( $max < $min ) {
		$tmp = $max;
		$max = $min;
		$min = $max;
	}

	$parity = vars::post( 'parity' );
	if( $parity == 'even' ) {
		if( $min % 2 != 0 ) $min++;
		if( $max % 2 != 0 ) $max--;

	}
	else if( $parity == 'odd' ) {
		if( $min % 2 == 0 ) $min++;
		if( $max % 2 == 0 ) $max--;
	}

	if( $max < $min ) {
		return "Invalid range";
	}

	$range->min_house( $min );
	$range->max_house( $max );
	$range->parity( $parity );

	$ranges = taxi_queues::get_overlapping_ranges( $sid, $range );
	foreach( $ranges as $r )
	{
		/*
		 * If we overlap a range of another queue, return an error.
		 */
		if( $r['queue_id'] != $range->queue_id() ) {
			$min = max( $min, $r['min_house'] );
			$max = min( $max, $r['max_house'] );
			return sprintf( "Дома %d—%d уже входят в очередь «%s».",
				$min, $max, $r['name'] );
		}
		/*
		 * If we overlap the same queue, don't bother.
		 */
	}
	return $range->save();
}

function delete_qaddr()
{
	$sid = sid();
	$range_id = argv(1);
	taxi_queues::delete_qaddr_range( $sid, $range_id );
}

function delete_driver_type()
{
	$id = argv(1);
	return DB::deleteRecord( 'taxi_driver_types', array(
		'service_id' => sid(),
		'type_id' => $id
	));
}

function save_driver_type()
{
	$sid = sid();
	$id = vars::post( 'id' );
	$name = vars::post( 'name' );
	if( $id ) {
		return DB::updateRecord( 'taxi_driver_types',
			array( 'name' => $name ),
			array( 'service_id' => $sid, 'type_id' => $id )
		);
	}
	else {
		return DB::insertRecord( 'taxi_driver_types',
			array( 'service_id' => $sid, 'name' => $name )
		);
	}
}

?>
