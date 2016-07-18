/*
	Compilation date: 2016-05-14
	Number of files: 15
*/
(function() {
"use strict";

// lib/args.js
(function()
{
	/*
	 * Get the URL from the last loaded script element.
	 */
	var S = document.getElementsByTagName( 'script' );
	var url = S[S.length-1].getAttribute( 'src' );

	/*
	 * Parse the query string.
	 */
	var args = {};
	var pos = url.indexOf( '?' );
	if( pos >= 0 )
	{
		var parts = url.substr( pos + 1 ).split( '&' );
		for( var i = 0; i < parts.length; i++ )
		{
			var kv = parts[i].split( '=' );
			args[kv[0]] = kv[1];
		}
	}

	window.scriptArgs = function() {
		return args;
	};
})();


// lib/autocomplete.js
"use strict";
(function(){

/*
 * optionsFunction is a function taking entered term and returning
 * corresponding array of suggestions.
 */
$.fn.autocomplete = function( optionsFunction, acceptCallback )
{
	return this.each( function() {
		initAutocomplete.call( this, optionsFunction, acceptCallback );
	});
};

function List( $input, $list, optionsFunc, acceptCallback )
{
	this.$input = $input;
	this.$list = $list;
	this.func = optionsFunc;
	this.acceptCallback = acceptCallback;

	// Array of currently shown suggestions
	this.contents = [];
	this.contexts = [];

	// Currently highlighted suggestion
	this.selection = -1;

	// Previous value of the input
	this.prevValue = '';
}

/*
 * The main init function for a single input element.
 */
function initAutocomplete( optionsFunc, acceptCallback )
{
	var $input = $( this );
	var $list = buildList( $input );
	var list = new List( $input, $list, optionsFunc, acceptCallback );

	initInputEvents( list );
	initKeyboardEvents( list );
	initMouseEvents( list );
}

/*
 * Takes an input and returns the list for it.
 */
function buildList( $input )
{
	/*
	 * Disable the browser's autocompletion feature.
	 */
	$input.attr( "autocomplete", "off" );

	/*
	 * Create list element and insert it after the input.
	 */
	var $list = $( "<div class=\"autocomplete\"></div>" );
	$list.css( "position", "absolute" );
	$list.insertAfter( $input );
	$list.css( 'display', 'none' );

	/*
	 * Make sure that the input's and the list's parent has relative or
	 * absolute positioning.
	 */
	var $parent = $list.parent();
	var pos = $parent.css( 'position' );
	if( pos != 'absolute' && pos != 'relative' ) {
		$parent.css( 'position', 'relative' );
	}

	return $list;
}

function initInputEvents( list )
{
	/*
	 * Save the list variable in a closure.
	 */
	function oninput( event ) {
		updateInput( list );
	}

	/*
	 * If oninput is supported, use it.
	 */
	var inputEventSupported = ('oninput' in document.createElement( 'input' ) );
	if( inputEventSupported ) {
		list.$input.on( "input", oninput );
		return true;
	}

	/*
	 * Otherwise, do a trick with keyup.
	 */
	list.$input.on( "keyup", function( event )
	{
		if( event.keyCode >= 32 && event.keyCode <= 127 ){
			updateInput( list );
		}
	});
}

/*
 * Gets called whenever the associated input value is changed.
 */
function updateInput( list )
{
	var MIN_LENGTH = 1;

	var newValue = list.$input.val();

	/* If the value hasn't changed, don't do anything. */
	if( list.currentValue == newValue ) {
		return;
	}

	list.prevValue = list.currentValue;
	list.currentValue = newValue;

	if( list.currentValue < MIN_LENGTH ) {
		hideList( list );
		return;
	}

	/*
	 * Save the list variable in closure and call the suggestions
	 * function with it.
	 */
	var f = function( options, contexts ) {
		showSuggestions( list, options, contexts );
	}
	list.func.call( undefined, list.currentValue, f );
}

function hideList( list ) {
	list.$list.css( 'display', 'none' );
}

function showSuggestions( list, suggestions, contexts )
{
	var $list = list.$list;

	$list.empty();
	list.selection = -1;
	list.contents = suggestions;
	list.contexts = contexts;

	var container = createItems( suggestions );
	if( !container ) {
		hideList( list );
		return;
	}

	$list.append( container );
	$list.css( 'display', 'block' );
	alignList( list );
}

function createItems( suggestions )
{
	var n = suggestions.length;
	if( !n ) {
		return null;
	}

	var container = document.createElement( 'ul' );
	var s = '';
	for( var i = 0; i < n; i++ ) {
		s += '<li data-index="'+i+'">' + suggestions[i] + '</li>';
	}
	container.innerHTML = s;
	return container;
}

/*
 * Move list to the correct position relative to the input.
 */
function alignList( list )
{
	var $input = list.$input;
	var $list = list.$list;

	var offset = $input.position();
	var hmargin = $input.outerWidth(true) - $input.outerWidth();

	var left = offset.left + hmargin/2;
	var top = offset.top + $input.outerHeight();

	$list.css({
		"left": left + "px",
		"top": top + "px",
		"min-width": $input.outerWidth() + "px"
	})
}

function initKeyboardEvents( list )
{
	/* Event key codes. */
	var KEY_UP = 38;
	var KEY_DOWN = 40;
	var KEY_ENTER = 13;

	var $input = list.$input;
	var $list = list.$list;

	$input.on( 'keydown', onKeyPress );

	/*
	 * Processes key presses at the list.
	 */
	function onKeyPress( event )
	{
		if( !$list.is( ":visible" ) ) {
			return;
		}

		var index = list.selection;

		switch( event.keyCode )
		{
			case KEY_UP:
				selectItem( list, index - 1 );
				break;
			case KEY_DOWN:
				selectItem( list, index + 1 );
				break;
			case KEY_ENTER:
				acceptItem( list, index );
				break;
			default:
				return;
		}

		event.preventDefault();
		event.stopPropagation();
	}
}

function selectItem( list, index )
{
	var n = list.contents.length;
	var $list = list.$list;

	if( !n ) {
		return;
	}

	if( index < 0 ) {
		index = n-1;
	}
	else {
		index = index % n;
	}

	var $prev = $list.find( 'li' ).eq( list.selection );
	var $next = $list.find( 'li' ).eq( index );

	$prev.removeClass( 'selected' );
	$next.addClass( 'selected' );

	list.selection = index;
}

function acceptItem( list, index )
{
	var n = list.contents.length;
	if( index < 0 || index >= n ) {
		return;
	}
	var item = list.contents[index];
	if( list.acceptCallback )
	{
		var context;
		if( list.contexts ) {
			context = list.contexts[index];
		}
		else {
			context = null;
		}
		list.acceptCallback(context);
	}

	var $list = list.$list;

	var $el = $list.find( 'li' ).eq( index );
	list.$input.val( $el.html() ).trigger( 'change' );
	hideList( list );
}

function initMouseEvents( list )
{
	var $list = list.$list;

	/*
	 * Update selection when pointed by mouse.
	 */
	$list.on( 'mouseenter', 'li', function( event )
	{
		var index = $(this).data( 'index' );
		selectItem( list, index );
	});

	/*
	 * When a list entry is clicked, accept it.
	 */
	$list.on( "click", 'li', function( event )
	{
		var index = $(this).data( 'index' );
		acceptItem( list, index );
		event.stopPropagation();
	});

	/*
	 * When anything outside the list is clicked, hide the list.
	 */
	$( "body" ).on( 'click', function()
	{
		hideList( list );
	});
}

})();


// lib/dx.js
function DX( baseUrl )
{
	this.get = function( path, args )
	{
		var url = baseUrl + '/' + path;
		if( args ) {
			url += argString( args );
		}
		return Promise.resolve( $.get( url ) ).then( check );
	};

	this.post = function( path, data )
	{
		var url = baseUrl + '/' + path;
		return Promise.resolve( $.post( url, data ) ).then( check );
	};

	function argString( args )
	{
		var i = 0;
		var str = '';
		for( var k in args ) {
			str += (i > 0) ? '&' : '?';
			str += k + '=' + encodeURIComponent( args[k] );
			i++;
		}
		return str;
	}

	function check( data )
	{
		if( data.errno ) {
			throw data.errstr;
		}
		return data.data;
	}
}


// lib/http.js
(function()
{
	var requests = {};

	window.http = {};

	/*
	 * Creates url. "vars" is a dict with query vars. "base" can have
	 * variables in it too.
	 * Example: createURL( '/?v=json&b=mapdata', {p: bounds, lat: ...} )
	 */
	http.createURL = function( base, vars )
	{
		var url = base;
		var haveQ = url.indexOf( '?' ) != -1;

		for( var i in vars )
		{
			if( typeof vars[i] == "undefined" ) continue;

			if( !haveQ ) {
				url += '?';
				haveQ = true;
			} else {
				url += '&';
			}

			url += i + "=" + encodeURIComponent( vars[i] );
		}
		return url;
	};

	/*
	 * Makes a GET request with the given callback. If "reqname" is
	 * given and there is a request in progress with the same name, the
	 * older request is aborted.
	 */
	http.get = function( url, callback, reqname )
	{
		if( reqname && ( reqname in requests ) ) {
			requests[reqname].abort();
		}

		var req = $.get( url ).done( function( src, status, obj ) {
			if( src && typeof src.charAt != "undefined" ) {
				src = JSON.parse( src );
			}
			callback( src );
		} );

		if( reqname ) {
			requests[reqname] = req;
		}
		return req;
	};
})();


// lib/map.js
"use strict";
//
// Map widget.
// mapContainer should be a link to DOMElement
//
function Map( mapContainer )
{
	this.container = mapContainer;

	var minskCenter = new L.LatLng( 53.88937, 27.56401 );

	// Create the Leaflet instance.
	this.leaflet = L.map( mapContainer, {
		center: minskCenter,
		zoom: 11,
		zoomControl: false,
		attributionControl: false // hide credits
	});

	// Add a map layer to the Leaflet.
	var proto = location.protocol;
	if( proto == 'file:' ) {
		proto = 'https:';
	}
	var osm = new L.TileLayer(
		proto + "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			minZoom: 7, maxZoom: 18,
			attribution: "Map data © OpenStreetMap contributors"
		}
	);
	this.leaflet.addLayer(osm);

	this.markers = {};
}

Map.prototype.addZoomControl = function( pos ) {
	var settings = pos ? {position: pos} : {}
	L.control.zoom(settings).addTo( this.leaflet );
};

Map.prototype.panTo = function( latitude, longitude ){
	this.leaflet.panTo( [latitude, longitude] );
};

Map.prototype.moveMarker = function( markerName, lat, lon ){
	this.markers[markerName].setLatLng( [ lat, lon ] );
};

Map.prototype.setMarker = function( markerName, lat, lon, options )
{
	if( typeof this.markers[markerName] != "undefined" ){
		this.removeMarker( markerName );
	}

	if( typeof( options ) == "string" ){
		options = {
			"title": options
		};
	} else {
		options = options || {};
	}

	var leafletOptions = {};

	var leafletOptionNames = [ "title" ];
	for( var i = 0; i < leafletOptionNames.length; i++ )
	{
		var k = leafletOptionNames[i];
		if( options[k] ){
			leafletOptions[k] = options[k];
		}
	}

	if( options.icon ) {
		leafletOptions.icon = options.icon;
	}

	var pos = new L.LatLng( lat, lon );
	var marker = new L.Marker( pos, leafletOptions );
	marker.addTo( this.leaflet );

	if( options.tooltip ){
		marker.bindPopup( options.tooltip ).openPopup();
	}

	if( options.onclick ){
		marker.on( "click", options.onclick );
	}

	if( options.events ){
		for( var name in options.events ){
			marker.on( name, options.events[name] );
		}
	}

	this.markers[markerName] = marker;
	return marker;
};

Map.prototype.removeMarker = function( markerName )
{
	if( typeof this.markers[markerName] == "undefined" ){
		return;
	}
	this.leaflet.removeLayer( this.markers[markerName] );
	delete this.markers[markerName];
};

Map.prototype.removeMarkersByPrefix = function( prefix )
{
	for( var markerName in this.markers ) {
		if( markerName.indexOf( prefix ) == 0 ) {
			this.removeMarker( markerName );
		}
	}
};

Map.prototype.removeAllMarkers = function()
{
	for( var markerName in this.markers ){
		this.removeMarker( markerName );
	}
};

Map.prototype.getMarkersList = function()
{
	var list = [];
	for( var name in this.markers ){
		list.push( name );
	}
	return list;
};

Map.prototype.getMarkerCoordinates = function( name )
{
	if( !name in this.markers ){
		return null;
	}

	var m = this.markers[name];
	var c = m.getLatLng();
	return [ c.lat, c.lng ];
};

Map.prototype.setPath = function( points )
{
	if( typeof( this.path ) == "undefined" ){
		this.path = new L.polyline( points, { color: "blue" } );
		this.path.addTo( this.leaflet );
	}
	else {
		this.path.setLatLngs( points );
	}
};
Map.prototype.fitPath = function()
{
	this.leaflet.fitBounds( this.path.getBounds() );
};

Map.prototype.fitBounds = function( minLat, maxLat, minLon, maxLon )
{
	this.leaflet.fitBounds([
		[minLat, minLon],
		[maxLat, maxLon]
	]);
};

/*
 * Returns object {minLat, maxLat, minLon, maxLon}.
 */
Map.prototype.getBounds = function()
{
	var b = this.leaflet.getBounds();
	var nw = b.getNorthWest();
	var se = b.getSouthEast();

	return {
		minLat: se.lat,
		maxLat: nw.lat,
		minLon: nw.lng,
		maxLon: se.lng
	};
};

Map.prototype.addEventListener = function( type, listener )
{
	this.leaflet.on( type, listener );
};

Map.prototype.getZoom = function(){
	return this.leaflet.getZoom();
};

Map.prototype.setZoom = function( zoom ){
	this.leaflet.setZoom( zoom );
};


// lib/mapdata.js
/*
 * A set of calls for mapdata JSON.
 */
(function()
{
	var base = '/json/mapdata/';

	var mapdata = {};

	mapdata.setPrefix = function( p ) {
		base = p;
	};

	/*
	 * For clients expecting array output we need to extract the array
	 * (which is under the "list" property) before passing it along.
	 * This concerns all suggestion queries.
	 * // TODO: modify clients to not expect the list?
	 */
	function extractList( callback, data )
	{
		var list;
		if( !data || data.error != 0 || !data.list ) {
			list = [];
		}
		else {
			list = data.list;
		}
		callback( list );
	}

	/*
	 * Get address for the given point and call the callback with it.
	 */
	mapdata.getPointAddress = function( lat, lon, callback )
	{
		var url = base + "point_address/" + lat + "/" + lon + "/";
		return http.get( url, callback );
	};

	/*
	 * Get bounds for the given address. The bounds is an object with
	 * min_lat, max_lat, min_lon, max_lon, lat and lon parameters.
	 */
	mapdata.getAddressBounds = function( address, callback )
	{
		var url = base + "address_bounds/";
		var params = [
			address.place,
			address.street,
			address.house,
			address.building
		];
		var i = 0;
		while( params[i] && params[i] != "" ) {
			url += encodeURIComponent( params[i] ) + "/";
			i++;
		}

		return http.get( url, function( bounds )
		{
			if( bounds )
			{
				var K = ["lat", "lon", "min_lat", "min_lon", "max_lat", "max_lon"];
				for( var i = 0; i < K.length; i++ ) {
					var k = K[i];
					bounds[k] = parseFloat( bounds[k] );
				}
			}
			callback( bounds );
		});
	};

	/*
	 * Get list of place names having the given term in them.
	 */
	mapdata.getPlaceSuggestions = function( term, callback )
	{
		var url = base + "place_suggestions/"
			+ encodeURIComponent( term ) + "/";
		return http.get( url, extractList.bind( undefined, callback ) );
	};

	/*
	 * Get list of street names in the given place having the given term
	 * in them.
	 */
	mapdata.getStreetSuggestions = function( term, place, callback )
	{
		var url = base + "street_suggestions/"
			+ encodeURIComponent( place ) + "/"
			+ encodeURIComponent( term ) + "/";
		return http.get( url, extractList.bind( undefined, callback ) );
	};

	/*
	 * Get list of establishment names in the given place with the given
	 * term in them.
	 */
	mapdata.getEstablishmentSuggestions = function( term, place, callback )
	{
		var url = base + "establishment_suggestions/"
			+ encodeURIComponent( place ) + "/"
			+ encodeURIComponent( term ) + "/";
		return http.get( url, extractList.bind( undefined, callback ) );
	};

	window.mapdata = mapdata;
})();


// src/lib.js
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


// src/location-dispatch.js
function initLocationDispatch()
{
	/*
	 * Make stage selectors "behave".
	 */
	var $types = $( 'select[name^="dispatch_type"]' );
	var $queues = $( 'select[name^="dispatch_queue"]' );
	var $brigs = $( 'select[name^="dispatch_brig"]' );
	var $modes = $( 'select[name^="dispatch_mode"]' );

	var $checks = $();
	$( 'input[name^="dispatch_importance"]' ).each( function() {
		$checks = $checks.add( $(this).parent() );
	});

	function sync()
	{
		$types.each( function( i ) {

			var $b = $brigs.eq(i);
			var $q = $queues.eq(i);
			var $m = $modes.eq(i);
			var $c = $checks.eq(i);

			switch( this.value ) {
				case 'queue':
					$b.val('').hide();
					$q.show();
					$m.show();
					$c.show();
					break;
				case 'brigade':
					$b.show();
					$q.val('').hide();
					$m.val('').hide();
					$c.show();
					break;
				case 'all':
					$b.val('').hide();
					$q.val('').hide();
					$m.val('').hide();
					$c.show();
					break;
				default:
					$b.val('').hide();
					$q.val('').hide();
					$m.val('').hide();
					$c.find( 'input' ).attr( 'checked', false );
					$c.hide();

			}
		});
	}

	$types.on( 'change', sync );
	sync();
}


// src/main.js
var pageFunctions = {};

function pageFunc( page, func ) {
	pageFunctions[page] = func;
}

$(document).ready( function()
{
	var args = scriptArgs();
	var page = args.page;
	if( page in pageFunctions ) {
		pageFunctions[page]();
	}
});


// src/pages/checkpoint.js
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


// src/pages/driver.js
pageFunc( "driver", function()
{
	/*
	 * When login input is edited, check if the login is taken.
	 */
	var dx = new DX( '/dx/service' );

	var $login = $( 'input[name="login"]' );
	var $takenSign = $( '<span class="error">Занят</span>' );
	$takenSign.insertAfter( $login ).hide();

	$login.on( 'change', function()
	{
		$takenSign.hide();
		dx.get( 'login-taken', {type: 'driver', login: this.value} )
		.then( function( taken ) {
			if( taken ) {
				$takenSign.show();
			}
		});
	});
});


// src/pages/location.js
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


// src/pages/qaddr.js
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


// src/pages/queue.js
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


// src/pages/settings.js
pageFunc( "settings", function()
{
	var $city = $( '[name="s-default_city"]' );
	$city.autocomplete( mapdata.getPlaceSuggestions );
});

})();
