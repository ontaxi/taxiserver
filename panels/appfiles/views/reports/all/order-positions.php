<?php
set_page_title( "Маршрут заказа" );
$order_id = intval( vars::get( 'order_id' ) );
$service_id = sid();

if( $order_id )
{
	$order = new order( $order_id, 'service_id, `status`, taxi_id,
		time_created, time_finished' );

	if( $order->service_id() != $service_id
		|| $order->status() != 'finished'
		|| $order->taxi_id() == null
		|| $order->time_finished() == null )
	{
		error_notfound();
	}

	$driver_id = $order->taxi_id();
	$t1 = $order->utc( 'time_created' );
	$t2 = $order->utc( 'time_finished' );
}

show_form( $order_id );
if( $order_id ) {
	show_positions( $service_id, $driver_id, $t1, $t2 );
}

function show_form( $order_id )
{
	?>
	<form>
		<div>
			<label>Номер заказа</label>
			<input name="order_id" value="<?= $order_id ?>">
		</div>
		<div>
			<button type="submit">Показать</button>
		</div>
	</form>
	<?php
}

?>
