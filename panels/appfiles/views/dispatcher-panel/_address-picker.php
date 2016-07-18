<div class="columns">
	<div>
		<?= HTMLSnippets::select(
			array(
				'name' => $picker_name.'_checkpoint_id',
				'class' => 'checkpoint'
			), $checkpoints_list, '', ''
		) ?><!--
		--><input name="<?= $picker_name ?>_establishment"
			placeholder="Объект" class="establishment">
	</div>
</div>
<div>
	<input name="<?= $picker_name ?>_place" value="<?= $place ?>"
		placeholder="Город"
		<?= ( $picker_name != 'dest' )? 'required' : '' ?>
		class="place"><!--
	--><input name="<?= $picker_name ?>_street" placeholder="Улица" class="street">
	<br>
	<input placeholder="дом" name="<?= $picker_name ?>_house"
		autocomplete="off" class="house"><!--
	--><input placeholder="корп." name="<?= $picker_name ?>_building"
		autocomplete="off" class="building"><!--
	--><input placeholder="под." name="<?= $picker_name ?>_entrance"
		autocomplete="off" class="entrance"><!--
	--><input placeholder="кв." name="<?= $picker_name ?>_apartment"
		autocomplete="off" class="apartment">
</div>
