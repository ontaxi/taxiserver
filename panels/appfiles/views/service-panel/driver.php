<?php _header(); ?>

<?php
require_script( 'res/service/pages.js?page=driver' );

$service_id = sid();
$driver_id = argv(1);
if( $driver_id )
{
	$driver = new driver( $driver_id, '*' );
	$acc_id = $driver->acc_id();
	if( !$acc_id ) error_notfound();
	$acc = new taxi_account( $acc_id, '*' );
	if( $acc->service_id() != $service_id ) {
		error_forbidden();
	}
}
else
{
	$acc_id = null;
	$driver = new driver();
	$acc = new taxi_account();
}

$now = time();
$block_time = strtotime( $driver->block_until() );
$block_time -= DB::time_diff();
if( $block_time < $now ) {
	$is_blocked = false;
	$block_time = $now;
} else {
	$is_blocked = true;
}
$cars = taxi::driverless_cars_kv( $service_id, $driver_id );
$groups = driver_groups::get_service_groups_kv( $service_id );
?>

<?php if( $driver_id ) {
	?><h1>Водитель <?= $acc->login() ?></h1><?php
} else { ?>
	<h1>Новый водитель</h1><?php
}?>

<?php
$action = aurl( 'save_driver', url_t( 'drivers' ), CURRENT_URL );
?>
<form method="post" enctype="multipart/form-data"
	action="<?= $action ?>">

	<input type="hidden" name="id" value="<?= $driver_id ?>">

	<div class="ui-tabs">
		<section>
			<h1>Системные данные</h1>
			<table>
				<?= template( 'templates/account-subform',
					array( 'acc' => $acc ) ) ?>
				<tr>
					<td>Бригада</td>
					<td><?php
						$attrs = array( 'name' => 'group_id', 'required' => true );
						$groups[-1] = 'Новая';
						?>

						<?= HTMLSnippets::select( $attrs, $groups,
							$driver->group_id(), '' ) ?>
						<?= HTMLSnippets::labelled_checkbox( 'Бригадир',
							'driver-brig', '1', $driver->is_brig() ) ?>
					</td>
				</tr>
				<?php
				$types = DB::getRecords( "SELECT type_id, name
					FROM taxi_driver_types
					WHERE service_id = %d", $service_id );
				$types = array_column( $types, 'name', 'type_id' );
				if( !empty( $types ) ): ?>
				<tr>
					<td>Тип</td>
					<td><?= HTMLSnippets::select( 'type_id', $types, $driver->type_id(), '' ) ?></td>
				</tr>
				<?php endif; ?>
				<tr>
					<td>Автомобиль</td>
					<td><?= HTMLSnippets::select( 'car_id', $cars,
					$driver->car_id(), 'Нет' ) ?></td>
				</tr>
				<?php
				if( service_settings::config( $service_id, 'imitations' ) ):
				?>
				<tr>
					<td><label for="cb-fake">Без смартфона (имитация)</label></td>
					<td><?= HTMLSnippets::checkbox(
						array( 'name' => 'driver-fake', 'id' => 'cb-fake' ), $driver->is_fake(), 1 ) ?></td>
				</tr>
				<?php endif; ?>
			</table>
		</section>
		<section>
			<h1>Личные данные</h1>
			<table>
				<tr>
					<td>Имя</td>
					<td><input name="driver-name" value="<?= $acc->name() ?>">
						<small>Пример: Агафонов В. А.</small></td>
				</tr>
				<tr>
					<td>Личный номер телефона</td>
					<td><input name="personal_phone" value="<?= $acc->personal_phone() ?>" pattern="[+]375\d{9}">
						<small>Пример: +375291126452</small></td>
				</tr>
				<tr>
					<td><label>День рождения</label></td>
					<td><input name="birth_date" type="date"
						value="<?= $acc->birth_date() ?>"></td>
				</tr>
				<tr>
					<td><label>Фотография</label></td>
					<td><?php
						if( $acc->photo() ) {
							echo HTMLSnippets::image( image_src( $acc->photo(), 200, 200 ) );
						}
						?>
						<input name="photo" type="file" accept="image/jpeg,image/png"></td>
				</tr>
			</table>
		</section>
		<section>
			<h1>Служебные данные</h1>
			<table>
			<tr>
				<td>Служебный номер телефона</td>
				<td><input name="driver-phone" value="<?= $acc->work_phone() ?>" pattern="[+]375\d{9}"></td>
			</tr>
			<tr>
				<td>Юридическое лицо</td>
				<td><input name="driver-firm" value="<?= htmlspecialchars( $driver->firm() ) ?>"></td>
			</tr>
			<tr>
				<td><label for="cb-term">Имеет банковский терминал</label></td>
				<td><?= HTMLSnippets::checkbox(
						array( 'name' => 'driver-has-bank-terminal', 'id' => 'cb-term' ), $driver->has_bank_terminal(), 1 ) ?></td>
			</tr>
			<tr>
				<td>Водительское удостоверение</td>
				<td>
					№ <input name="dl_num" value="<?= $driver->dl_num() ?>">
					до <input name="dl_expires" type="date"
						value="<?= $driver->dl_expires() ?>">
				</td>
			</tr>
			<tr>
				<td>Медицинская справка</td>
				<td>
					№ <input name="health_cert"
						value="<?= $driver->health_cert() ?>">
					до <input name="health_cert_expires" type="date"
						value="<?= $driver->health_cert_expires() ?>">
				</td>
			</tr>
			<tr>
				<td>Свидетельство такси</td>
				<td>
					№ <input name="taxi_cert"
						value="<?= $driver->taxi_cert() ?>">
					до <input name="taxi_cert_expires" type="date"
						value="<?= $driver->taxi_cert_expires() ?>">
				</td>
			</tr>
			</table>
		</section>
		<section>
			<h1>Блокировка</h1>
			<div>
				<input type="checkbox" id="cb-block"
					class="ui" data-switch="block-details"
					name="block" value="1" <?= $is_blocked? 'checked':'' ?>>
				<label for="cb-block">Блокировать водителя</label>
			</div>
			<table id="block-details">
				<tr>
					<td><label>Причина блокировки</label></td>
					<td><input name="driver-block-reason"
						value="<?= $driver->block_reason() ?>">
					</td>
				</tr>
				<tr>
					<td><label>Дата и время снятия блока</label></td>
					<td><input type="datetime-local" name="driver-block-until"
						value="<?= input_datetime( $block_time ) ?>">
					</td>
				</tr>
			</table>
		</section>
	</div>
	<button type="submit">Сохранить</button>
</form>

<?php _footer(); ?>
