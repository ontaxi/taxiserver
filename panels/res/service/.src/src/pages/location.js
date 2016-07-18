pageFunc( "location", function()
{
	var map = initMap();
	var pointPicker = new LocPicker( 'a-' );
	pointPicker.onChange( showLoc );
	showLoc();

	map.addEventListener( "click", function( event )
	{
		var lat = event.latlng.lat;
		var lon = event.latlng.lng;
		pointPicker.setCoords( [lat, lon] );
		showLoc();
	});

	function showLoc()
	{
		var coords = pointPicker.getCoords();
		if( !coords ) {
			map.removeMarker( 'loc' );
			return;
		}
		map.setMarker( 'loc', coords[0], coords[1] );
		map.panTo( coords[0], coords[1] );
	};

	initLocationDispatch();
});
