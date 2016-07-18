<?php _header(); ?>

<h1>Смена пароля</h1>

<form method="post" action="<?= aurl( 'change_service_password' ) ?>">
<?php
echo Snippets::action_errors( 'change_service_password' );
if( action_result( 'change_service_password' ) ) {
	?><p class="notice">Пароль изменён.</p><?php
}
?>
<div>
	<label>Текущий пароль</label>
	<input type="password" name="current-password" value="">
</div>
<div>
	<label>Новый пароль</label>
	<input type="password" name="new-password" value="">
</div>
<div>
	<label>Новый пароль ещё раз</label>
	<input type="password" name="new-password-confirm" value="">
</div>
<button type="submit">Сохранить</button>
</form>

<?php _footer(); ?>
