<?php
/*
 * Returns customer id by given phone number. Service id must be
 * given as services have separate records. If there is no such
 * phone number, null is returned. If name is given, then the record
 * is created or updated.
 *
 * Service id may by null, that means that the customer should be
 * considered as the site's customer.
 */
function get_customer_id( $service_id, $phone, $name = null )
{
	$phone = trim( $phone );
	if( $phone == "" ) return null;

	// Get the record by service id and phone number.
	$r = DB::getRecord( "SELECT customer_id, name
		FROM taxi_customers
		WHERE service_id = %d AND phone = '%s'",
		$service_id, $phone
	);

	// If no such record, create a new one and return its id.
	if( !$r )
	{
		return DB::insertRecord( 'taxi_customers', array(
			'service_id' => $service_id,
			'phone' => $phone,
			'name' => alt( $name, '' )
		));
	}

	// If given name is not as in the record, update the record.
	if( $name && $r['name'] != $name )
	{
		DB::updateRecord( 'taxi_customers',
			array( 'name' => $name ),
			array( 'customer_id' => $r['customer_id'] )
		);
	}
	return $r['customer_id'];
}

?>
