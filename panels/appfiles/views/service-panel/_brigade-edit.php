<?php
$service_id = sid();

if( $group_id )
{
	$g = new driver_group( $group_id, '*' );
	?><h1>Группа &laquo;<?= $g->name() ?>&raquo;</h1><?php
}
else
{
	$g = new driver_group();
	?><h1>Новая группа</h1><?php
}

$Q = DB::getRecords( "SELECT * FROM taxi_queues
	WHERE service_id = %d", $service_id );
$checked_queues = taxi_drivers::get_group_queues( $group_id );

?>


<?php
$action = aurl( 'save_driver_group', url_t( 'drivers' ), CURRENT_URL );
?>
<form method="post" action="<?= $action ?>">
	<input type="hidden" name="group-id" value="<?= $group_id ?>">
	<div>
		<label>Название</label>
		<input name="group-name" value="<?= $g->name() ?>" required>
	</div>
	<fieldset>
		<legend>Доступные очереди</legend>
		<?php
		foreach( $Q as $q )
		{
			$checked = in_array( $q['queue_id'], $checked_queues ) ? ' checked' : '';
			$id = "cb-q-$q[queue_id]";
			?>
			<div>
				<input type="checkbox"<?= $checked ?>
					id="<?= $id ?>" name="queues[]" value="<?= $q['queue_id'] ?>">
				<label for="<?= $id ?>"><?= $q['name'] ?></label>
			</div>
			<?php
		}
		?>
	</fieldset>
	<button type="submit">Сохранить</button>
</form>
