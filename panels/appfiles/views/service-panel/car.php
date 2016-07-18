<?php _header(); ?>

<?php
$service_id = sid();
$car_id = argv(1);

if( $car_id )
{
	$car = new car( $car_id, '*' );
	$driver_id = taxi_drivers::get_by_car( $car_id );
}
else
{
	$car = new car();
	$driver_id = null;
}

$groups = taxi::parks_kv( $service_id );
$gid = $car->group_id();
if( !$gid && !empty( $groups ) ) {
	$keys = array_keys( $groups );
	$gid = $keys[0];
}
?>

<?php if( $car_id ){
	?><h1>Редактирование автомобиля</h1><?php
} else { ?>
	<h1>Новый автомобиль</h1><?php
}?>

<form method="post" enctype="multipart/form-data"
	action="<?= aurl( 'save_car', url_t( 'cars' ), CURRENT_URL ) ?>">

	<input type="hidden" name="car-id" value="<?= $car_id ?>">

	<div class="ui-tabs">
		<section>
			<h1>Данные об автомобиле</h1>
			<table>
				<tr>
					<td><label>Марка</label></td>
					<td><input name="car-name" value="<?= $car->name() ?>" required></td>
				</tr>
				<tr>
					<td><label>Тип кузова</label></td>
					<td><?= HTMLSnippets::select(
					array( 'name' => 'car-body_type', 'required' => true ),
					taxi::$car_body_types, $car->body_type()
				) ?></td>
				</tr>
				<tr>
					<td><label>Год выпуска</label></td>
					<td><input type="number" size="4" min="1970" step="1"
					name="year_made" value="<?= $car->year_made() ?>"></td>
				</tr>
				<tr>
					<td><label>Цвет</label></td>
					<td><input name="car-color" value="<?= $car->color() ?>"></td>
				</tr>
				<tr>
					<td><label>Гос. номер</label></td>
					<td><input name="car-plate" value="<?= $car->plate() ?>"
					pattern="[A-z\- \d]*">
				<small>Цифры, пробел, дефис и латинские буквы. Пример: 7TBX1240</small></td>
				</tr>
				<tr>
					<td><label>Класс</label></td>
					<td><?= HTMLSnippets::select( 'class',
						taxi::$car_classes, $car->class(), '' ) ?></td>
				</tr>
				<tr>
					<td><label>Пробег</label></td>
					<td><input name="odometer" type="number" min="0" step="1"
					value="<?= alt( $car->odometer(), 0 ) ?>"> м</td>
				</tr>
				<tr>
					<td><label>Водитель</label></td>
					<td><?= HTMLSnippets::select( 'driver-id', taxi::unseated_drivers_kv( $service_id, $car_id ), $driver_id, 'Нет' ) ?></td>
				</tr>
				<tr>
					<td><label>Автопарк</label></td>
					<td><?= HTMLSnippets::select(
						array( 'name' => 'group-id' ), $groups, $gid,
						'(создать новый)'
					) ?></td>
				</tr>
			</table>
		</section>
		<section>
			<h1>Документы</h1>
			<table>
				<tr>
					<td><label>Техосмотр</label></td>
					<td>
						от <input type="date" name="warrant_date"
						value="<?= $car->warrant_date() ?>">
						до <input type="date" name="warrant_expires"
						value="<?= $car->warrant_expires() ?>">
					</td>
				</tr>
				<tr>
					<td><label>Страховка</label></td>
					<td>
						№ <input name="insurance_num"
						value="<?= $car->insurance_num() ?>">
						до <input type="date" name="insurance_expires"
					value="<?= $car->insurance_expires() ?>">
					</td>
				</tr>
				<tr>
					<td><label>Техпаспорт</label></td>
					<td>
						№ <input name="certificate_num"
					value="<?= $car->certificate_num() ?>">
						до <input type="date" name="certificate_expires"
					value="<?= $car->certificate_expires() ?>">
					</td>
				</tr>
			</table>
		</section>
	</div>
	<button type="submit">Сохранить</button>
</form>

<?php _footer(); ?>
