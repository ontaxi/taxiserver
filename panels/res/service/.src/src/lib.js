function initMap()
{
	var map = new Map( $( "#map" ).get(0) );
	$(window).on( 'resize', function() {
		map.leaflet.invalidateSize();
	});
	map.leaflet.invalidateSize();
	map.addZoomControl();
	return map;
}

function CoordsInput( prefix )
{
	/*
	 * e-7 gives distance uncertainty of 1 to 10 cm.
	 */
	var P = 7;

	var $lat = $( 'input[name="'+prefix+'latitude"]' );
	var $lon = $( 'input[name="'+prefix+'longitude"]' );

	this.set = function( coords )
	{
		var lat = coords[0];
		var lon = coords[1];
		$lat.val( lat.toFixed(P) );
		$lon.val( lon.toFixed(P) );
	};

	this.get = function()
	{
		var lat = parseFloat( $lat.val() );
		var lon = parseFloat( $lon.val() );
		if( !isNaN( lat ) && !isNaN( lon ) ) {
			return [lat, lon];
		}
		return null;
	};

	this.toString = function()
	{
		var coords = this.get();
		return (coords[0].toFixed(P) + "; " + coords[1].toFixed(P)).replace( /\./g, ',' );
	};

	this.disable = function()
	{
		$lat.add( $lon ).attr( 'readonly', true );
	};
}

function AddressInput( prefix )
{
	var $place = $( 'input[name="'+prefix+'place"]' );
	var $street = $( 'input[name="'+prefix+'street"]' );
	var $house = $( 'input[name="'+prefix+'house"]' );
	var $building = $( 'input[name="'+prefix+'building"]' );

	if( !$place.length || !$street.length || !$house.length || !$building.length ) {
		throw "No elements for addressInput prefix " + prefix;
	}

	var listeners = [];
	var _this = this;

	$place.autocomplete( function( term, callback ) {
		mapdata.getPlaceSuggestions( term, callback );
	});

	$street.autocomplete( function( term, callback ) {
		mapdata.getStreetSuggestions( term, $place.val(), callback );
	});

	this.onChange = listeners.push.bind( listeners );

	/*
	 * When anupper input is changed, clean lower ones.
	 */
	var stack = [$place, $street, $house, $building];
	stack.forEach( function( $input, i )
	{
		$input.on( 'change', function() {
			for( var j = i + 1; j < stack.length; j++ ) {
				stack[j].val('');
			}
		});
	});

	$place.add( $street ).add( $house ).add( $building )
	.on( 'change', function()
	{
		listeners.forEach( function( l ) {
			l.call( _this );
		});
	});

	this.set = function( addr )
	{
		$place.val( addr.place || '' );
		$street.val( addr.street || '' );
		$house.val( addr.house || '' );
		$building.val( addr.building || '' );
	};

	this.get = function( addr )
	{
		return {
			place: $place.val(),
			street: $street.val(),
			house: $house.val(),
			building: $building.val()
		};
	}
}

function LocPicker( prefix )
{
	var addressInput = new AddressInput( prefix );
	var coordsInput = new CoordsInput( prefix );
	coordsInput.disable();
	var listeners = [];
	var _this = this;

	addressInput.onChange( function()
	{
		var addr = this.get();
		mapdata.getAddressBounds( addr, function(bounds)
		{
			if( bounds ) {
				coordsInput.set( [parseFloat(bounds.lat), parseFloat(bounds.lon)] );
			}
			else {
				coordsInput.set( [0, 0] );
			}
			listeners.forEach( function( l ) {
				l.call( _this );
			});
		});
	});

	this.onChange = listeners.push.bind( listeners );

	this.setCoords = function( coords )
	{
		var lat = coords[0];
		var lon = coords[1];
		coordsInput.set( coords );
		addressInput.set( {} );
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
			addressInput.set( addr );
		});
	};

	this.getCoords = function()
	{
		return coordsInput.get();
	};
}
