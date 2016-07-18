<?php

$service_id = sid();
$fares = fares::get_service_fares_kv( $service_id );
$selected_fares = fares::get_car_group_fares( $group_id, $service_id );
$action = aurl( 'save_car_group', url_t( 'cars' ), CURRENT_URL );

if( $group_id )
{
	$g = new car_group( $group_id, '*' );
	?><h1>Автопарк &laquo;<?= $g->name() ?>&raquo;</h1><?php
}
else
{
	$g = new car_group();
	?><h1>Новый автопарк</h1><?php
}

?>

<form method="post" action="<?= $action ?>">
	<input type="hidden" name="group-id" value="<?= $group_id ?>">
	<div>
		<label>Название</label>
		<input name="group-name" value="<?= $g->name() ?>" required>
	</div>
	<fieldset>
		<legend>Доступные тарифы</legend>
			<?php foreach( $fares as $id => $name ) {
				echo HTMLSnippets::labelled_checkbox( $name,
					'fare-id[]', $id, in_array( $id, $selected_fares ) );
				echo '<br>';
			}?>
	</fieldset>
	<button type="submit">Сохранить</button>
</form>
