"use strict";

$(document).ready( function()
{
	var $form = $( "#online-drivers-form" );
	var $button = $form.find( "button" );
	function sync()
	{
		$button.prop( "disabled", $form.find( 'input[type="checkbox"]:checked' ).length == 0 );
	}
	sync();
	$form.find( 'input[type="checkbox"]' ).on( "change", sync );
});