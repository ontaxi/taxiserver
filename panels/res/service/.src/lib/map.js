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
