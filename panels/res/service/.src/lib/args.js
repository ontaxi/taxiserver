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
