<?php

if( user::get_type() != 'service' ) {
	redirect( url_t( 'login:' ) );
}

function get_time()
{
	$t1 = vars::get( 'time-from' );
	if( $t1 ) $t1 = strtotime( $t1 );
	else $t1 = time() - 36000;

	$t2 = vars::get( 'time-to' );
	if( $t2 ) $t2 = strtotime( $t2 );
	else $t2 = time();

	return array( $t1, $t2 );
}

function time_selector( $range )
{
	?>
	<label>Промежуток времени</label>
	<input type="datetime-local" name="time-from" step="any"
		value="<?= input_datetime( $range[0] ) ?>">
	&mdash;
	<input type="datetime-local" name="time-to" step="any"
		value="<?= input_datetime( $range[1] ) ?>">
	<?php
}

function show_positions( $service_id, $driver_id, $t1, $t2 )
{
	$states = taxi_tracks::get_positions_report( $service_id, $driver_id, $t1, $t2 );
	if( empty( $states ) ) {
		?><p>Нет записей</p><?php
		return;
	}
	$tbl = new table(array(
		't' => 'Время',
		'pos' => 'Координаты',
		'addr' => 'Адрес',
		'speed' => 'Скорость',
		'dr' => 'Путь',
		'event' => 'Комментарии'
	));

	$evnames = array(
		'begin' => 'Начало',
		'order-started' => 'Пуск счётчика',
		'order-finished' => 'Остановка счётчика',
		'disconnect' => 'Разрыв связи',
		'gps_error' => 'Ошибка GPS'
	);
	foreach( $states as $state )
	{
		if( $state['dr'] !== null )
		{
			$state['dr'] = '+' . round( $state['dr'] ).'&nbsp;м';
			$state['speed'] = round( $state['speed'] ) .'&nbsp;км/ч';
		}

		if( $state['lat'] ) {
			$pos = str_replace( '.', ',', sprintf( "%.7f; %.7f", $state['lat'], $state['lon'] ) );
		} else {
			$pos = '';
		}

		$event = $state['event'];
		if( $event && isset( $evnames[$event] ) ) {
			$event = $evnames[$event];
		}

		if( $event == 'idle' )
		{
			if( $state['dt'] > 5 * 60 ) {
				$event = sprintf( 'Стоянка, %d мин.', round($state['dt'] / 60) );
			}
			else if( $state['dt'] > 60 ) {
				$event = sprintf( 'Остановка, %d мин.', round($state['dt'] / 60) );
			}
			else $event = '';
		}

		$tbl->add_row( array(
			't' => date( 'd.m.Y, H:i:s', $state['t'] ),
			'pos' => $pos,
			'addr' => $state['addr'],
			'speed' => $state['speed'],
			'dr' => $state['dr'],
			'event' => $event
		));
	}

	require_script(
		'res/lib/leaflet/leaflet.js',
		'res/lib/map.js',
		'res/service-157/session-positions.js'
	);
	?>
	<script>
	var export_states = <?= json_encode( $states ) ?>;
	</script>
	<div id="map"></div>
	<?php if( $tbl->get_rows_count() > 0 ): ?>
	<?= $tbl ?>
	<?php endif; ?>
	<?php
}


?>
