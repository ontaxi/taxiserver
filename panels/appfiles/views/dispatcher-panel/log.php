<?php _header(); ?>

<?php
require_script( 'res/lib/html5-forms.js' );

$service_id = sid();

$t1 = Vars::get( 'time-from' );
if( $t1 ) $t1 = strtotime( $t1 );
else $t1 = time() - 3600;

$t2 = Vars::get( 'time-to' );
if( $t2 ) $t2 = strtotime( $t2 );
else $t2 = time();

set_page_title( 'Архив журнала' );
?>

<h1>Архив журнала</h1>

<form action="<?= url( 'log' ) ?>">
<label>От</label>
<input type="datetime-local" name="time-from" step="any"
	value="<?= input_datetime( $t1 ) ?>">
<label>До</label>
<input type="datetime-local" name="time-to" step="any"
	value="<?= input_datetime( $t2 ) ?>">
<button type="submit">Показать</button>
</form>

<?php
$messages = service_logs::get_messages( $service_id, $t1, $t2 );
echo '<p>', implode( '</p><p>', array_column( $messages, 'text' ) ), '</p>';
?>

<?php _footer(); ?>
