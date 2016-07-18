<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Вход</title>
<style>
body {
	font-family: sans-serif;
	padding: 1cm;
}

form {
	width: 20em;
	text-align: center;
	margin: auto;
}
form div {
	margin-bottom: 0.2em;
}
label {
	display: block;
}
</style>
</head>
<body>

<form method="post" action="<?= aurl( "login", CURRENT_URL ) ?>">
	<?php
	$errors = action_errors( "login" );
	if( $errors ){
		?><p class="error">Неверные данные</p><?php
		$login = action_data( "login", "login" );
	} else {
		$login = "";
	}
	?>
	<div>
		<input name="login" value="<?= $login ?>" placeholder="Имя пользователя" required autofocus>
	</div>
	<div>
		<input type="password" name="password" value="" placeholder="Пароль">
	</div>
	<button type="submit">Вход</button>
</form>

</body>
</html>
