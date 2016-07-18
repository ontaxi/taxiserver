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
