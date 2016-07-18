/*
 * Comparison function for natural sort.
 */
function natcmp( a, b )
{
	var ok1 = a && typeof( a.match ) != "undefined";
	var ok2 = b && typeof( b.match ) != "undefined";

	if( !ok1 && !ok2 ) return 0;
	if( !ok1 ) return -1;
	if( !ok2 ) return 1;

	var p = /^(\d*)(.*?)$/;
	var ns1 = a.match( p );
	var ns2 = b.match( p );

	var isNum1 = ns1[1] != "";
	var isNum2 = ns2[1] != "";

	if( isNum1 && isNum2 ) {
		return parseInt( ns1[1] ) - parseInt( ns2[1] );
	}

	if( isNum1 ) return -1;
	if( isNum2 ) return 1;

	return ns1[2] > ns2[2];
}

function colsort( list, key ) {
	return list.sort( function( a, b ) {
		return a[key] - b[key];
	});
}

function natcolsort( list, key ) {
	return list.sort( function( a, b ) {
		return natcmp( a[key], b[key] );
	});
}
