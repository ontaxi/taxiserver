if( console && ("log" in console) ) {
	console.info( "debug.js is included" );
}

window.onerror = function()
{
	var s = '';
	for( var i = 0; i < arguments.length; i++ ) {
		s += arguments[i] + "\n";
	}
	alert( s );
};
