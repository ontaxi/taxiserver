<?php _header(); ?>

<?php
require_script( 'res/service/pages.js?page=queue' );
?>

<?php
$qid = argv(1);
$service_id = sid();
if( $qid )
{
	$queue = new taxi_queue( $qid, '*' );
	$upstream = $queue->upstream();
	if( $queue->latitude() && $queue->longitude() ) {
		$addr = point_addr( $queue->latitude(), $queue->longitude() );
	} else $addr = null;

	if( !$addr ) {
		$addr = new address();
		$addr->place = service_settings::get_value( $service_id, 'default_city' );
	}
	if( $upstream ) {
		?><h1>Общая очередь &laquo;<?= $queue->name(); ?>&raquo;</h1><?php
	} else {
		?><h1>Очередь &laquo;<?= $queue->name(); ?>&raquo;</h1><?php
	}
}
else
{
	$upstream = vars::get( 'upstream' ) ? '1' : '0';
	$addr = new address();
	$addr->place = service_settings::get_value( $service_id, 'default_city' );
	$queue = new taxi_queue();
	if( $upstream ) {
		?><h1>Новая общая очередь</h1><?php
	} else {
		?><h1>Новая очередь</h1><?php
	}
}
?>

<div class="columns">
	<div class="stdcol">
<form method="post" action="<?= aurl( 'save_queue', url_t( 'queues' ) ) ?>">
	<input name="id" value="<?= $qid ?>" type="hidden">
	<input name="upstream" value="<?= $upstream ?>" type="hidden">

	<div class="ui-tabs">
		<section>
			<h1>Параметры</h1>
			<div>
				<label>Название</label>
				<input name="name" value="<?= $queue->name() ?>" required>
			</div>
			<div>
				<label>Порядковый номер</label>
				<input type="number" min="0" step="1" size="2"
					name="order" value="<?= alt( $queue->order(), 1 ) ?>">
			</div>
			<div>
				<label>Количество дежурных</label>
				<input type="number" min="0" step="1" max="9" size="2"
					name="min" value="<?= alt( $queue->min(), 0 ) ?>">
			</div>
			<fieldset>
				<legend>Доступ водителей</legend>
				<div>
					<label>Группы</label>
					<?php
					$selected = DB::getValues( "SELECT group_id
						FROM taxi_driver_group_queues
						WHERE queue_id = %d", $queue->id() );

					$groups = DB::getRecords( "SELECT group_id, name
						FROM taxi_driver_groups
						WHERE service_id = %d", $service_id );

					foreach( $groups as $g )
					{
						$id = $g['group_id'];
						$name = $g['name'];
						$checked = in_array( $id, $selected )? ' checked' : '';

						?><div>
							<input type="checkbox"<?= $checked ?>
								id="cb-group-<?= $id ?>"
								name="driver_groups[]"
								value="<?= $id ?>">
							<label for="cb-group-<?= $id ?>"><?= $name ?></label>
						</div>
						<?php
					}
					?>
				</div>
			</fieldset>
		</section>
		<section>
			<h1>Район действия</h1>

			<fieldset>
				<legend>Адрес стоянки машин</legend>

				<div><small>(Левый щелчок на карте)</small></div>

				<input name="latitude" value="<?= $queue->latitude() ?>">
				<input name="longitude" value="<?= $queue->longitude() ?>">

				<label>Город</label>
				<input name="place" value="<?= $addr->place ?>">
				<label>Улица</label>
				<input name="street" value="<?= $addr->format_street() ?>">
				<div class="columns compact">
					<div>
						<label>Дом</label>
						<input name="house" value="<?= $addr->house_number ?>" size="3">
					</div>
					<div>
						<label>Корпус</label>
						<input name="building" value="<?= $addr->house_building ?>" size="3">
					</div>
				</div>
				<div>
					<label>Радиус действия очереди при поиске по координатам</label>
					<input type="number" min="0" step="100" size="4"
						name="radius" value="<?= $queue->radius() ?>"> м
				</div>
			</fieldset>
			<?php if( $qid ): ?>
			<fieldset>
				<legend>Обслуживаемые адреса</legend>

				<a class="button" href="<?= url( 'qaddr '.$qid ) ?>">Добавить диапазон адресов</a>

				<?php
				$table = new Table();
				$ranges = taxi_queues::addr_ranges( $qid );
				foreach( $ranges as $range )
				{
					$edit_url = url( "qaddr $qid $range[range_id]" );
					$delete_url = aurl( 'delete_qaddr '.$range['range_id'] );
					$addr = "$range[street], дд. $range[min_house]&mdash;$range[max_house]";

					switch( $range['parity'] ) {
						case 'even': $pname = 'чётные'; break;
						case 'odd': $pname = 'нечётные'; break;
						default: $pname = '';
					}

					if( $pname != '' ) {
						$addr .= " $pname";
					}
					$table->add_row( array(
						'addr' => $addr,
						'edit' => '<a class="edit" href="'.$edit_url.'">Редактировать</a>',
						'delete' => '<a class="delete" href="'.$delete_url.'">Удалить</a>'
					));
				}
				echo $table;
				?>
			</fieldset>
			<?php endif; ?>

		</section>
		<section>
			<?php if( $upstream ): ?>
			<h1>Подчинённые очереди</h1>
			<div class="ui" data-placeholder="<p>Нет очередей</p>">
				<?php
				$queues = DB::getRecords("
					SELECT queue_id, name
					FROM taxi_queues
					WHERE service_id = %d
					AND upstream = 0",
					$service_id
				);
				$subqueues = DB::getValues("
					SELECT queue_id
					FROM taxi_queues
					WHERE parent_id = %d",
					$qid );
				foreach( $queues as $q )
				{
					$checked = in_array( $q['queue_id'], $subqueues );
					?>
					<div>
						<?= HTMLSnippets::labelled_checkbox( $q['name'],
						'sub_queues[]', $q['queue_id'], $checked ) ?>
					</div>
					<?php
				}
				?>
			</div>
			<div>
				<?php
				$modes = array(
					'found_first' => 'Начать с текущей',
					'first_first' => 'Начать с приоритетной'
				);
				?>
				<label>Порядок опроса</label>
				<?= HTMLSnippets::select( 'mode', $modes, $queue->mode(), null ) ?>
			</div>
			<?php else: ?>
				<h1>Общая очередь</h1>
				<?php
				$priority = $queue->priority();
				if( $priority === null ) $priority = 9;
				$upstreams = DB::getRecords( "SELECT queue_id, name
					FROM taxi_queues
					WHERE upstream = 1
					AND service_id = %d", $service_id );
				$upstreams = array_column( $upstreams, 'name', 'queue_id' );
				if( count( $upstreams ) > 0 ) {
					?>
					<div>
						<label>Общая очередь</label>
						<?= HTMLSnippets::select( 'parent_id', $upstreams, $queue->parent_id() ) ?>
					</div>
					<div>
						<label>Приоритет очереди в группе (0&dash;9)</label>
						<input type="number" min="0" max="9" step="1" size="2"
							name="priority" value="<?= $priority ?>">
					</div>
					<?php
				}
				?>
			<?php endif; ?>
		</section>
	</div>

	<button type="submit">Сохранить</button>
</form>
	</div>
	<div>
		<div id="map"></div>
	</div>
</div>

<?php _footer(); ?>
