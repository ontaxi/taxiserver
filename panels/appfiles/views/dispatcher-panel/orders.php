<?php _header(); ?>

<?php
require_script( 'res/lib/html5-forms.js' );

$service_id = sid();

$t1 = Vars::get( 'time-from' );
if( $t1 ) $t1 = strtotime( $t1 );
else $t1 = time() - 36000;

$t2 = Vars::get( 'time-to' );
if( $t2 ) $t2 = strtotime( $t2 );
else $t2 = time();

set_page_title( 'Архив заказов' );

function service_orders_table( $service_id, $t1, $t2 )
{
	$sid = intval( $service_id );
	$t1 = intval( $t1 );
	$t2 = intval( $t2 );

	$orders = DB::getRecords( "
		SELECT
			o.order_id,
			o.owner_id AS dispatcher_id,
			o.customer_id,
			o.taxi_id,
			o.car_id,
			o.status,
			o.src_addr,

			UNIX_TIMESTAMP( o.time_created ) AS time_created,

			IF( o.time_started IS NOT NULL,
				UNIX_TIMESTAMP( o.time_started ),
				NULL ) AS time_started,
			IF( o.time_finished IS NOT NULL,
				UNIX_TIMESTAMP( o.time_finished ),
				NULL ) AS time_finished,
			o.comments,
			o.cancel_reason,
			cust.name AS customer_name,
			cust.phone AS customer_phone,
			disp.call_id AS dispatcher_call_id,
			driver.call_id AS driver_call_id,
			c.name AS car_name,
			c.plate AS car_plate,
			loc.name AS loc_name
		FROM taxi_orders o
		LEFT JOIN taxi_accounts disp
			ON disp.acc_id = o.owner_id
		LEFT JOIN taxi_accounts driver
			ON driver.acc_id = o.taxi_id
		LEFT JOIN taxi_cars c
			ON o.car_id = c.car_id
		LEFT JOIN taxi_locations loc
			ON o.src_loc_id = loc.loc_id
		LEFT JOIN taxi_customers cust
			ON cust.customer_id = o.customer_id
		WHERE o.service_id = $service_id
		AND o.deleted = 0
		AND UNIX_TIMESTAMP(o.time_created) BETWEEN $t1 AND $t2
		ORDER BY o.time_created DESC"
	);

	$t = new Table( array(
		'time_created' => 'Дата и время создания',
		'dispatcher' => 'Диспетчер',
		'customer' => 'Клиент',
		'object' => 'Объект',
		'address' => 'Адрес',
		'driver' => 'Водитель',
		'car' => 'Автомобиль',
		'status' => 'Состояние',
		'comments' => 'Комментарии',
		'time' => 'Время поездки'
	));

	foreach( $orders as $o )
	{
		if( $o['status'] == orders::STATUS_FINISHED ) {
			$time = date( 'H:i', $o['time_started'] )
				. '&mdash;' . date( 'H:i', $o['time_finished'] );
		}
		else if( $o['status'] == orders::STATUS_STARTED ) {
			$time = date( 'H:i', $o['time_started'] )
				. '&mdash;&hellip;';
		}
		else {
			$time = '&mdash;';
		}

		$status_name = orders::get_status_name( $o['status'] );
		if( $o['status'] == orders::STATUS_CANCELLED ) {
			$r = $o['cancel_reason'];
			if( $r ) $status_name .= " ($r)";
		}

		$car = '';
		if( $o['car_name'] )
		{
			$car = $o['car_name'];
			if( $o['car_plate'] ) {
				$car .= ' ('.$o['car_plate'].')';
			}
		}

		$customer = implode( ', ', array_filter( array(
			$o['customer_phone'], $o['customer_name']
		) ) );

		$t->add_row( array(
			'time_created' => date( 'd.m.Y, H:i', $o['time_created'] ),
			'dispatcher' => $o['dispatcher_call_id'],
			'customer' => $customer,
			'object' => $o['loc_name'],
			'address' => $o['src_addr'],
			'driver' => $o['driver_call_id'],
			'car' => $car,
			'status' => $status_name,
			'comments' => $o['comments'],
			'time' => $time
		));
	}

	return $t;
}
?>

<h1>Архив заказов</h1>

<form action="<?= url( 'orders' ) ?>">
<label>От</label>
<input type="datetime-local" name="time-from" step="any"
	value="<?= input_datetime( $t1 ) ?>">
<label>До</label>
<input type="datetime-local" name="time-to" step="any"
	value="<?= input_datetime( $t2 ) ?>">
<button type="submit">Показать</button>
</form>

<?= service_orders_table( $service_id, $t1, $t2 ) ?>

<?php _footer(); ?>
