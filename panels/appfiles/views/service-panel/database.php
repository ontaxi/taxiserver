<?php _header(); ?>

<?php
$service_id = sid();

function tocsv( $value )
{
	$value = preg_replace( '/\r?\n/', '; ', $value );
	$value = iconv( 'utf-8', 'cp1251', $value );
	return $value;
}

function get_dump_file( $query, $header )
{
	$path = tempnam( sys_get_temp_dir(), '157-dump-' );
	$s = new MySQLStream( DB::exec( $query ) );
	$f = fopen( $path, 'w' );
	fputcsv( $f, array_map( 'tocsv', $header ) );
	while( $r = $s->getRecord() ) {
		fputcsv( $f, array_map( 'tocsv', $r ) );
	}
	fclose( $f );
	return $path;
}

function dump_dispatchers( $service_id )
{
	$query = "SELECT
		acc_id AS dispatcher_id,
		login,
		name,
		photo,
		birth_date
		FROM taxi_accounts
		WHERE service_id = $service_id
		AND deleted = 0";

	$header = array( 'id', 'login', 'name', 'photo', 'birth_date' );
	return get_dump_file( $query, $header );
}

function dump_dispatchers_orders( $service_id )
{
	$query = "SELECT
		o.order_id
		o.owner_id AS dispatcher_id,
		FROM taxi_orders o
		JOIN taxi_accounts d
			ON d.service_id = o.service_id
			AND d.acc_id = o.owner_id
			AND d.type = 'dispatcher'
		WHERE o.service_id = $service_id
		AND d.deleted = 0
		AND o.deleted = 0";

	$header = array( 'dispatcher_id', 'order_id' );
	return get_dump_file( $query, $header );
}

function dump_dispatchers_finished_orders( $service_id )
{
	$query = "SELECT
		o.order_id,
		o.owner_id AS dispatcher_id
		FROM taxi_orders o
		JOIN taxi_accounts d
			ON d.service_id = o.service_id
			AND d.acc_id = o.owner_id
			AND d.type = 'dispatcher'
		WHERE o.service_id = $service_id
		AND o.`status` = 'finished'
		AND d.deleted = 0
		AND o.deleted = 0";

	$header = array( 'dispatcher_id', 'order_id' );
	return get_dump_file( $query, $header );
}

function dump_orders( $service_id )
{
	$query = "
	SELECT
		order_id,
		`status`,
		cancel_reason,
		IF( owner.type = 'driver',
			'Водительский',
			CASE o.`type`
				WHEN 'vip' THEN 'VIP'
				ELSE 'Городской'
			END) as type,
		opt_car_class AS car_class,
		o.owner_id AS dispatcher_id,
		customer_id,
		taxi_id AS driver_id,
		car_id,
		checkpoint_id,
		src_addr AS address,
		comments,
		o.time_created,
		UNIX_TIMESTAMP(o.exp_arrival_time) AS postpone_until,
		NULL AS departure_time,
		NULL AS departure_place,
		time_finished,
		NULL AS place_finished,
		NULL AS odometer_begin,
		NULL AS odometer_end,
		NULL AS estimated_duration,
		NULL AS estimated_path_length,
		s.total_time AS duration,
		ROUND(SUM(s.total_distance / 1000),1) path_length,
		f.name AS fare_name,
		f.start_price,
		f.minimal_price,
		f.kilometer_price,
		f.slow_hour_price
		price,
		NULL AS additional_price
		FROM taxi_orders o
		LEFT JOIN taxi_order_stats s USING (order_id)
		LEFT JOIN taxi_fares f USING (fare_id)
		LEFT JOIN taxi_accounts owner
			ON owner.acc_id = o.owner_id
		WHERE o.service_id = $service_id
		AND o.deleted = 0
		GROUP BY order_id";
	$header = array( 'id', 'Состояние', 'Причина отмены', 'Тип',
		'Тип кузова', 'dispatcher_id', 'customer_id', 'driver_id',
		'car_id', 'checkpoint_id', 'Адрес', 'Комментарии',
		'Время поступления', 'Отложен до',
		'Время выезда', 'Место выезда',
		'Время завершения', 'Место завершения',
		'Одометр_начало', 'Одометр_конец',
		'Расчётное время', 'Расчётный пробег',
		'Фактическое время', 'Пробег по GPS',
		'Название тарифа', 'Цена посадки', 'Минимальная цена',
		'Цена за километр', 'Цена за час простоя', 'Цена поездки',
		'Цена за дополнительные услуги' );
	return get_dump_file( $query, $header );
}

function dump_cars( $service_id )
{
	$query = "SELECT
		car_id,
		g.name AS group_name,
		body_type,
		c.name,
		color,
		plate,
		warrant_date,
		warrant_expires,
		insurance_num,
		insurance_expires,
		certificate_num,
		certificate_expires,
		year_made,
		class,
		odometer
	FROM taxi_cars c
	JOIN taxi_car_groups g USING (group_id)
	WHERE c.deleted = 0
	AND c.service_id = $service_id";

	$header = array( 'id', 'Группа', 'Тип кузова',
		'Марка', 'Цвет', 'Госномер',
		'Техосмотр',
		'Техосмотр до',
		'Страховка',
		'Страховка до',
		'Техпаспорт',
		'Техпаспорт до',
		'Год выпуска',
		'Класс',
		'Одометр' );
	return get_dump_file( $query, $header );
}

function dump_cars_orders( $service_id )
{
	$q = "SELECT car_id, order_id
		FROM taxi_orders o
		JOIN taxi_cars c USING (service_id, car_id)
		WHERE service_id = $service_id
		AND c.deleted = 0
		AND o.deleted = 0";

	$header = array( 'car_id', 'order_id' );
	return get_dump_file( $q, $header );
}

function dump_customers( $service_id )
{
	$q = "SELECT
		c.customer_id,
		IF( c.name <> '', c.name, c.firm ) AS name_or_firm,
		c.is_valid,
		c.phone,
		c.phone1,
		c.phone2,
		IF( c.passport <> '', c.passport, c.tin_num ) AS passport_or_tin,
		c.bank_account,
		c.dl_num,
		c.dl_expires,
		c.birth_date,
		c.address1,
		c.address2,
		(SELECT src_addr
			FROM taxi_orders o
			WHERE o.customer_id = c.customer_id
			AND o.deleted = 0
			ORDER BY o.time_created DESC
			LIMIT 1
		) AS last_order_address,
		c.discount,
		c.comments
	FROM taxi_customers c
	WHERE service_id = $service_id";

	$header = array(
		'id',
		'ФИО/Юр. лицо',
		'Проверенный',
		'Телефон 1',
		'Телефон 2',
		'Телефон 3',
		'Паспорт / УНН',
		'Расчётный счёт',
		'Водительское удостоверение - номер',
		'Водительское удостоверение - до',
		'День рождения',
		'Адрес 1 (прописка или юр.)',
		'Адрес 2 (прож. или почтовый)',
		'Адрес последнего заказа',
		'Скидка',
		'Комментарий'
	);

	return get_dump_file( $q, $header );
}

function dump_customers_orders( $service_id )
{
	$q = "SELECT customer_id, order_id
	FROM taxi_orders
	WHERE service_id = $service_id
	AND deleted = 0
	AND customer_id IS NOT NULL";

	$header = array( 'customer_id', 'order_id' );

	return get_dump_file( $q, $header );
}

function dump_customers_finished_orders( $service_id )
{
	$q = "SELECT customer_id, order_id
	FROM taxi_orders
	WHERE service_id = $service_id
	AND deleted = 0
	AND customer_id IS NOT NULL
	AND `status` = 'finished'";

	$header = array( 'customer_id', 'order_id' );

	return get_dump_file( $q, $header );
}

function dump_checkpoints( $service_id )
{
	$rows = DB::getRecords("
	SELECT cp.checkpoint_id,
		cp.`order`,
		loc.name,
		loc.contact_name,
		loc.latitude,
		loc.longitude,
		queue.latitude AS parking_latitude,
		queue.longitude AS parking_longitude,
		cp.comments
	FROM taxi_checkpoints cp
	LEFT JOIN taxi_locations loc
		ON loc.loc_id = cp.client_loc_id
	LEFT JOIN taxi_queues USING (queue_id)
	WHERE cp.deleted = 0
	AND cp.service_id = $service_id" );

	$t = array();

	foreach( $rows as $i => $row )
	{
		$a = point_addr( $row['latitude'], $row['longitude'] );
		$t[] = array(
			'id' => $row['checkpoint_id'],
			'order' => $row['order'],
			'name' => $row['name'],
			'address' => $a->format(),
			'contact_name' => $row['contact_name'],
			'coords' => "$row[latitude], $row[longitude]",
			'queue_coords' => "$row[parking_latitude], $row[parking_longitude]",
			'comments' => $row['comments']
		);
	}

	$header = array( 'id',
		'Порядковый номер',
		'Название',
		'Адрес',
		'Контактное лицо',
		'Координаты',
		'Координаты очереди',
		'Комментарии' );

	$path = tempnam( sys_get_temp_dir(), '157-dump-' );
	$f = fopen( $path, 'w' );
	fputcsv( $f, array_map( 'tocsv', $header ) );
	foreach( $t as $r ) {
		fputcsv( $f, array_map( 'tocsv', $r ) );
	}
	fclose( $f );
	return $path;
}

function dump_checkpoints_orders( $service_id )
{
	$q = "SELECT checkpoint_id, order_id
	FROM taxi_orders o
	JOIN taxi_checkpoints cp USING (service_id, checkpoint_id)
	WHERE service_id = $service_id
	AND o.deleted = 0
	AND cp.deleted = 0
	";
	$header = array( 'checkpoint_id', 'order_id' );
	return get_dump_file( $q, $header );
}

function dump_checkpoints_finished_orders( $service_id )
{
	$q = "SELECT checkpoint_id, order_id
	FROM taxi_orders o
	JOIN taxi_checkpoints cp USING (service_id, checkpoint_id)
	WHERE service_id = $service_id
	AND cp.deleted = 0
	AND o.deleted = 0
	AND `status` = 'finished'";
	$header = array( 'checkpoint_id', 'order_id' );
	return get_dump_file( $q, $header );
}

function dump_sessions( $service_id )
{
	$q = "SELECT
		id,
		driver_id,
		car_id,
		begin_dispatcher,
		end_dispatcher,
		time_started,
		begin_address,
		CONCAT( begin_latitude, ', ', begin_longitude ) AS begin_coords,
		odometer_begin,
		time_finished,
		end_address,
		CONCAT( end_latitude, ', ', end_longitude ) AS end_coords,
		odometer_end,
		ROUND( gps_distance / 1000, 1 ) AS path
		FROM taxi_works";
	$header = array( 'Номер смены',
		'Водитель',
		'Авто',
		'Диспетчер начала смены',
		'Диспетчер конца смены',
		'Время начала',
		'Место начала',
		'Координаты начала',
		'Одометр начала',
		'Время конца',
		'Место конца',
		'Координаты конца',
		'Одометр конца',
		'Пробег по GPS, км' );

	return get_dump_file( $q, $header );
}

function dump_sessions_all_orders( $service_id )
{
	$q = "SELECT work_id, order_id
	FROM taxi_works w
	JOIN taxi_drivers d USING (driver_id)
	JOIN taxi_work_orders wo ON w.id = wo.work_id
	JOIN taxi_orders o USING (order_id)
	WHERE o.service_id = $service_id
	AND o.deleted = 0
	AND d.deleted = 0";

	$header = array( 'session_id', 'order_id' );
	return get_dump_file( $q, $header );
}

function dump_sessions_accepted_orders( $service_id )
{
	$q = "SELECT work_id, order_id
	FROM taxi_works w
	JOIN taxi_drivers d USING (driver_id)
	JOIN taxi_work_orders wo ON w.id = wo.work_id
	JOIN taxi_orders o USING (order_id)
	WHERE o.service_id = $service_id
	AND o.deleted = 0
	AND d.deleted = 0
	AND o.taxi_id = d.driver_id";

	$header = array( 'session_id', 'order_id' );
	return get_dump_file( $q, $header );
}

function dump_sessions_finished_orders( $service_id )
{
	$q = "SELECT work_id, order_id
	FROM taxi_works w
	JOIN taxi_drivers d USING (driver_id)
	JOIN taxi_work_orders wo ON w.id = wo.work_id
	JOIN taxi_orders o USING (order_id)
	WHERE o.service_id = $service_id
	AND o.deleted = 0
	AND d.deleted = 0
	AND o.taxi_id = d.driver_id
	AND o.`status` = 'finished'";

	$header = array( 'session_id', 'order_id' );
	return get_dump_file( $q, $header );
}

function dump_sessions_positions( $service_id )
{
	$q = "SELECT
		w.id AS session_id,
		p.time_added,
		CONCAT( p.latitude, ', ', p.longitude ) AS coords
	FROM taxi_works w
	JOIN taxi_log_positions p
	ON p.driver_id = w.driver_id
	WHERE
	p.driver_i = w.driver_id
	AND p.t > w.time_started
	AND p.t < w.time_finished";

	$header = array( 'session_id', 't', 'GPS' );

	return get_dump_file( $q, $header );
}

function dump_fares( $service_id )
{
	$q = "SELECT
		fare_id,
		name,
		special_price,
		start_price,
		minimal_price,
		kilometer_price,
		slow_hour_price,
		hour_price,
		day_price
	FROM taxi_fares
	WHERE service_id = $service_id
	AND deleted = 0";

	$header = array(
		'id',
		'Название',
		'Специальная цена',
		'Цена посадки',
		'Цена абонирования',
		'Цена за километр',
		'Цена за час простоя',
		'Цена за час поездки',
		'Цена за сутки'
	);

	return get_dump_file( $q, $header );
}

function dump_drivers( $service_id )
{
	$q = "SELECT
		driver_id,
		g.name AS group_name,
		login,
		is_fake,
		block_until,
		d.name,
		call_id,
		phone,
		personal_phone,
		firm,
		photo,
		dl_num,
		dl_expires,
		health_cert,
		health_cert_expires,
		taxi_cert,
		taxi_cert_expires,
		birth_date
	FROM taxi_drivers d
	JOIN taxi_driver_groups g USING (group_id)
	WHERE deleted = 0
	AND d.service_id = $service_id";

	$header = array(
		'id',
		'Группа',
		'Системное имя',
		'Имитация',
		'Блокировка до',
		'Имя',
		'Позывной',
		'Рабочий телефон',
		'Личный телефон',
		'Юридическое лицо',
		'Фотография',
		'Вод. удост.',
		'Вод. удост. до',
		'Медсправка',
		'Медсправка до',
		'Свид. такси',
		'Свид. такси до',
		'День рождения'
	);

	return get_dump_file( $q, $header );
}

function dump_drivers_orders( $service_id )
{
	$q = "SELECT driver_id, order_id
	FROM taxi_orders o
	JOIN taxi_drivers d
	ON o.taxi_id = d.driver_id
	AND o.service_id = d.service_id
	WHERE d.deleted = 0
	AND o.deleted = 0
	AND d.service_id = $service_id";

	$header = array( 'driver_id', 'order_id' );
	return get_dump_file( $q, $header );
}

function dump_drivers_finished_orders( $service_id )
{
	$q = "SELECT driver_id, order_id
	FROM taxi_orders o
	JOIN taxi_drivers d
	ON o.taxi_id = d.driver_id
	AND o.service_id = d.service_id
	WHERE d.deleted = 0
	AND o.deleted = 0
	AND d.service_id = $service_id
	AND status = 'finished'";

	$header = array( 'driver_id', 'order_id' );
	return get_dump_file( $q, $header );
}


$dumps = array(
	'dispatchers' => 'Диспетчеры',
	'dispatchers-orders' => 'Диспетчеры &#8596 заказы',
	'dispatchers-finished-orders' => 'Диспетчеры &#8596 завершённые заказы',
	'orders' => 'Заказы',
	'cars' => 'Автомобили',
	'cars-orders' => 'Автомобили &#8596 заказы',
	'drivers' => 'Водители',
	'drivers-orders' => 'Водители &#8596 заказы',
	'drivers-finished-orders' => 'Водители &#8596 завершённые заказы',
	'customers' => 'Клиенты',
	'customers-orders' => 'Клиенты &#8596 заказы',
	'customers-finished-orders' => 'Клиенты &#8596 завершённые заказы',
	'checkpoints' => 'Контрольные точки',
	'checkpoints-orders' => 'Контрольные точки &#8596 заказы',
	'checkpoints-finished-orders' => 'Контрольные точки &#8596 завершённые заказы',
	'sessions' => '&laquo;Смены&raquo;',
	'sessions-all-orders' => '&laquo;Смены&raquo; &#8596 полученные заказы',
	'sessions-accepted-orders' => '&laquo;Смены&raquo; &#8596 принятые заказы',
	'sessions-finished-orders' => '&laquo;Смены&raquo; &#8596 завершённые заказы',
	'sessions-positions' => '&laquo;Смены&raquo; &#8596 координаты перемешения',
	'fares' => 'Тарифы'
);

$D = Vars::get( 'dumps' );
if( !empty( $D ) )
{
	set_time_limit( 10*60 );

	$tmps = array();

	$zpath = tempnam( sys_get_temp_dir(), 'zip' );

	$z = new ZipArchive();
	$z->open( $zpath, ZipArchive::CREATE );
	foreach( $D as $dump )
	{
		$fname = "$dump.csv";

		$f = 'dump_'.str_replace( '-', '_', $dump );
		$path = $f( $service_id );
		$z->addFile( $path, $fname );

		$tmps[] = $path;
	}
	$z->close();

	ob_destroy();
	$f = fopen( $zpath, 'rb' );
	announce_file( time().'.zip', filesize( $zpath ) );
	fpassthru( $f );
	fclose( $f );

	foreach( $tmps as $path ) {
		unlink( $path );
	}
	unlink( $zpath );

	exit;
}
?>

<h1>База данных</h1>
<form action="<?= url( argv(0) ) ?>">
<div>
<?php foreach( $dumps as $name => $title ) {
	echo '<div>',
		HTMLSnippets::labelled_checkbox( $title, 'dumps[]', $name ),
		'</div>';
} ?>
</div>
<button type="submit">Выгрузить</button>
<small>Выгрузка некоторых таблиц займёт несколько минут.</small>
</form>


<?php _footer(); ?>
