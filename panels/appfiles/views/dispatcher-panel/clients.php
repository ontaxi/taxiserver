<?php _header(); ?>

<?php
$service_id = sid();

$name = vars::get( 'name' );
$phone = vars::get( 'phone' );

if( $name || $phone ) {
	$clients = taxi::find_customers( $service_id, $name, $phone, 0, 1e5 );
	$t = clients_table( $clients );
} else {
	$t = null;
}

function clients_table( $clients )
{
	$t = new table(array(
		'id' => '№',
		'phone' => 'Номер телефона',
		'name' => 'Имя'
	));
	foreach( $clients as $c )
	{
		$t->add_row(array(
			'id' => $c['customer_id'],
			'phone' => sprintf( '<a href="%s">%s</a>',
				url( 'customer '.$c['customer_id'] ), $c['phone'] ),
			'name' => alt( $c['name'], 'Не указано' )
		));
	}
	return $t;
}

?>

<h1>Клиенты</h1>

<form>
	<div>
		<label>Имя</label>
		<input name="name" value="<?= $name ?>">
	</div>
	<div>
		<label>Телефон</label>
		<input name="phone" value="<?= $phone ?>">
	</div>
	<button type="submit">Поиск</button>
</form>

<?= $t ?>

<?php _footer(); ?>
