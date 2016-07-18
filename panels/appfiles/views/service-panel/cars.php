<?php _header(); ?>

<?php
require_script( 'res/service/pages.js?page=cars' );
?>

<?php
$service_id = sid();
$cars = DB::getRecords("
	SELECT
		c.car_id,
		c.name,
		c.plate,
		c.group_id,
		c.body_type,
		c.color,
		c.class,
		c.year_made,
		acc.call_id AS driver_call_id,
		g.name AS group_name
	FROM taxi_cars c
	JOIN taxi_car_groups g USING (service_id, group_id)
	LEFT JOIN taxi_drivers d ON c.car_id = d.car_id
	LEFT JOIN taxi_accounts acc USING (acc_id)
	WHERE c.service_id = %d
	AND c.deleted = 0
	ORDER BY c.name", $service_id
);

$groups = taxi::parks( $service_id );
foreach( $groups as $i => $group )
{
	$groups[$i]['table'] = new table( array(
		'name' => 'Марка',
		'driver' => 'Водитель',
		'plate' => 'Гос. номер',
		'color' => 'Цвет',
		'year' => 'Год выпуска',
		'class' => 'Класс',
		'body' => 'Тип кузова'
	) );
	$groups[$i]['count'] = 0;
}

foreach( $cars as $car )
{
	$id = $car['car_id'];
	$group_id = $car['group_id'];
	$t = $groups[$group_id]['table'];
	$t->add_row( array(
		'name' => $car['name'],
		'plate' => $car['plate'],
		'driver' => $car['driver_call_id'],
		'body' => array_alt( taxi::$car_body_types, $car['body_type'], '' ),
		'color' => $car['color'],
		'class' => array_alt( taxi::$car_classes, $car['class'], '' ),
		'year' => $car['year_made'],
		'edit' => sprintf( '<a href="%s" class="edit">редактировать</a>', url( 'car '.$id ) ),
		'delete' => sprintf( '<a href="%s" class="delete">удалить</a>', aurl( 'delete_car '.$id, CURRENT_URL ) )
	));
	$groups[$group_id]['count']++;
}
?>

<h1>Автомобили</h1>

<p><a class="button" href="<?= url( 'car' ) ?>">Добавить автомобиль</a></p>

<div class="ui-tabs">
	<?php foreach( $groups as $g )
	{
		$group_id = $g['group_id'];
		$url = url( 'car-group '.$group_id );
		?>
		<section>
			<h1><?= $g['name'] ?> (<?= $g['count'] ?>)</h1>

			<a class="button" href="<?= $url ?>">Редактировать автопарк &laquo;<?= $g['name'] ?>&raquo;</a>
			<?php if( $g['table']->get_rows_count() == 0 ) {
				$aurl = aurl( 'delete_car_group '.$group_id );
				?>
				<a class="button delete" href="<?= $aurl ?>">Удалить автопарк &laquo;<?= $g['name'] ?>&raquo;</a>
				<?php
			} ?>
			<?= $g['table'] ?>
		</section>
		<?php
	}?>

	<section>
		<h1>+ новый автопарк</h1>
		<?= template( '_park-edit', array( 'group_id' => null ) ) ?>
	</section>
</div>

<?php _footer(); ?>
