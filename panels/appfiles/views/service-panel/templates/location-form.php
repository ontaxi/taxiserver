<?php
if( $loc->latitude() && $loc->longitude() ) {
	$a = point_addr( $loc->latitude(), $loc->longitude() );
}
else {
	$a = new address();
	$a->place = service_settings::get_value( sid(), 'default_city' );
}
?>
<section>
	<h1>Обслуживаемый объект</h1>
	<div>
		<label>Название</label>
		<input name="name" value="<?= $loc->name() ?>" required>
	</div>
	<fieldset>
		<legend>Адрес</legend>

		<div><small>(Левый щелчок на карте)</small></div>

		<?= template( '_loc-picker', array(
			'coords_pref' => 'a-',
			'addr_pref' => 'a-',
			'coords' => array( $loc->latitude(), $loc->longitude() ),
			'addr' => $a
		) ) ?>
	</fieldset>
	<div>
		<?= HTMLSnippets::labelled_checkbox(
			"Показывать в отчётах",
			'do_reports',
			'1',
			$loc->do_reports()
		) ?>
	</div>
</section>
<section>
	<h1>Контактное лицо</h1>
	<div>
		<label>Номер телефона</label>
		<input type="tel" name="contact-phone"
			value="<?= $loc->contact_phone() ?>">
		<small>Пример: +375171234567</small>
	</div>
	<div>
		<label>Имя</label>
		<input name="contact-name" value="<?= $loc->contact_name() ?>">
	</div>
	<div>
		<label>Комментарии</label>
		<textarea name="comments"><?= $loc->comments() ?></textarea>
	</div>
</section>
<style>
#loc-dispatch-section select {
	min-width: 14em;
	display: block;
	counter-reset: stage-number;
}

#loc-dispatch-section .stage {
	counter-increment: stage-number;
	padding-left: 2em;
	position: relative;
	margin-bottom: 1.3em;
}

#loc-dispatch-section .stage:before {
	content: counter(stage-number);
	font-weight: bold;
	display: block;
	position: absolute;
	left: 0;
	top: 4px;
}
</style>
<section id="loc-dispatch-section">
	<h1>Рассылка заказов</h1>

	<?php
	$queues = DB::getRecords("
		SELECT queue_id, name
		FROM taxi_queues
		WHERE service_id = %d
		AND upstream = 0",
		sid()
	);
	$queues = array_column( $queues, 'name', 'queue_id' );

	$brigs = DB::getRecords( "
		SELECT group_id, name
		FROM taxi_driver_groups
		WHERE service_id = %d",
		sid()
	);
	$brigs = array_column( $brigs, 'name', 'group_id' );

	$stages = DB::getRecords( "
		SELECT ref_type, ref_id, `mode`, importance
		FROM taxi_location_dispatches
		WHERE loc_id = %d
		ORDER BY `order`",
		$loc->id()
	);
	$n = 5;
	while( count( $stages ) < $n ) {
		$stages[] = array(
			'ref_type' => null,
			'ref_id' => null,
			'mode' => 'sequential',
			'importance' => 0
		);
	}

	$types = array(
		'queue' => 'В очередь',
		'brigade' => 'В бригаду',
		'all' => 'Всем водителям'
	);

	$modes = array(
		'sequential' => 'Всем по очереди',
		'parallel' => 'Всем сразу',
		'first' => 'Только первому'
	);

	for( $i = 0; $i < $n; $i++ )
	{
		$st = $stages[$i];
		$qid = null;
		$brig_id = null;
		switch( $st['ref_type'] ) {
			case 'queue':
				$qid = $st['ref_id'];
				break;
			case 'brigade':
				$brig_id = $st['ref_id'];
				break;
		}
		?>
		<div class="stage">
			<?= HTMLSnippets::select( "dispatch_type-$i", $types, $st['ref_type'] ) ?>
			<?= HTMLSnippets::select( "dispatch_queue-$i", $queues, $qid ) ?>

			<?= HTMLSnippets::select( "dispatch_brig-$i", $brigs, $brig_id ) ?>

			<?= HTMLSnippets::select( "dispatch_mode-$i", $modes, $st['mode'] ) ?>

			<div>
			<?= HTMLSnippets::labelled_checkbox( 'Слать как обязательный',
				"dispatch_importance-$i", '1', $st['importance'] == '1' ) ?>
			</div>
		</div>
		<?php
	}
	?>
</section>
