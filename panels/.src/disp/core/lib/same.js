var same = (function() {

	function same( v1, v2 )
	{
		if( v1 === v2 ) {
			return true;
		}
		if( typeof v1 != typeof v2 ) {
			return false;
		}
		if( Array.isArray( v1 ) ) {
			return arrSame( v1, v2 );
		}
		if( typeof v1 == "object" ) {
			return objSame( v1, v2 );
		}
		return false;
	}

	function arrSame( a1, a2 )
	{
		var n = a1.length;
		if( n != a2.length ) {
			return false;
		}
		for( var i = 0; i < n; i++ ) {
			if( !same( a1[i], a2[i] ) ) {
				return false;
			}
		}
		return true;
	}

	function objSame( o1, o2 )
	{
		for( var k in o1 ) {
			if( !(k in o2) ) {
				return false;
			}
			if( !same( o1[k], o2[k] ) ) {
				return false;
			}
		}
		for( var k in o2 ) {
			if( !(k in o1) ) {
				return false;
			}
		}
		return true;
	}

	return same;
})();
