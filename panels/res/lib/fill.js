"use strict";

var fills = {
	"promise.js": [typeof window.Promise != "undefined"],
	"string-repeat.js": [typeof String.prototype.repeat != "undefined"]
}

for( var path in fills ) {
	var tests = fills[path];
	for( var i = 0; i < tests.length; i++ ) {
		if( !tests[i] ) {
			console.log( path );
			load( path );
			break;
		}
	}
}

function load( path ) {
	document.write( '<script src="/res/lib/fill/'+path+'"></sc' + 'ript>' );
}

