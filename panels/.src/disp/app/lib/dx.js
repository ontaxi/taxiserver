function DX( baseUrl )
{
	this.get = function( path, args )
	{
		var url = baseUrl + '/' + path;
		if( args ) {
			url += argString( args );
		}
		return http.get( url ).then( check );
	};

	this.post = function( path, data )
	{
		var url = baseUrl + '/' + path;
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
		if( data.errno ) {
			throw data.errstr;
		}
		return data.data;
	}
}
