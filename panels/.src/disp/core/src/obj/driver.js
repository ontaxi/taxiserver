function Driver( data )
{
	var spec = {
		"driver_id": "int",
		"call_id": "str",
		"name": "str",
		"phone": "str",
		"car_id": "int?",
		"group_id": "int",
		"type_id": "int?",
		"is_fake": "int",
		"has_bank_terminal": "int",
		"is_online": "int",
		"block_until": "int",
		"block_reason": "str",
		"latitude": "flt",
		"longitude": "flt",
		"is_busy": "int"
	};
	assertObj( data, spec );
	for( var k in spec ) {
		this[k] = data[k];
	}
	this.id = this.driver_id;
}

Driver.prototype.surname = function()
{
	var pos = this.name.indexOf( ' ' );
	if( pos == -1 ) return this.name;
	return this.name.substr( 0, pos );
};

Driver.prototype.coords = function() {
	return [this.latitude, this.longitude];
};

Driver.prototype.online = function() {
	return this.is_online == 1;
};

Driver.prototype.blocked = function()
{
	return this.block_until > time.utc();
};

Driver.prototype.blockDesc = function()
{
	if( !this.blocked() ) {
		return '';
	}

	var msg = 'Заблокирован до ';

	var now = new Date();
	var release = new Date( time.local( this.block_until ) * 1000 );

	if( release.getDate() == now.getDate() ) {
		msg += formatTime( release.getTime() / 1000 );
	} else {
		msg += formatDateTime( release.getTime() / 1000 );
	}
	if( this.block_reason != '' ) {
		msg += ' (' + this.block_reason + ')';
	}
	return msg;
};

Driver.prototype.format = function()
{
	if( !this.name ) return this.call_id;

	var s = this.name;
	if( this.phone ) {
		s += ', тел. ' + formatPhone( this.phone );
	}
	return s;
};
