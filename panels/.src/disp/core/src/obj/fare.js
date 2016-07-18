function Fare( data )
{
	var spec = {
		"name": "str",
		"minimal_price": "int",
		"start_price": "int",
		"kilometer_price": "int",
		"slow_hour_price": "int"
	};

	assertObj( data, spec );

	for( var k in spec ) this[k] = data[k];
}

Fare.prototype.price = function( distance )
{
	var price = this.start_price + distance / 1000 * this.kilometer_price;
	if( price < this.minimal_price ) {
		price = this.minimal_price;
	}
	return price;
};
