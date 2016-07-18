<?php _header(); ?>

<?php
require_script( 'res/service/pages.js?page=qaddr' );
?>

<?php
$queue_id = argv(1);
if( !$queue_id ) {
	error_notfound();
}

$range_id = argv(2);
$range = new qaddr_range( $range_id );
$aurl = aurl( 'save_qaddr', url_t( 'queue '.$queue_id ), CURRENT_URL );

$data = alt( action_data( 'save_qaddr' ), array() );
if( !$range_id ) {
	$range->city( @$data['city'] );
	$range->street( @$data['street'] );
	$range->min_house( @$data['min_house'] );
	$range->max_house( @$data['max_house'] );
	$range->parity( @$data['parity'] );
}
?>

<form method="post" action="<?= $aurl ?>">
	<input type="hidden" name="qid" value="<?= $queue_id ?>">
	<input type="hidden" name="id" value="<?= $range_id ?>">
	<div>
		<label>Город</label>
		<input name="city" value="<?= $range->city() ?>" required>
	</div>
	<div>
		<label>Улица</label>
		<input name="street" value="<?= $range->street() ?>" required>
	</div>
	<div>
		<label>Дома</label>
		<input type="number" size="3" min="1" step="1"
			name="min_house" value="<?= $range->min_house() ?>" required> &mdash;
		<input type="number" size="3" min="1" step="1"
			name="max_house" value="<?= $range->max_house() ?>" required>
		<?= HTMLSnippets::radio( 'parity', array( 'none' => 'Все', 'even' => 'Чётные', 'odd' => 'Нечётные' ), alt( $range->parity(), 'none' ) ) ?>
	</div>
	<button type="submit">Сохранить</button>
</form>

<?php _footer(); ?>
