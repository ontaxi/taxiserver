pageFunc( "qaddr", function()
{
	var $place = $( '[name="city"]' );
	var $street = $( '[name="street"]' );

	$place.autocomplete( function( term, callback ) {
		mapdata.getPlaceSuggestions( term, callback );
	});

	$street.autocomplete( function( term, callback ) {
		mapdata.getStreetSuggestions( term, $place.val(), callback );
	});
});
