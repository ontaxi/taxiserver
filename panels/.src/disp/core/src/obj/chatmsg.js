function ChatMsg( data )
{
	var spec = {
		"id": "int",
		"text": "str",
		"from": "int",
		"to": "int?",
		"to_type": "str?",
		"utc": "int"
	};

	assertObj( data, spec );

	for( var k in spec ) this[k] = data[k];
}
