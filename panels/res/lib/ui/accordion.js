"use strict";

$.fn.accordion = function()
{
	return this.each( function()
	{
		var $t = $( this );
		$t.addClass( 'accordion-section' );
		
		var $header = $t.find( "h1" );
		$header.addClass( "accordion-header" );
		
		var $contents = $header.siblings();
		var $container = $( '<div class="accordion-container"></div>' );
		$container.insertAfter( $header ).append( $contents );
		$container.hide();
		$header.click( function()
		{
			$header.toggleClass( "accordion-open" );
			$container.slideToggle();
		});
	});
};