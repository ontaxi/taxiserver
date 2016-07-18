<?php _header(); ?>

<?php
$sid = sid();
$id = argv(1);
$dispatcher = new taxi_account( $id );
$login = $dispatcher->login();
if( $id ) {
	$loc_id = DB::getValue( "SELECT loc_id FROM taxi_dispatchers
		WHERE acc_id = %d", $id );
} else {
	$loc_id = null;
}
$aurl = aurl( 'save_dispatcher', url_t( 'dispatchers' ), CURRENT_URL );
?>

<h1>Диспетчер</h1>

<form method="post" enctype="multipart/form-data" action="<?= $aurl ?>">
	<input type="hidden" name="id" value="<?= $id ?>">

	<div class="ui-tabs">
		<section>
			<h1>Системные данные</h1>
			<table>
			<?= template( 'templates/account-subform',
				array( 'acc' => $dispatcher ) ) ?>
			<tr>
				<td>Привязка к объекту</td>
				<td>
					<?php
					$locs = DB::getRecords( "SELECT
						loc.loc_id, loc.name
						FROM taxi_queues q
						JOIN taxi_locations loc USING (loc_id)
						WHERE q.service_id = %d", $sid );
					$locs = array_column( $locs, 'name', 'loc_id' );
					echo HTMLSnippets::select( 'loc_id', $locs, $loc_id );
					?>
				</td>
			</tr>
			</table>
		</section>
		<section>
			<h1>Личные данные</h1>
			<table>
			<tr>
				<td><label>Имя</label></td>
				<td><input name="i-name" value="<?= $dispatcher->name() ?>">
				<?php if( !$id ) {
					?><small>Пример: Агафонов В. А.</small><?php
				}?></td>
			</tr>
			<tr>
				<td><label>День рождения</label></td>
				<td><input name="birth_date" type="date" value="<?= $dispatcher->birth_date() ?>"></td>
			</tr>
			<tr>
				<td><label>Фотография</label></td>
				<td>
				<?php
				if( $dispatcher->photo() ) {
					echo HTMLSnippets::image( image_src( $dispatcher->photo(), 200, 200 ) );
				}
				?>
				<input name="photo" type="file" accept="image/jpeg,image/png">
				</td>
			</tr>
			</table>
		</section>
	</div>
	<button type="submit">Сохранить</button>
</form>


<?php _footer(); ?>
