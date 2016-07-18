pageFunc( "checkpoint", function()
{
	var map = initMap();
	var pointPicker = new LocPicker( 'a-' );
	var parkingPicker = new LocPicker( 'b-' );

	pointPicker.onChange( showLoc );
	parkingPicker.onChange( showQueue );

	showLoc();
	showQueue();
	initLocationDispatch();

	map.addEventListener( "click", function( event )
	{
		var lat = event.latlng.lat;
		var lon = event.latlng.lng;
		pointPicker.setCoords( [lat, lon] );
		showLoc();
	});

	map.addEventListener( "contextmenu", function( event )
	{
		var lat = event.latlng.lat;
		var lon = event.latlng.lng;
		parkingPicker.setCoords( [lat, lon] );
		showQueue();
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

	function showQueue()
	{
		var coords = parkingPicker.getCoords();
		if( !coords ) {
			map.removeMarker( 'park' );
			return;
		}
		map.setMarker( 'park', coords[0], coords[1] );
	}
});
