<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<?php require_stylesheet( 'res/lib/admin.css' ); ?>
<?php set_page_title( 'Вход в панель службы' ); ?>
<style>
body {
	text-align: center;
}
</style>
</head>
<body>

<h1><?= page_title() ?></h1>

<form method="post" action="<?= aurl( 'service_login', url_t( 'service-panel:' ), CURRENT_URL ) ?>" id="login-form">

	<?php if( action_result() === false ){
		$data = action_data( 'service_login' );
		?><p class="error">Неверный логин или пароль.</p><?php
	} else {
		$data = array( 'login' => '' );
	}?>
	<div>
		<label for="i-login">Имя пользователя</label>
		<input name="login" id="i-login" required value="<?= $data['login'] ?>" autofocus>
	</div>
	<div>
		<label for="i-password">Пароль</label>
		<input name="password" id="i-password" type="password">
	</div>
	<button type="submit">Войти</button>
</form>

</body>
</html>
