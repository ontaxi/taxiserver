<?php _header(); ?>
<?php
$sid = sid();
$customer_id = argv(1);
$customer = new customer( $customer_id, 'phone, name, blacklist, comments, service_id' );

if( $customer->service_id() != $sid ) {
	error_notfound();
}

$orders = taxi::customer_orders( $sid, $customer_id );

$table = new Table();
foreach( $orders as $order )
{
	$status = orders::get_status_name( $order['status'] );

	if( $order['status'] == orders::STATUS_CANCELLED )
	{
		if( $order['cancel_reason'] ) {
			$status .= ' ('.$order['cancel_reason'].')';
		}
	}
	$table->add_row( array(
		'date' => date( 'd.m.Y', strtotime( $order['time_created'] ) ),
		'address' => $order['src_addr'],
		'status' => $status
	));
}
?>

<h1><?= $customer->phone() ?></h1>

<form method="post" action="<?= aurl( 'save_customer' ) ?>">
	<input name="customer_id" value="<?= $customer_id ?>" type="hidden">
	<div>
		<label>Имя</label>
		<input name="name" value="<?= $customer->name() ?>">
	</div>
	<div>
		<input type="checkbox" id="cb-blacklist" name="blacklist"
			value="1"<?= $customer->blacklist()? ' checked' : '' ?>>
		<label for="cb-blacklist">Чёрный список</label>
	</div>
	<div>
		<label>Комментарии</label>
		<textarea name="comments"><?= $customer->comments() ?></textarea>
	</div>
	<button type="submit">Сохранить</button>
</form>

<?php
$n = count( $orders );

if( $n > 0 )
{
	?><h2>Заказы</h2>
	<?= $table ?><?php
}
?>
<?php _footer(); ?>
