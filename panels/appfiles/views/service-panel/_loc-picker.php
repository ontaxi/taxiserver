<label>Координаты</label>
<input name="<?= $coords_pref ?>latitude" value="<?= $coords[0] ?>" size="10">
<input name="<?= $coords_pref ?>longitude" value="<?= $coords[1] ?>" size="10">

<label>Город</label>
<input name="<?= $addr_pref ?>place" value="<?= $addr->place ?>">

<label>Улица</label>
<input name="<?= $addr_pref ?>street" value="<?= $addr->format_street() ?>">

<div class="columns compact">
	<div>
		<label>Дом</label>
		<input name="<?= $addr_pref ?>house" value="<?= $addr->house_number ?>" size="3">
	</div>
	<div>
		<label>Корпус</label>
		<input name="<?= $addr_pref ?>building" value="<?= $addr->house_building ?>" size="3">
	</div>
</div>
