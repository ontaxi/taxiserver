pageFunc( "settings", function()
{
	var $city = $( '[name="s-default_city"]' );
	$city.autocomplete( mapdata.getPlaceSuggestions );
});
