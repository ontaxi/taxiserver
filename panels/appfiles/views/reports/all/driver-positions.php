<?php
set_page_title( 'Перемещения водителя' );

$service_id = sid();
$driver_id = intval( vars::get( 'driver-id' ) );
$dt_ranges = array(
	'1800' => '30 минут',
	'3600' => '1 час',
	'7200' => '2 часа'
);
$dt = 1800;
$t = time() - $dt;
$drivers = taxi::drivers_kv( $service_id );
if( $driver_id )
{
	if( !isset( $drivers[$driver_id] ) ) {
		error_notfound();
	}
	$t = strtotime( vars::get( 't' ) );
	if( !$t ) {
		$t = time() - 1800;
	}

	$dt = intval( vars::get( 'dt' ) );
	$ranges = array_keys( $dt_ranges );
	if( !in_array( $dt, $ranges ) ) {
		$dt = $ranges[0];
	}
}


?>
<form>
	<div>
		<label>Водитель</label>
		<?= HTMLSnippets::select( 'driver-id', $drivers, $driver_id ) ?>
	</div>
	<div>
		<label>Начало</label>
		<input type="datetime-local" name="t" value="<?= input_datetime( $t ) ?>">
	</div>
	<div>
		<label>Промежуток</label>
		<?= HTMLSnippets::select( 'dt', $dt_ranges, $dt, null ) ?>

	</div>
	<button type="submit">Показать</button>
</form>

<?php
if( $driver_id ) {
	show_positions( $service_id, $driver_id, $t, $t + $dt );
}
?>
