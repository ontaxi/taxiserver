<?php _header(); ?>

<?php
$sid = sid();

$table = new table( array(
	'name' => 'Название',
	'addr' => 'Адрес',
	'contact' => 'Контакт',
	'comments' => 'Комментарии'
));
$locations = DB::getRecords(
	"SELECT
		loc.loc_id,
		loc.name,
		loc.address,
		loc.contact_phone,
		loc.comments,
		(q.queue_id IS NOT NULL) AS is_cp
	FROM taxi_locations loc
	LEFT JOIN taxi_queues q
		ON q.loc_id = loc.loc_id
	WHERE loc.service_id = %d
	AND loc.deleted = 0
	ORDER BY is_cp DESC, loc.name", $sid );

foreach( $locations as $loc )
{
	$id = $loc['loc_id'];
	$name = $loc['name'];
	if( $loc['is_cp'] ) {
		$name .= ' (контрольный)';
		$edit = url( 'checkpoint '.$id );
	}
	else {
		$edit = url( 'location '.$id );
	}
	$table->add_row( array(
		'name' => $name,
		'addr' => $loc['address'],
		'contact' => $loc['contact_phone'],
		'comments' => $loc['comments'],
		'edit' => '<a href="'.$edit.'" class="edit">Редактировать</a>',
		'delete' => '<a href="'.aurl( 'delete_location '.$id ).'" class="delete">Удалить</a>'
	));
}

?>

<h1>Объекты</h1>

<p><a class="button" href="<?= url( 'location' ) ?>">Добавить объект</a>
<a class="button" href="<?= url( 'checkpoint' ) ?>">Добавить контрольный объект</a></p>

<?= $table ?>

<?php _footer(); ?>
