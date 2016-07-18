<?php

set_page_title( "Звонки" );

$t1 = Vars::get( 'time-from' );
if( $t1 ) $t1 = strtotime( $t1 );
else $t1 = time() - 24 * 3600;

$t2 = Vars::get( 'time-to' );
if( $t2 ) $t2 = strtotime( $t2 );
else $t2 = time();

$dispatcher_id = Vars::get( 'dispatcher-id' );

$act = Vars::get( 'act' );
if( $act )
{
	$table = get_stats( sid(), $t1, $t2, $dispatcher_id );

	if( $act == 'show' ) {
		show_form( $t1, $t2, $dispatcher_id );
		echo $table;
	}
	else {
		download_spreadsheet( $table->get_rows( true ) );
	}
}
else
{
	show_form( $t1, $t2, $dispatcher_id );
}

function get_stats( $sid, $t1, $t2, $dispatcher_id )
{
	$sid = intval( $sid );
	$t1 = intval( $t1 );
	$t2 = intval( $t2 );
	$dispatcher_id = intval( $dispatcher_id );

	$where = "c.creation_time BETWEEN
		FROM_UNIXTIME($t1) AND FROM_UNIXTIME($t2)";

	if( $dispatcher_id ) {
		$where .= " AND c.disp_id = $dispatcher_id";
	}

	$r = DB::getRecords("
		SELECT
			cday,
			COUNT(*) AS total,
			SUM(answered) AS answered,
			SUM(processed) AS processed,
			ROUND(SUM(answered)/COUNT(*) * 100) AS ans_ratio,
			ROUND(SUM(processed)/COUNT(*) * 100) AS proc_ratio
		FROM (
			SELECT
				DATE_FORMAT(c.creation_time, '%d.%m.%Y') AS cday,
				c.begin_time IS NOT NULL AS 'answered',
				o.order_id IS NOT NULL AS 'processed'
			FROM taxi_calls c
				JOIN taxi_accounts a ON a.acc_id = c.disp_id
				LEFT JOIN taxi_orders o ON o.call_id = c.call_id
			WHERE a.service_id = $sid
				AND $where
			ORDER BY c.creation_time
		) A
		GROUP BY cday
	");

	$t = new Table( array(
		'cday' => 'Дата',
		'total' => 'Всего звонков',
		'answered' => 'Отвечено',
		'processed' => 'Создано заказов',
		'ans_ratio' => '% отвеченных',
		'proc_ratio' => '% созданных заказов (относительно поступивших звонков)'
	));
	$t->add_rows( $r );
	return $t;
}

function show_form( $t1, $t2, $dispatcher_id )
{
	$dispatchers = array_column( DB::getRecords(
		"SELECT acc_id, call_id FROM taxi_accounts
		WHERE type = 'dispatcher'
		AND service_id = %d
		AND deleted = 0",
		sid()
	), 'call_id', 'acc_id' );
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
			<label>Диспетчер</label>
			<?= HTMLSnippets::select( 'dispatcher-id', $dispatchers, $dispatcher_id, 'Все' ) ?>
		</div>
		<button type="submit" name="act" value="show">Показать</button>
		<button type="submit" name="act" value="download">Выгрузить</button>
	</form>
	<?php
}

?>
