function Queue( data )
{
	var spec = {
		"queue_id": "int",
		"parent_id": "int?",
		"name": "str",
		"order": "int",
		"priority": "int",
		"min": "int",
		"latitude": "flt",
		"longitude": "flt",
		"loc_id": "int?"
	};
	assertObj( data, spec );

	for( var k in spec ) {
		this[k] = data[k];
	}

	this.id = data.queue_id;
}

Queue.prototype.coords = function() {
	return [this.latitude, this.longitude];
};
