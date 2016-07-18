function Car( data )
{
	var spec = {
		car_id: "int",
		name: "str",
		plate: "str",
		body_type: "str",
		color: "str"
	};
	assertObj( data, spec );

	for( var k in spec ) {
		this[k] = data[k];
	}

	this.id = this.car_id;
}

Car.prototype.bodyName = function()
{
	var bodies = {
		"sedan": "седан",
		"estate": "универсал",
		"hatchback": "хетчбек",
		"minivan": "минивен",
		"bus": "автобус"
	};

	if( this.body_type in bodies ) return bodies[this.body_type];
	return this.body_type;
};

Car.prototype.format = function()
{
	var parts = [
		this.name, this.color, this.bodyName(), this.plate
	].filter( hasValue );
	return parts.join( ', ' );
};
