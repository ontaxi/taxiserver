
<h1>Архив заказов</h1>

<form>
	<?= time_selector( get_range() ); ?>
	<?= driver_selector() ?>
	<button type="submit" name="act" value="show">Показать</button>
	<button type="submit" name="act" value="download">Выгрузить</button>
</form>

<?php
lib( 'russian' );

function driver_selector()
{
	$sid = sid();
	$drivers = array_column( DB::getRecords(
		"SELECT acc_id, call_id FROM taxi_accounts
		WHERE type = 'driver'
		AND service_id = %d
		AND deleted = 0",
		$sid
	), 'call_id', 'acc_id' );
	$driver_id = intval( vars::get( 'driver-id' ) );
	?>
	<label>Водитель</label>
	<?= HTMLSnippets::select( 'driver-id', $drivers, $driver_id ) ?>
	<?php
}

$range = get_range();
if( $range )
{
	$t1 = $range[0];
	$t2 = $range[1];
	$driver_id = intval( vars::get( 'driver-id' ) );
	$sid = sid();

	$cols = array(
		'order_id',
		'date_created',
		'time_created',
		'time_finished',
		'src_addr',
		'srcloc',
		'comments',
		'driver',
		'price',
		'dest_addr'
	);
	$filter = array(
		'driver_id' => $driver_id,
		'src_loc_id' => loc_id()
	);
	$table = orders::table( $sid, $t1, $t2, $cols, $filter );

	switch( vars::get( 'act' ) )
	{
		case 'download':
			download_spreadsheet( $table->get_rows() );
			exit;
		case 'show':
			$rows = $table->get_rows();
			$sum = array_sum( array_column( $rows, 'price' ) );
			echo '<p>';
			echo rus_number_phrase( count( $rows ), '%d заказ',
				'%d заказа', '%d заказов' );
			echo ', '.number_format( $sum, 0, ',', ' ' ), ' руб.';
			echo '</p>';

			echo $table;
			break;
	}
}
