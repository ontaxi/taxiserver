<?php
if( user::get_type() != 'service' && argv(0) != 'login' ) {
	redirect( url_t( 'login' ) );
}
?>
