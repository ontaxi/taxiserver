<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<?php require_stylesheet( 'res/lib/admin.css' ); ?>
	<?php require_script( 'res/lib/jquery.js' ); ?>
	<?php require_script( 'res/lib/fill.js' ); ?>

	<?php require_script( 'res/dispatcher-loc/order.js' ); ?>
	<?php require_stylesheet( 'res/dispatcher-loc/order.css' ); ?>

	<title>Диспетчер <?= user::get_login() ?></title>
</head>
<body>

<nav id="nav">
	<b>Диспетчер <?= user::get_login() ?></b>
	<a href="<?= aurl( 'logout' ) ?>">Выход</a>
	<a href="<?= url( 'reports' ) ?>">Отчёты</a>
</nav>
