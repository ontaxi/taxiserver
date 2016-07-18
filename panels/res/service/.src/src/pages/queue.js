pageFunc( "queue", function()
{
	var address = new AddressInput( '' );
	var pos = new CoordsInput( '' );
	pos.disable();
	var map = initMap();

	var $radius = $( 'input[name="radius"]' );
	var circle = L.circle( [0, 0], $radius.val() );

	$radius.on( 'change', showQueue );
	showQueue();

	/*
	 * When address is edited, request and apply new coordinates.
	 */
	address.onChange( function()
	{
		var addr = this.get();
		hideQueue();
		mapdata.getAddressBounds( addr, function(bounds)
		{
			if( !bounds ) return;
			pos.set( [bounds.lat, bounds.lon] );
			showQueue();
		});
	});

	/*
	 * When map is clicked, apply the coordinates and refresh the
	 * address.
	 */
	map.addEventListener( "click", function( event )
	{
		var lat = event.latlng.lat;
		var lon = event.latlng.lng;
		pos.set( [lat, lon] );
		showQueue();
		address.set( {} );
		mapdata.getPointAddress( lat, lon, function( addr )
		{
			if( typeof addr.address_street == "undefined" ) {
				return;
			}
			var addr = {
				place: addr.address_place,
				street: addr.address_street,
				house: addr.address_house,
				building: addr.address_building
			};
			address.set( addr );
		});
	});

	function showQueue()
	{
		var coords = pos.get();
		if( !coords ) {
			hideQueue();
			return;
		}

		var lat = coords[0];
		var lon = coords[1];
		map.setMarker( 'parking', lat, lon );
		pos.set( [lat, lon] );
		circle.addTo( map.leaflet );
		circle.setLatLng( coords );
		circle.setRadius( $radius.val() );
	}

	function hideQueue() {
		map.removeMarker( 'queue' );
		map.leaflet.removeLayer( circle );
	}
});
