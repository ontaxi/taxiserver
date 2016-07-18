<?php _header(); ?>

<?php
$service_id = sid();

$r = DB::getRecords( "
SELECT
	queue_id, upstream, priority, name, sublist, addr, `order`,
	loc_id
FROM (
	SELECT
		p.queue_id,
		p.name,
		p.parent_id,
		p.addr,
		p.`order`,
		p.upstream,
		p.priority,
		p.loc_id,
		GROUP_CONCAT(c.name SEPARATOR ', ') AS sublist
	FROM
		taxi_queues p
		LEFT JOIN taxi_queues c
		ON c.parent_id = p.queue_id
	WHERE p.service_id = %d
	GROUP BY p.queue_id
	ORDER BY p.order
	) a", $service_id );

$table = new Table(array(
	'num' => '№',
	'name' => 'Название',
	'addr' => 'Стоянка',
	'sublist' => 'Подчинённые очереди',
	'priority' => 'Приоритет'
));

foreach( $r as $q )
{
	$qid = $q['queue_id'];
	$edit = url( 'queue '.$qid );

	/*
	 * Allow to delete only if not part of a checkpoint.
	 */
	if( !$q['loc_id'] ) {
		$delete = sprintf( '<a href="%s" class="delete">Удалить</a>',
			aurl( 'delete_queue '.$qid ) );
	}
	else {
		$delete = 'См. контрольный объект';
	}

	if( $q['upstream'] ) {
		$q['name'] .= ' (общая)';
	}

	$table->add_row( array(
		'num' => $q['order'],
		'name' => $q['name'],
		'addr' => $q['addr'],
		'sublist' => $q['upstream'] ? $q['sublist'] : 'нет',
		'priority' => $q['upstream'] ? '#' : $q['priority'],
		'edit' => sprintf( '<a href="%s" class="edit">Редактировать</a>', $edit ),
		'delete' => $delete
	));
}
?>

<h1>Очереди</h1>

<p><a class="button" href="<?= url( 'queue' ) ?>">Создать очередь</a>
<a class="button" href="<?= url( 'queue' ) ?>?upstream=1">Создать общую очередь</a></p>

<?= $table ?>

<?php _footer(); ?>
