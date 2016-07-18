<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<?php require_script( 'res/lib/jquery.js' ); ?>
	<?php require_script( 'res/lib/fill.js' ); ?>
	<?php require_stylesheet( 'res/dispatcher/main.css' ); ?>
	<?php require_stylesheet( 'res/lib/admin.css' ); ?>

	<title>Диспетчер <?= user::get_login() ?></title>
</head>
<body>

<header>
	<nav>
		<h1>Диспетчер <?= user::get_login() ?></h1>
		<ul>
			<li><a href="<?= url( 'order' ) ?>">Отправка заказов</a></li>
			<li><a href="<?= url( 'online-cars' ) ?>">Водители на связи</a></li>
			<li><a href="<?= url( 'orders' ) ?>">Архив заказов</a></li>
			<li><a href="<?= url( 'log' ) ?>">Архив журнала</a></li>
			<li><a href="<?= url( 'clients' ) ?>">Клиенты</a></li>
			<li><a href="<?= aurl( 'logout' ) ?>">Выход</a></li>
		</ul>
	</nav>
</header>
