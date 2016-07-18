"use strict";

var http = (function()
{
	var http = {};

	/*
	 * Creates urls. "vars" is a dict with query vars. "base" can have
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

	http.get = function( url ) {
		return promise( $.get( url ) );
	};

	http.post = function( url, data ) {
		return promise( $.post( url, data ) );
	};

	/*
	 * Converts jQuery deferred/jqXHR/whatever-it's-called-now to a
	 * Promise object with additional 'abort' function.
	 */
	function promise( jp )
	{
		var p = new Promise( function( ok, fail )
		{
			jp.done( ok )
			.fail( function( jqr, status, error ) {
				if( error == "" ) error = status;
				fail( error );
			});
		});
		p.abort = function() {
			jp.abort();
		};
		return p;
	}

	return http;
})();
