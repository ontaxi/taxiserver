<h1>Калькулятор</h1>

<label>Тариф</label>
<?= HTMLSnippets::select( array(
	'id' => 'i-calc-group'
), fares::get_service_fares_kv( $service_id ), null, null ) ?>
<div class="columns">
	<div>
		<fieldset>
			<legend>Откуда</legend>
			<div>
				<label>Населённый пункт</label>
				<input id="i-calc-from-place" placeholder="Название пункта" value="<?= $place ?>">
			</div>
			<div>
				<label>Объект</label>
				<input id="i-calc-from-object">
			</div>
			<div>
				<label>Улица</label>
				<input id="i-calc-from-street" placeholder="Улица">
			</div>
			<div>
				<label>Дом, корпус</label>
				<input placeholder="дом" size="3"
					id="i-calc-from-house" autocomplete="off"><!--
				--><input placeholder="корп." size="3"
					id="i-calc-from-building" autocomplete="off">
			</div>
		</fieldset>
	</div>
	<div>
		<fieldset>
			<legend>Куда</legend>
			<div>
				<label>Населённый пункт</label>
				<input id="i-calc-to-place" placeholder="Название пункта" value="<?= $place ?>">
			</div>
			<div>
				<label>Объект</label>
				<input id="i-calc-to-object">
			</div>
			<div>
				<label>Улица</label>
				<input id="i-calc-to-street" placeholder="Улица">
			</div>
			<div>
				<label>Дом, корпус</label>
				<input placeholder="дом" size="3"
					id="i-calc-to-house" autocomplete="off"><!--
				--><input placeholder="корп." size="3"
					id="i-calc-to-building" autocomplete="off">
			</div>
		</fieldset>
	</div>
</div>
<div class="results">
	<button type="button" id="calc-button">Рассчитать</button>
	<span id="calc-results"></span>
</div>
<div class="map"></div>	