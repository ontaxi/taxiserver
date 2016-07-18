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
