<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<?php require_stylesheet( 'res/lib/admin.css' ); ?>
	<?php require_script( 'res/lib/jquery.js' ); ?>
	<?php require_script( 'res/lib/html5-forms.js' ); ?>

	<title>Отчёты &mdash; диспетчер <?= user::get_login() ?></title>
</head>
<body>

<nav id="nav">
	<b>Диспетчер <?= user::get_login() ?></b>
	<a href="<?= aurl( 'logout' ) ?>">Выход</a>
	<a href="<?= url( '' ) ?>">Заказ</a>
	<a href="<?= url( 'reports' ) ?>">Отчёты</a>
</nav>

<?php
function get_range()
{
	$t1 = vars::get( 'time-from' );
	$t2 = vars::get( 'time-to' );

	if( !$t1 || !$t2 ) return null;

	$t1 = strtotime( $t1 );
	$t2 = strtotime( $t2 );
	return array( $t1, $t2 );
}

function time_selector( $range )
{
	if( !$range ) {
		$now = time();
		$range = array( $now - 10*3600, $now );
	}
	?>
	<label>От</label>
	<input type="datetime-local" name="time-from" step="any"
		value="<?= input_datetime( $range[0] ) ?>">
	<label>До</label>
	<input type="datetime-local" name="time-to" step="any"
		value="<?= input_datetime( $range[1] ) ?>">
	<?php
}

$name = argv(1);

if( $name === null ) {
	show_menu();
}
else {
	show_report( $name );
}

function show_menu()
{
	?>
	<ul>
		<li><a href="<?= url( 'reports list' ) ?>">Архив заказов</a></li>
		<li><a href="<?= url( 'reports daytimes' ) ?>">Распределение заказов по времени суток</a></li>
		<li><a href="<?= url( 'reports months' ) ?>">Распределение заказов по месяцам</a></li>
	</ul>
	<?php
}

function show_report( $name )
{
	$reports = array( 'list', 'daytimes', 'months' );
	if( !in_array( $name, $reports ) ) {
		error_notfound();
	}
	echo template( 'reports/'.$name );
}


?>
</body>
</html>
