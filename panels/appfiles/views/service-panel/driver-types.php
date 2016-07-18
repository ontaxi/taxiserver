<?php _header(); ?>

<h1>Типы водителей</h1>

<p><a class="button" href="<?= url( 'driver-type' ) ?>">Добавить тип</a></p>

<?= types_table() ?>

<?php _footer(); ?>

<?php

function types_table()
{
	$types = DB::getRecords( "SELECT type_id, name
		FROM taxi_driver_types
		WHERE service_id = %d", sid()
	);

	$table = new table();
	foreach( $types as $t ) {
		$edit = url( 'driver-type '. $t['type_id'] );
		$delete = aurl( 'delete_driver_type '.$t['type_id'] );
		$table->add_row( array(
			'name' => $t['name'],
			'edit' => '<a href="'.$edit.'" class="edit">редактировать</a>',
			'delete' => '<a href="'.$delete.'" class="delete">удалить</a>'
		));
	}
	return $table;
}

?>
