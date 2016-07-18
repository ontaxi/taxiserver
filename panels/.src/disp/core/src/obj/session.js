function Session( data )
{
	var spec = {
		"session_id": "int",
		"driver_id": "int",
		"car_id": "int",
		"time_started": "int"
	};
	assertObj( data, spec );

	for( var k in spec ) {
		this[k] = data[k];
	}

	this.id = this.session_id;
}
