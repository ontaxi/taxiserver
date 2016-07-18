<?php _header(); ?>

<?php

$service_id = sid();
$fares = fares::get_service_fares( $service_id );
$t = new table(array(
	'name' => 'Название',
	'start' => 'Посадка',
	'min' => 'Минимум',
	'km' => 'Километр',
	'hour' => 'Час простоя'
));

foreach( $fares as $id )
{
	$f = new fare( $id, '*' );
	$t->add_row( array(
		'name' => $f->name(),
		'start' => $f->start_price(),
		'min' => $f->minimal_price(),
		'km' => $f->kilometer_price(),
		'hour' => $f->slow_hour_price(),
		'edit' => sprintf( '<a href="%s" class="edit">Редактировать</a>',
			url( 'fare '.$id ) ),
		'delete' => sprintf( '<a href="%s" class="delete">Удалить</a>',
			aurl( 'delete-fare '.$id ) )
	));
}
?>

<h1>Тарифы</h1>

<p><a class="button" href="<?= url( 'fare' ) ?>">Добавить тариф</a></p>

<?= $t ?>

<?php _footer(); ?>
