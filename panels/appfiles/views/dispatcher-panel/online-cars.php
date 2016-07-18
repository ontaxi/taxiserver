<?php _header(); ?>

<?php require_script( 'res/dispatcher/cars.js' ); ?>

<?php
$service_id = sid();
$taxis = dx_disp::get_online_service_taxis_r( $service_id );

$t = new Table( array(
	'call_id' => 'Позывной',
	'car_name' => 'Автомобиль',
	'car_plate' => 'Номер',
	'address' => 'Адрес'
));

foreach( $taxis as $c )
{
	$lat = $c['latitude'];
	$lon = $c['longitude'];
	if( $lat && $lon ) {
		$address = point_addr( $lat, $lon );
	} else {
		$address = null;
	}
	$iid = 'i-car-'.$c['taxi_id'];

	$call_id = $c['call_id'];
	if( !$c['is_free'] ) {
		$call_id .= ' &mdash; занят';
	}

	if( $address ) {
		$location = sprintf( '<a href="%s">%s</a>',
			url( 'locate-car '. $c['taxi_id'] ),
			$address->format('$Name $type[, д. $House][, к. $Building]')
		);
	} else {
		$location = '&mdash;';
	}

	$t->add_row( array(
		'checkbox' => '<input type="checkbox" name="cars[]" value="'.$c['taxi_id'].'" id="'.$iid.'">',
		'call_id' => '<label for="'.$iid.'">'.$call_id.'</label>',
		'car_name' => $c['car_name'],
		'car_plate' => $c['car_plate'],
		'address' => $location
	));
}

set_page_title( 'Водители на связи' );

?>

<h1>Водители на связи</h1>

<p><a href="<?= CURRENT_URL ?>">Обновить</a></p>

<?php if( $t->get_rows_count() ): ?>

<form method="post" action="<?= aurl( 'send_dispatcher_message' ) ?>" id="online-drivers-form">

<?php
$r = action_result( 'send_dispatcher_message' );

if( $r ) {
	?><p class="notice">Сообщение отправлено.</p><?php
}
else if( $r === false ) {
	?><p class="error">Произошла ошибка, возможно сообщение не было доставлено.</p><?php
}?>

<?= $t ?>

<div>
	<label>Сообщение выбранным водителям</label>
	<textarea name="message" required></textarea>
</div>
<button type="submit">Отправить</button>

</form>

<?php else: ?>
	<p>Никого нет на связи.</p>
<?php endif; ?>

<?php _footer(); ?>
