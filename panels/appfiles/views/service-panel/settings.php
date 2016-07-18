<?php _header(); ?>
<?php
require_script( "res/service/pages.js?page=settings" );
?>
<?php
$S = service_settings::get_settings( sid() );
?>

<h1>Настройки</h1>

<?= Snippets::action_result( "Настройки сохранены" ) ?>

<form method="post" action="<?= aurl( 'save_service_settings' ) ?>">
<div class="ui-tabs">
<section>
	<h1>Служба</h1>

	<table>
	<tr><td>Город по умолчанию</td>
		<td><input name="s-default_city" value="<?= $S['default_city'] ?>"></td></tr>
	</table>
</section>
<section>
	<h1>Раздача заказов</h1>
	<table>
		<tr><td>Количество опрашиваемых водителей в очереди</td>
			<td><input type="number" min="1" step="1"
				name="s-queue_drivers"
				value="<?= $S['queue_drivers'] ?>"></td></tr>
		<tr><td>Радиус поиска свободных водителей</td>
			<td><input type="number" min="0" step="100"
				name="s-search_radius" value="<?= $S['search_radius'] ?>"> м</td></tr>
		<tr><td>Количество опрашиваемых свободных водителей</td>
			<td><input type="number" min="0" step="1"
				name="s-search_number" value="<?= $S['search_number'] ?>"></td></tr>
		<tr><td>Время принятия заказа при прямой рассылке</td>
			<td><input size="2" name="s-accept_timeout"
				value="<?= $S['accept_timeout'] ?>"> с</td></tr>
		<tr><td>Использовать &laquo;эфир&raquo; для заказов без очереди</td>
			<td><?= HTMLSnippets::checkbox( 's-pool_enabled_city',
				$S['pool_enabled_city'], '1' ) ?></td></tr>
		<tr><td>Использовать &laquo;эфир&raquo; после опроса очередей</td>
			<td><?= HTMLSnippets::checkbox( 's-pool_enabled_queues',
				$S['pool_enabled_queues'], '1' ) ?></td></tr>
		<tr><td>Длительность нахождения заказа в &laquo;эфире&raquo;</td>
			<td><input size="2" name="s-publish_duration"
				value="<?= $S['publish_duration'] ?>"> с</td></tr>
	</table>
</section>
<section>
	<h1>Обработка заказов</h1>

	<table>
		<tr><td>Записывать водительские заказы</td>
			<td><?= HTMLSnippets::checkbox( 's-driver_orders', $S['driver_orders'], 1 ) ?></td></tr>
		<tr><td>Помечать клиентов как проверенных при завершении заказов</td>
			<td><?= HTMLSnippets::checkbox( 's-mark_customers', $S['mark_customers'], 1 ) ?></td></tr>
	</table>
</section>
<section>
	<h1>Работа с очередями</h1>

	<table>
		<tr><td>Отправлять водителю диалог при переназначении его диспетчером в другую очередь</td>
			<td><input type="checkbox" name="s-queue_dialogs" value="1"
					<?= $S['queue_dialogs'] ? 'checked' : '' ?>
					class="ui" data-switch="queue-dialog-settings"></td></tr>
		<tr id="queue-dialog-settings"><td>Время диалога о смене очереди</td>
			<td><input size="2" name="s-queue_dialog_time"
				value="<?= $S['queue_dialog_time'] ?>"> с</td></tr>
		<tr><td>Восстанавливать водителя в очереди при отправке им сообщений «неадекватный клиент», «клиент не вышел»</td>
			<td><?= HTMLSnippets::checkbox( 's-restore_queues', $S['restore_queues'], 1 ) ?></td></tr>
	</table>
</section>
<section>
	<h1>Чат</h1>

	<table>
		<tr><td>Быстрые сообщения для водителей (каждое с новой строки)</td>
			<td><textarea name="s-phrases_driver"><?= htmlspecialchars( $S['phrases_driver'] ) ?></textarea></td>
		</tr>
		<tr><td>Быстрые сообщения для диспетчеров (каждое с новой строки)</td>
			<td><textarea name="s-phrases_dispatcher"><?= htmlspecialchars( $S['phrases_dispatcher'] ) ?></textarea></td>
		</tr>
	</table>
</section>
</div>
<button type="submit">Сохранить</button>
</form>

<?php _footer(); ?>
