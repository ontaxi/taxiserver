<?php

function logmsg( $msg, $sid = null, $acc_id = null )
{
	debmsg( $msg );

	$ref = "";
	if( $sid ) $ref .= "@$sid";
	if( $acc_id ) $ref .= "#$acc_id";

	out( "$ref	$msg" );
}

?>
