<?php _header(); ?>

<?php
$fare_id = argv(1);
if( $fare_id ) {
	$fare = new fare( $fare_id, '*' );
} else {
	$fare = new fare();
}
?>

<?php if( $fare_id ): ?>
	<h1>Тариф &laquo;<?= $fare->name() ?>&raquo;</h1>
<?php else: ?>
	<h1>Новый тариф</h1>
<?php endif; ?>

<?php
$action = aurl( 'save_fare', url_t( 'fares' ), CURRENT_URL );
?>
<form method="post" action="<?= $action ?>">
	<input type="hidden" name="id" value="<?= $fare_id ?>">
	<div>
		<label>Название</label>
		<input name="name" value="<?= $fare->name() ?>" required>
	</div>
	<div>
		<label>Посадка</label>
		<input type="number" size="6" min="0" step="100"
			name="start_price"
			value="<?= $fare->start_price() ?>">
	</div>
	<div>
		<label>Абонирование</label>
		<input type="number" size="6" min="0" step="100"
			name="minimal_price"
			value="<?= $fare->minimal_price() ?>">
	</div>
	<div>
		<label>За километр пути</label>
		<input type="number" size="6" min="0" step="100"
			name="kilometer_price"
			value="<?= $fare->kilometer_price() ?>">
	</div>
	<div>
		<label>За час простоя</label>
		<input type="number" size="6" min="0" step="100"
			name="slow_hour_price"
			value="<?= $fare->slow_hour_price() ?>">
	</div>
	<?php /*
	<div>
		<label>За час</label>
		<input type="number" size="6" min="0" step="100"
			name="hour_price"
			value="<?= $fare->hour_price() ?>">
	</div>
	<div>
		<label>За сутки</label>
		<input type="number" size="6" min="0" step="100"
			name="day_price"
			value="<?= $fare->day_price() ?>">
	</div>
	<div>
		<label>Специальная цена</label>
		<input type="number" size="6" min="0" step="100"
			name="special_price"
			value="<?= $fare->special_price() ?>">
	</div>
	*/ ?>
	<button type="submit">Сохранить</button>
</form>


<?php _footer(); ?>
