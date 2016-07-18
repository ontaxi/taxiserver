<?php _header(); ?>

<?php
require_script( 'res/service/pages.js?page=checkpoint' );
?>

<?php
$id = argv(1);
$service_id = sid();
$qid = DB::getValue( "SELECT queue_id FROM taxi_queues
	WHERE loc_id = %d", $id );
if( $id )
{
	$loc = new taxi_location( $id, '*' );
	$qid = DB::getValue( "SELECT queue_id FROM taxi_queues
		WHERE loc_id = %d", $id );
	if( !$qid ) {
		error_notfound();
	}

	$queue = new taxi_queue( $qid, '*' );
	$b = point_addr( $queue->latitude(), $queue->longitude() );
	if( !$b ) $b = new address();
	?><h1>Контрольный объект &laquo;<?= $loc->name(); ?>&raquo;</h1><?php
}
else
{
	$loc = new taxi_location();
	$queue = new taxi_queue();
	$b = new address();
	?><h1>Новый контрольный объект</h1><?php
}

$aurl = aurl( 'save_checkpoint', url_t( 'locations' ), CURRENT_URL );
?>

<div class="columns">
	<div class="stdcol">
		<form method="post" action="<?= $aurl ?>">
			<input name="id" value="<?= $id ?>" type="hidden">
			<input name="qid" value="<?= $qid ?>" type="hidden">
			<div class="ui-tabs">
				<?= template( 'templates/location-form', array( 'loc' => $loc ) ) ?>
				<section>
					<h1>Очередь</h1>
					<fieldset>
						<legend>Адрес стоянки машин</legend>

						<div><small>(Правый щелчок на карте)</small></div>

						<?= template( '_loc-picker', array(
							'coords_pref' => 'b-',
							'addr_pref' => 'b-',
							'coords' => array( $queue->latitude(), $queue->longitude() ),
							'addr' => $b
						) ) ?>
					</fieldset>
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
