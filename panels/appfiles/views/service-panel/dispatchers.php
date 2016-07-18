<?php _header(); ?>

<h1>Диспетчеры</h1>

<a href="<?= url( 'dispatcher' ) ?>" class="button">Добавить диспетчера</a>

<?php
$service_id = intval( sid() );

$t = new Table(array(
	'call_id' => 'Позывной',
	'login' => 'Системное имя',
	'name' => 'Имя'
));

$r = DB::getRecords( "
	SELECT acc_id, call_id, name, login
	FROM taxi_accounts acc
	WHERE acc.type = 'dispatcher'
	AND acc.deleted = 0
	AND acc.service_id = $service_id" );

foreach( $r as $d )
{
	$id = $d['acc_id'];
	$t->add_row( array(
		'call_id' => $d['call_id'],
		'login' => $d['login'],
		'name' => $d['name'],
		'edit' => sprintf( '<a href="%s" class="edit">Редактировать</a>',
			url( 'dispatcher '.$id )
		),
		'delete' => sprintf( '<a href="%s" class="delete">Удалить</a>',
			aurl( 'delete_dispatcher '.$id ) )
	));
}

echo $t;
?>

<?php _footer(); ?>
