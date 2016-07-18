<h1>Заказы по времени суток</h1>

<form>
	<?= time_selector( get_range() ) ?>
	<button type="submit" name="act" value="show">Показать</button>
	<button type="submit" name="act" value="download">Выгрузить</button>
</form>

<?php
lib( 'russian' );
$range = get_range();
if( $range ) {
	$table = create_table( $range );
	switch( vars::get( 'act' ) ) {
		case 'show':
			$n = array_sum( $table->column( 'total' ) );
			echo '<p>';
			echo rus_number_phrase( $n, '%d заказ',
				'%d заказа', '%d заказов' );
			echo '</p>';
			echo $table;
			break;
		case 'download':
			download_spreadsheet( $table );
			break;
	}
}

//--

function create_table( $range )
{
	$t1 = intval( $range[0] );
	$t2 = intval( $range[1] );

	$loc_id = loc_id();

	$stats = DB::getRecords( "
		SELECT `hour`, SUM(finished) AS finished,
			SUM(not_finished) AS not_finished
		FROM (
			SELECT HOUR(time_created) AS `hour`,
				`status` = 'finished' AS finished,
				`status` <> 'finished' AS not_finished
			FROM taxi_orders
			WHERE UNIX_TIMESTAMP(time_created) BETWEEN $t1 AND $t2
			AND src_loc_id = $loc_id
		) A
		GROUP BY `hour`"
	);
	$stats = array_index( $stats, 'hour' );

	$table = new table( array(
		'range' => 'Время',
		'finished' => 'Выполнено',
		'not_finished' => 'Не выполнено',
		'total' => 'Всего'
	));

	for( $hour = 0; $hour < 24; $hour++ )
	{
		if( isset( $stats[$hour] ) ) {
			$stat = $stats[$hour];
		} else {
			$stat = array( 'finished' => 0, 'not_finished' => 0 );
		}

		$table->add_row( array(
			'range' => sprintf( "%2d:00—%2d:59", $hour, $hour ),
			'finished' => $stat['finished'],
			'not_finished' => $stat['not_finished'],
			'total' => $stat['finished'] + $stat['not_finished']
		));
	}

	return $table;
}

?>
