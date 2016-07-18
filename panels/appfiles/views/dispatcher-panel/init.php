<?php

if( user::get_type() != 'dispatcher' && argv(0) != 'login' ) {
	redirect( url_t( 'login' ) );
}

if( user::get_type() ) {
	$loc_id = DB::getValue( "SELECT loc_id FROM taxi_dispatchers
		WHERE acc_id = %d", user::get_id() );
	if( $loc_id ) {
		redirect( url_t( 'dispatcher-local:' ) );
	}
}
?>
