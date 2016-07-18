<?php _header(); ?>

<?php
require_script( 'res/lib/leaflet/leaflet.js' );
require_script( 'res/lib/map.js' );
require_script( 'res/dispatcher/car.js' );
?>

<?php
$dispatcher_id = user::get_id();
$service_id = sid();
$car_id = argv(1);

$driver = DB::getRecord( "SELECT call_id
	FROM taxi_accounts acc JOIN taxi_drivers USING (acc_id)
	WHERE acc_id = %d AND service_id = %d
	AND acc.deleted = 0", $car_id, $service_id );
if( !$driver ) {
	error_notfound();
}
?>

<h1>Автомобиль <?= $driver['call_id'] ?></h1>

<div class="columns">
	<div id="map"></div>

	<div id="messages">
		<form method="post">
			<input type="hidden" name="car_id" value="<?= $car_id ?>">
			<textarea></textarea><br>
			<button type="button">Отправить сообщение</button>
		</form>
		<div id="notices"></div>
	</div>
</div>


<?php _footer(); ?>
