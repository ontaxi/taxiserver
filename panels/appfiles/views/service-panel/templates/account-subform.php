
<tr>
	<td>Имя пользователя</td>
	<td>
		<?php if( $acc->id() ): ?>
			<input name="login" disabled value="<?= $acc->login() ?>">
		<?php else: ?>
			<input name="login" value="<?= $acc->login() ?>"
				placeholder="Новое имя" required>
		<?php endif; ?>
	</td>
</tr>
<tr>
	<td>Позывной</td>
	<td><input name="call_id" value="<?= $acc->call_id() ?>" required></td>
</tr>
<tr>
	<td>
		<?php if( $acc->id() ): ?>
			<input type="checkbox" id="cb-change-password"
				name="set-password" value="1"
				class="ui" data-switch="password-container">
			<label for="cb-change-password">Сменить пароль</label>
		<?php else: ?>
			<label>Пароль</label>
			<input type="hidden" name="set-password" value="1">
		<?php endif; ?>
	</td>
	<td id="password-container">
		<input name="password" value="" placeholder="Новый пароль">
	</td>
</tr>
