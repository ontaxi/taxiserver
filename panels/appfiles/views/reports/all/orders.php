<?php
lib( 'russian' );
set_page_title( 'Отчёт по заказам' );

$columns = array(
	array( 'order_id', 'Номер', 'o.order_id' ),
	array( 'type', 'Источник', 'dispatcher.type' ),
	array( 'date_created', 'Дата создания', 'UNIX_TIMESTAMP(o.time_created) AS date_created' ),
	array( 'postpone_until', 'Отложен до', 'UNIX_TIMESTAMP(o.exp_arrival_time) AS postpone_until' ),
	array( 'time_created', 'Время создания', 'UNIX_TIMESTAMP(o.time_created) AS time_created' ),
	array( 'time_arrived', 'Время прибытия', 'UNIX_TIMESTAMP(o.time_arrived) AS time_arrived' ),
	array( 'time_started', 'Время начала', 'UNIX_TIMESTAMP(o.time_started) AS time_started' ),
	array( 'time_finished', 'Время завершения', 'UNIX_TIMESTAMP(o.time_finished) AS time_finished' ),
	array( 'duration', 'Время поездки по таксометру', 's.total_time AS duration' ),
	array( 'src_addr', 'Адрес подачи', 'o.src_addr' ),
	array( 'dest_addr', 'Адрес назначения', 'o.dest_addr' ),
	array( 'srcloc', 'Объект (КТ)', 'srcloc.name AS srcloc' ),
	array( 'comments', 'Комментарии', 'o.comments' ),
	array( 'arrival_distance', 'Расстояние до клиента', 'o.arrival_distance' ),
	//array( 'path_length', 'Пробег по GPS', 'ROUND(SUM(s.total_distance / 1000),1) AS path_length' ),
	array( 'status', 'Состояние', 'o.status' ),
	array( 'cancel_reason', 'Причина отмены', 'o.cancel_reason' ),
	array( 'price', 'Цена', 'o.price' ),
	array( 'fare_name', 'Название тарифа', 'f.name AS fare_name' ),
	array( 'start_price', 'Цена посадки', 'f.start_price' ),
	array( 'mininal_price', 'Минимальная цена', 'f.minimal_price' ),
	array( 'kilometer_price', 'Цена за километр', 'f.kilometer_price' ),
	array( 'slow_hour_price', 'Цена за час простоя', 'f.slow_hour_price' ),
	array( 'driver', 'Водитель', 'driver.call_id AS driver' ),
	array( 'car', 'Автомобиль', 'CONCAT(car.name, \', \', car.plate) AS car' ),
	array( 'dispatcher', 'Диспетчер', 'dispatcher.call_id AS dispatcher' ),
	array( 'customer', 'Клиент', "CONCAT (customer.phone, ' (', customer.name, ')') AS customer" ),
	array( 'coords', 'Координаты', 'o.latitude, o.longitude' ),
	array( 'options', 'Опции поиска', 'o.opt_vip, o.opt_terminal, o.opt_car_class' ),
	array( 'total_distance', 'Маршрут', 'SUM(stats.total_distance) AS total_distance' )
);

main( $columns );

//--


function main( $columns )
{
	$tableinfo = get_table( $columns );

	if( $tableinfo && vars::get( 'act' ) == 'download' ) {
		download_spreadsheet( $tableinfo[0]->get_rows( true ) );
	}
	else {
		show_page( $columns, $tableinfo );
	}
}

function get_table( $columns )
{
	$select = array();
	$header = array();
	foreach( $columns as $a )
	{
		$name = $a[0];
		if( vars::get( 'col-'.$name ) )
		{
			$header[$name] = $a[1];
			$select[] = $a[2];
		}
	}

	if( empty( $select ) ) {
		return null;
	}

	$table = new Table( $header );

	$range = get_time();
	$service_id = sid();
	$dispatcher_id = intval( vars::get( 'dispatcher-id' ) );
	$driver_id = intval( vars::get( 'driver-id' ) );
	$status = vars::get( 'status' );
	$phone = vars::get( 'customer-phone' );

	$page = intval( vars::get( 'page' ) );
	if( $page < 1 ) $page = 1;
	$count = MAX_WEB_ROWS;
	$skip = ($page - 1) * $count;

	$t1 = $range[0];
	$t2 = $range[1];
	$where = array(
		"o.time_created BETWEEN FROM_UNIXTIME($t1) AND FROM_UNIXTIME($t2)",
		"o.service_id = $service_id"
	);
	$where[] = 'o.deleted = 0';
	if( $dispatcher_id ) {
		$where[] = "o.owner_id = $dispatcher_id";
	}
	if( $driver_id ) {
		$where[] = "driver.acc_id = $driver_id";
	}
	if( $status ) {
		$where[] = "o.status = '$status'";
	}
	if( $phone ) {
		$phone = preg_replace( '/[^+\d]/', '', $phone );
		$where[] = "customer.phone = '$phone'";
	}

	$tbl = "taxi_orders o
	LEFT JOIN taxi_accounts dispatcher
		ON dispatcher.acc_id = o.owner_id
	LEFT JOIN taxi_accounts driver
		ON driver.acc_id = o.taxi_id
	LEFT JOIN taxi_cars car
		ON o.car_id = car.car_id
	LEFT JOIN taxi_customers customer
		ON o.customer_id = customer.customer_id
	LEFT JOIN taxi_order_stats s USING (order_id)
	LEFT JOIN taxi_fares f USING (fare_id)
	LEFT JOIN taxi_locations srcloc
		ON o.src_loc_id = srcloc.loc_id
	LEFT JOIN taxi_order_stats stats
		ON stats.order_id = o.order_id";

	$condition = implode( ' AND ', $where );

	$orders = DB::getRecords( "
		SELECT SQL_CALC_FOUND_ROWS
			o.order_id AS _id,
			o.status AS _status,
			".implode( ', ', $select ). "
		FROM $tbl
		WHERE $condition
		GROUP BY o.order_id
		LIMIT $skip, $count" );
	$N = DB::getValue( "SELECT FOUND_ROWS()" );

	$times = array( 'time_created', 'time_arrived', 'time_started', 'time_finished' );
	$distances = array( 'arrival_distance', 'total_distance' );

	foreach( $orders as $i => $order )
	{
		foreach( $times as $k ) {
			if( isset( $order[$k] ) ) {
				$order[$k] = date( 'H:i', $order[$k] );
			}
		}

		if( isset( $order['date_created'] ) ) {
			$order['date_created'] = date( 'd.m.Y', $order['date_created'] );
		}

		foreach( $distances as $k ) {
			if( isset( $order[$k] ) ) {
				$km = $order[$k] / 1000;
				$order[$k] = $km ? str_replace( '.', ',', sprintf( '%.1f км', $km )) : '';
			}
		}

		if( isset( $order['total_distance'] ) && $order['_status'] == 'finished' ) {
			$url = url( 'view all order-positions' )."?order_id=$order[_id]";
			$order['total_distance'] = sprintf( '<a href="%s">%s</a>',
				$url, $order['total_distance'] );
		}

		if( isset( $order['latitude'] ) ) {
			$order['coords'] = str_replace( '.', ',', sprintf( '%.7f; %.7f', $order['latitude'], $order['longitude'] ) );
			unset( $order['latitude'] );
			unset( $order['longitude'] );
		}

		if( array_key_exists( 'opt_vip', $order ) ) {
			$opts = array();
			if( $order['opt_vip'] == '1' ) $opts[] = 'V.I.P.';
			if( $order['opt_terminal'] == '1' ) $opts[] = 'терм.';
			if( $order['opt_car_class'] ) $opts[] = $order['opt_car_class'];
			unset( $order['opt_vip'] );
			unset( $order['opt_terminal'] );
			unset( $order['opt_car_class'] );
			$order['options'] = implode( ', ', $opts );
		}

		if( isset( $order['status'] ) ) {
			$order['status'] = orders::get_status_name( $order['status'] );
		}

		unset( $order['_id'] );
		unset( $order['_status'] );

		$table->add_row( $order );
	}
	return array( $table, $N );
}


//--


function show_page( $columns, $tableinfo )
{
	?><h1><?= page_title() ?></h1><?php
	show_form( $columns );
	if( $tableinfo ) {
		show_pager( $tableinfo[1] );
		show_table( $columns, $tableinfo[0] );
	}
}

function show_form( $columns )
{
	?>
	<form>
		<?= columns_selector( $columns ) ?>
		<?= filter_controls( $columns ) ?>
		<button type="submit" name="act" value="show">Показать</button>
		<button type="submit" name="act" value="download">Выгрузить страницу</button>
	</form>
	<?php
}

function columns_selector( $columns )
{
	$checked_cols = array( 'id', 'date', 'time_created', 'src_addr', 'comments', 'status', 'driver', 'dispatcher' );
	?>
	<fieldset>
		<legend>Столбцы</legend>
		<div style="column-count: 3; -moz-column-count: 3; -webkit-column-count: 3;">
		<?php
		foreach( $columns as $arr )
		{
			$name = $arr[0];
			$title = $arr[1];
			if( vars::get( 'act' ) ) {
				$checked = vars::get( 'col-'.$name ) ? ' checked' : '';
			} else {
				$checked = in_array( $name, $checked_cols ) ? ' checked' : '';
			}
			?>
			<div>
				<input type="checkbox"<?= $checked ?>
					name="col-<?= $name ?>" value="1"
					id="cb-<?= $name ?>">
				<label for="cb-<?= $name ?>"><?= $title ?></label>
			</div>
			<?php
		}?>
		</div>
	</fieldset>
	<?php
}

function filter_controls( $columns )
{
	$range = get_time();
	$service_id = sid();
	$dispatcher_id = intval( vars::get( 'dispatcher-id' ) );
	$driver_id = intval( vars::get( 'driver-id' ) );
	$status = vars::get( 'status' );

	$dispatchers = array_column( DB::getRecords(
		"SELECT acc_id, call_id FROM taxi_accounts
		WHERE type = 'dispatcher'
		AND service_id = %d
		AND deleted = 0",
		$service_id
	), 'call_id', 'acc_id' );

	$drivers = taxi::drivers_kv( $service_id );
	$statuses = array(
		'finished' => 'Завершён',
		'started' => 'Выполняется',
		'cancelled' => 'Отменён'
	);
	$dispatcher_id = intval( vars::get( 'dispatcher-id' ) );
	$driver_id = intval( vars::get( 'driver-id' ) );
	$status = vars::get( 'status' );
	if( !in_array( $status, array_keys( $statuses ) ) ) {
		$status = null;
	}
	$phone = vars::get( 'customer-phone' );
	?>
	<fieldset>
		<legend>Фильтр</legend>
		<div>
			<?= time_selector( $range ) ?>
		</div>
		<div>
			<label>Диспетчер</label>
			<?= HTMLSnippets::select( 'dispatcher-id', $dispatchers, $dispatcher_id ) ?>
			<label>Водитель</label>
			<?= HTMLSnippets::select( 'driver-id', $drivers, $driver_id ) ?>
			<label>Состояние</label>
			<?= HTMLSnippets::select( 'status', $statuses, $status ) ?>
			<label>Номер телефона клиента</label>
			<input name="customer-phone" value="<?= $phone ?>">
		</div>
	</fieldset>
	<?php
}

function show_pager( $total_rows )
{
	$page = intval( vars::get( 'page' ) );
	if( $page < 1 ) $page = 1;
	$max_page = ceil( $total_rows / MAX_WEB_ROWS );
	echo rus_number_phrase( $total_rows,
			'%d заказ', '%d заказа', '%d заказов' );
	?>
	<style>
	.pager {
		text-align: center;
	}
	.pager span {
		display: inline-block;
		border: 1px solid #eee;
		width: 1em;
		height: 1em;
		padding: 0.5em;
		background: #ddd;
	}
	.pager a span {
		background: white;
	}
	</style>
	<div class="pager">
		стр.
	<?php
	for( $p = 1; $p <= $max_page; $p++ )
	{
		if( $p == $page ) {
			?><span><?= $p ?></span><?php
		}
		else {
			$url = CURRENT_URL;
			if( preg_match( '/page=(\d+)/', $url, $m ) ) {
				$url = str_replace( "&page=$m[1]", "&page=$p", $url );
			} else {
				$url .= "&page=$p";
			}
			?><a href="<?= htmlspecialchars( $url ) ?>"><span><?= $p ?></span></a><?php
		}
	}
	?>
	</div>
	<?php
}

function show_table( $columns, $table )
{
	if( vars::get( 'col-price' ) ) {
		$sum = array_sum( array_column( $table->get_rows(), 'price' ) );
		$price = number_format( $sum, 0, ',', ' ' ). ' руб.';
	} else $price = '';
	?><p style="text-align: center;"><?php
		if( $price ) {
			echo ', ', $price;
		}
	?></p><?php
	echo $table;
}


?>
