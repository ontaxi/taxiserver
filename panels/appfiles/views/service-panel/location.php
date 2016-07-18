<?php _header(); ?>

<?php
require_script( 'res/service/pages.js?page=location' );
?>

<?php
$id = argv(1);
if( $id )
{
	$loc = new taxi_location( $id, '*' );
	?><h1>Объект &laquo;<?= $loc->name(); ?>&raquo;</h1><?php
}
else
{
	$loc = new taxi_location();
	?><h1>Новый объект</h1><?php
}

$aurl = aurl( 'save_location', url_t( 'locations' ) );
?>

<div class="columns">
	<div class="stdcol">
		<form method="post" action="<?= $aurl ?>">
			<input name="id" value="<?= $id ?>" type="hidden">
			<div class="ui-tabs">
				<?= template( 'templates/location-form', array( 'loc' => $loc ) ) ?>
			</div>
			<button type="submit">Сохранить</button>
		</form>
	</div>
	<div>
		<div id="map"></div>
	</div>
</div>

<?php _footer(); ?>
