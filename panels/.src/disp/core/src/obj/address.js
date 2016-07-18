function Address( data )
{
	this.place = '';
	this.street = '';
	this.house = '';
	this.building = '';
	this.entrance = '';
	this.apartment = '';

	for( var k in data ) {
		this[k] = data[k];
	}
}

Address.prototype.format = function()
{
	var s = this.street;
	if( this.house && this.house != '' )
	{
		s += ", д." + this.house;
		if( this.building && this.building != '' ){
			s += " к. " + this.building;
		}
		if( this.entrance && this.entrance != '' ){
			s += ", под. " + this.entrance;
		}
		if( this.apartment && this.apartment != '' ) {
			s += ", кв. " + this.apartment;
		}
	}
	return s;
};

Address.prototype.isEmpty = function()
{
	return this.place == "" || this.street == "";
};

window.Address = Address;
