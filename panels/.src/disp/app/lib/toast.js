function toast( text )
{
	var $t = $( '<div class="w-toast">' + text + '</div>' );
	$t.css({
		"position": "fixed",
		"bottom": "10%"
	});
	$t.hide();
	$t.appendTo( "body" );
	$t.fadeIn( "fast" );

	var w = ($( window ).width() - $t.outerWidth())/2;
	$t.css( "left", w + "px" );

	setTimeout( function() {
		$t.fadeOut();
	}, 2000 );

	setTimeout( function() {
		$t.remove();
	}, 3000 );
}
