<?php

if( user::get_type() != 'dispatcher' && argv(0) != 'login' ) {
	redirect( url_t( 'dispatcher-panel:login' ) );
}

function loc_id() {
	return DB::getValue( "SELECT loc_id FROM taxi_dispatchers
		WHERE acc_id = %d", user::get_id() );
}

?>
