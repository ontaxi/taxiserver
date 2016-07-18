<?php _header() ?>

<?= edit_form() ?>

<?php _footer() ?>

<?php

function edit_form()
{
	$id = argv(1);
	if( $id ) {
		?><h1>Редактирование типа</h1><?php
		$name = DB::getValue( "SELECT name FROM taxi_driver_types
			WHERE type_id = %d", $id );
	} else {
		?><h1>Новый тип</h1><?php
		$name = "";
	}

	$aurl = aurl( 'save_driver_type', url_t( 'driver-types' ), CURRENT_URL );

	?>
	<form method="post" action="<?= $aurl ?>">
		<input type="hidden" name="id" value="<?= $id ?>">
		<div>
			<label>Название</label>
			<input name="name" value="<?= $name ?>" required>
		</div>
		<button type="submit">Сохранить</button>
	</form>
	<?php
}

?>
