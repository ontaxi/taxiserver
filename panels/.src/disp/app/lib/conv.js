function toInt( val )
{
	if( typeof val == "string" ) {
		return parseInt( val, 10 );
	}
	return val;
}

/*
 * Tells whether the given value is non-empty.
 */
function hasValue( val )
{
	if( !val ) return false;
	while( val.length && val.charAt(0) == ' ' ){
		val = val.substr(1);
	}
	return val != '';
}
