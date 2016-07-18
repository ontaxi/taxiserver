<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Панель управления <?= user::get_login() ?></title>
<?php require_stylesheet( 'res/lib/admin.css' ); ?>
<?php require_stylesheet( 'res/service/main.css' ); ?>
<?php require_script( 'res/lib/jquery.js' ); ?>
<?php require_script( 'res/lib/leaflet/leaflet.js' ); ?>
<?php require_script( 'res/lib/html5-forms.js' ); ?>
<?php require_script( 'res/lib/tabs.js' ); ?>
<?php require_script( 'res/service/ui.js' ); ?>
</head>
<body>

<?php
$service_id = sid();
?>

<header>
	<nav>
		<h1><?= user::get_login() ?></h1>
		<ul>
			<li><a href="<?= url( 'cars' ) ?>">Автомобили</a></li>
			<li><a href="<?= url( 'drivers' ) ?>">Водители</a></li>
			<li><a href="<?= url( 'fares' ) ?>">Тарифы</a></li>
			<li><a href="<?= url( 'dispatchers' ) ?>">Диспетчеры</a></li>
			<li><a href="<?= url( 'queues' ) ?>">Очереди</a></li>
			<li><a href="<?= url( 'locations' ) ?>">Объекты</a></li>
			<li><a href="<?= url( 'customers' ) ?>">Клиенты</a></li>
			<li><a href="<?= url( 'reports' ) ?>">Отчёты</a></li>
			<li><a href="<?= url( 'settings' ) ?>">Настройки</a></li>
			<li><a href="<?= url( 'change-password' ) ?>">Смена пароля</a></li>
			<li><a href="<?= aurl( 'logout' ) ?>">Выход</a></li>
		</ul>
	</nav>
</header>

<div id="content" class="ui-onload">

<?= Snippets::action_errors() ?>
