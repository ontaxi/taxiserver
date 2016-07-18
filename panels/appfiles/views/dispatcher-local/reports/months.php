<h1>Заказы по месяцам</h1>

<form>
	<label for="i-year">Год</label>
	<?php
	$year = alt( vars::get( 'year' ), date( 'Y' ) );
	?>
	<input type="number" min="2014" step="1" size="4"
		name="year" id="i-year" value="<?= $year ?>">
	<button type="submit" name="act" value="show">Показать</button>
	<button type="submit" name="act" value="download">Выгрузить</button>
</form>

<?php
lib( 'russian' );
$year = vars::get( 'year' );
if( $year ) {
	$table = create_table( $year );
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

function create_table( $year )
{
	$year = intval( $year );
	$loc_id = loc_id();

	$stats = DB::getRecords( "
		SELECT `month`, SUM(finished) AS finished,
			SUM(not_finished) AS not_finished
		FROM (
			SELECT MONTH(time_created) AS `month`,
				`status` = 'finished' AS finished,
				`status` <> 'finished' AS not_finished
			FROM taxi_orders
			WHERE YEAR(time_created) = $year
			AND src_loc_id = $loc_id
		) A
		GROUP BY `month`"
	);
	$stats = array_index( $stats, 'month' );

	$table = new table( array(
		'month' => 'Месяц',
		'finished' => 'Выполнено',
		'not_finished' => 'Не выполнено',
		'total' => 'Всего'
	));

	$names = array(
		'',
		'Январь',
		'Февраль',
		'Март',
		'Апрель',
		'Май',
		'Июнь',
		'Июль',
		'Август',
		'Сентябрь',
		'Октябрь',
		'Ноябрь',
		'Декабрь'
	);

	for( $month = 1; $month <= 12; $month++ )
	{
		if( isset( $stats[$month] ) ) {
			$stat = $stats[$month];
		} else {
			$stat = array( 'finished' => 0, 'not_finished' => 0 );
		}

		$table->add_row( array(
			'month' => $names[$month],
			'finished' => $stat['finished'],
			'not_finished' => $stat['not_finished'],
			'total' => $stat['finished'] + $stat['not_finished']
		));
	}

	return $table;
}

?>
