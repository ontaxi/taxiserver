function DX( baseUrl )
{
	/*
	 * RTT estimation and time of the last request.
	 */
	var rtt = 0;
	var t = 0;

	this.RTT = function() { return rtt; }

	this.get = function( path, args )
	{
		var url = baseUrl + '/' + path;
		if( args ) {
			url += argString( args );
		}
		t = Date.now();
		return http.get( url ).then( check );
	};

	this.post = function( path, data )
	{
		var url = baseUrl + '/' + path;
		t = Date.now();
		return http.post( url, data ).then( check );
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
		rtt = Date.now() - t;
		if( data.errno ) {
			throw data.errstr;
		}
		return data.data;
	}
}
