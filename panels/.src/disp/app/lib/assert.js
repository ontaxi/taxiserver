function assert( val, msg, obj )
{
	if( val ) return;
	if( !msg ) msg = "assertion failed";
	console.error( msg, obj );
	throw msg;
}

function assertObj( obj, fields )
{
	assert( obj, "assertObj: given object is " + obj, obj );

	for( var k in fields )
	{
		assert( k in obj, "no field '" + k + "'", obj );
		var type = fields[k];
		assert( typeMatch( obj[k], type ),
			"field '"+k+"' has wrong type ("+(typeof obj[k])+")" );
	}
}

function typeMatch( val, type )
{
	if( type == '' ) return true;

	var nullOk;
	if( type.substr( -1 ) == "?" ) {
		nullOk = true;
		type = type.substring( 0, type.length - 1 );
	}
	else {
		nullOk = false;
	}

	if( val === null && nullOk ) {
		return true;
	}

	switch( type )
	{
		case "str":
			return typeof val == "string";
		case "flt":
			return typeof val == "number";
		case "int":
			return typeof val == "number" && Math.round( val ) == val;
		default:
			throw new Error( "typeMatch: unknown type " + type );
	}
}
