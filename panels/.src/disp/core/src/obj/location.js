function Location( data )
{
	var spec = {
		"loc_id": "int",
		"name": "str",
		"contact_phone": "str?",
		"contact_name": "str?",
		"addr": "",
		"latitude": "flt",
		"longitude": "flt",
		"queue_id": "int?"
	};

	for( var k in spec ) this[k] = data[k];

	this.id = data.loc_id;

	this.coords = function() {
		return [this.latitude, this.longitude];
	};
}
