<?php
set_page_title( 'Отчёт по объектам' );

$service_id = sid();
$drivers = taxi::drivers_kv( $service_id );

$t1 = Vars::get( 'time-from' );
if( $t1 ) $t1 = strtotime( $t1 );
else $t1 = time() - 24 * 3600;

$t2 = Vars::get( 'time-to' );
if( $t2 ) $t2 = strtotime( $t2 );
else $t2 = time();

$driver_id = Vars::get( 'driver-id' );

function hours_array( $start_hour = 7 )
{
	$hours = array();
	$hour = $start_hour;
	for( $i = 0; $i < 24; $i++ )
	{
		$hours[] = $hour++;
		if( $hour == 24 ) $hour = 0;
	}

	return $hours;
}

function create_report_table( $stats )
{
	$hour_totals = array();
	$header = array( 'Точка', 'Заказы' );

	$hours = hours_array();
	foreach( $hours as $hour )
	{
		$header[] = "$hour:00—$hour:59";
		$hour_totals[$hour] = array( 'finished' => 0, 'total' => 0 );
	}

	$header[] = 'Всего за промежуток';

	$table = new table( $header );

	foreach( $stats as $cpname => $hour_stats )
	{
		$row1 = array( $cpname, 'Принято' );
		$row2 = array( '', 'Выполнено' );
		$row3 = array( '', '% выполненных' );

		$total = 0;
		$finished = 0;

		foreach( $hours as $hour )
		{
			$h = $hour_stats[$hour];

			if( !$h['total'] ) {
				$row1[] = '0';
				$row2[] = '0';
				$row3[] = '0';
			}
			else {
				$row1[] = $h['total'];
				$row2[] = $h['finished'];
				$row3[] = round( $h['finished'] / $h['total'] * 100 );
				$total += $h['total'];
				$finished += $h['finished'];
			}

			$hour_totals[$hour]['total'] += $h['total'];
			$hour_totals[$hour]['finished'] += $h['finished'];
		}

		$row1[] = $total;
		$row2[] = $finished;
		$row3[] = $total ? round( $finished/$total * 100 ) : 0;

		$table->add_row( $row1 );
		$table->add_row( $row2 );
		$table->add_row( $row3 );
	}

	$row1 = array( 'Итого', 'Принято' );
	$row2 = array( '', 'Выполнено' );
	$row3 = array( '', '% выполненных' );

	$gt = 0;
	$gf = 0;
	foreach( $hours as $hour )
	{
		$t = $hour_totals[$hour]['total'];
		$f = $hour_totals[$hour]['finished'];
		$row1[] = $t;
		$row2[] = $f;
		$row3[] = $t ? round( $f / $t * 100 ) : 0;

		$gt += $t;
		$gf += $f;
	}

	$row1[] = $gt;
	$row2[] = $gf;
	$row3[] = $gt ? round( $gf / $gt * 100 ) : 0;

	$table->add_row( $row1 );
	$table->add_row( $row2 );
	$table->add_row( $row3 );

	return $table;
}

function checkpoints_hourly_stats( $service_id, $t1, $t2, $driver_id = null )
{
	$t1 = intval( $t1 );
	$t2 = intval( $t2 );
	$service_id = intval( $service_id );
	$driver_id = intval( $driver_id );

	if( $driver_id ) {
		$driver_condition = "AND taxi_id = $driver_id";
	} else $driver_condition = "";


	$q = "
	SELECT
		loc.name AS checkpoint_name,
		HOUR(o.time_created) AS hour,
		o.finished,
		COUNT(order_id) AS count
	FROM
		-- locations marked for reports
		(SELECT loc_id, name, service_id
		FROM taxi_locations
		WHERE deleted = 0
			AND do_reports = 1
		) loc
	LEFT JOIN
		-- finished orders of the selected driver
		(SELECT
			order_id,
			src_loc_id AS loc_id,
			service_id,
			`status` = 'finished' AS finished,
			time_created
		FROM taxi_orders
		WHERE deleted = 0
			$driver_condition
			AND src_loc_id IS NOT NULL
			AND time_created BETWEEN FROM_UNIXTIME($t1) AND FROM_UNIXTIME($t2)
		) o
	USING (service_id, loc_id)
	WHERE service_id = $service_id
	GROUP BY loc_id, loc.name, hour, finished
	ORDER BY loc.name
	";

	$r = DB::getRecords( $q );
	$cp = array();

	foreach( $r as $row )
	{
		$name = $row['checkpoint_name'];
		if( !isset( $cp[$name] ) )
		{
			$hours = array();
			$hour = 7;
			for( $i = 0; $i < 24; $i++ )
			{
				$hours[$hour] = array(
					'total' => 0,
					'finished' => 0
				);
				$hour++;
				if( $hour == 24 ) {
					$hour = 0;
				}
			}
			$cp[$name] = $hours;
		}

		$hour = $row['hour'];
		if( $hour !== null )
		{
			$n = intval( $row['count'] );
			if( $row['finished'] ) {
				$cp[$name][$hour]['finished'] = $n;
			}
			$cp[$name][$hour]['total'] += $n;
		}
	}

	return $cp;
}
?>

<h1><?= page_title() ?></h1>

<form action="<?= htmlspecialchars( CURRENT_URL ) ?>">
<label>От</label>
<input type="datetime-local" name="time-from" step="any"
	value="<?= input_datetime( $t1 ) ?>">
<label>До</label>
<input type="datetime-local" name="time-to" step="any"
	value="<?= input_datetime( $t2 ) ?>">

<div>
	<label>Водитель</label>
	<?= HTMLSnippets::select( 'driver-id', $drivers, $driver_id, 'Все водители' ) ?>
</div>
<button type="submit" name="act" value="show">Показать</button>
<button type="submit" name="act" value="download">Выгрузить</button>
</form>
<?php

$act = Vars::get( 'act' );
if( $act )
{
	$stats = checkpoints_hourly_stats( $service_id, $t1, $t2, $driver_id );
	$table = create_report_table( $stats );

	if( $act == 'show' ) {
		echo $table;
	}
	else {
		download_spreadsheet( $table->get_rows( true ) );
	}
}


?>
