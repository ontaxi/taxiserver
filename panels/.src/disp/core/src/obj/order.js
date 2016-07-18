function Order( data )
{
	if( !data ) data = {};

	if( !data.status ) {
		data.status = this.POSTPONED;
	}

	if( !data.order_uid ) {
		data.order_uid = fmt( "%d-%d", disp.id(), Date.now() );
	}

	if( "src" in data ) {
		this.src = {
			addr: new Address( data.src.addr ),
			loc_id: data.src.loc_id
		};
	}
	else {
		this.src = {
			addr: new Address(),
			loc_id: null
		};
	}

	if( data.dest && ("addr" in data.dest) ) {
		this.dest = {
			addr: new Address( data.dest.addr ),
			loc_id: data.dest.loc_id
		};
	}
	else {
		this.dest = null;
	}

	var orderFields = [
		'order_id',
		'order_uid',
		'owner_id',
		'taxi_id',
		'time_created',
		'exp_arrival_time',
		'reminder_time',
		'status',
		'comments',
		'customer_name',
		'customer_phone',
		'opt_vip',
		'opt_terminal',
		'opt_car_class'
	];

	for( var i = 0; i < orderFields.length; i++ )
	{
		var k = orderFields[i];
		this[k] = data[k];
	}
	this.id = this.order_uid;
}

Order.prototype.POSTPONED = 'postponed';
Order.prototype.DROPPED = 'dropped';
Order.prototype.WAITING = 'waiting';
Order.prototype.ASSIGNED = 'assigned';
Order.prototype.ARRIVED = 'arrived';
Order.prototype.STARTED = 'started';
Order.prototype.FINISHED = 'finished';
Order.prototype.CANCELLED = 'cancelled';

Order.prototype.statusName = function()
{
	var statusNames = {
		'postponed': 'отложен',
		'waiting': 'ожидание ответа',
		'dropped': 'не принят',
		'assigned': 'принят',
		'arrived': 'на месте',
		'started': 'выполняется',
		'finished': 'завершён',
		'cancelled': 'отменён'
	};

	var s = this.status;
	if( s == this.POSTPONED && !this.exp_arrival_time ) {
		s = 'waiting';
	}
	return statusNames[s] || this.status;
};

/*
 * Returns true if the order is closed.
 */
Order.prototype.closed = function()
{
	var s = this.status;
	return s == this.DROPPED || s == this.FINISHED || s == this.CANCELLED;
};

/*
 * Returns true if the order is postponed.
 */
Order.prototype.postponed = function()
{
	/*
	 * Status checking is not enough because all orders start with
	 * the "postponed" state. Those that are really postponed have
	 * the arrival time defined.
	 */
	return this.status == this.POSTPONED && this.exp_arrival_time;
};

/*
 * Returns true if the order's status allows changing the address and
 * options.
 */
Order.prototype.canEdit = function()
{
	return (this.status == this.POSTPONED
		|| this.status == this.DROPPED);
};

Order.prototype.formatOptions = function()
{
	var carTypes = {
		"ordinary": "седан или хэтчбек",
		"hatchback": "хетчбек",
		"sedan": "седан",
		"estate": "универсал",
		"bus": "автобус",
		"minivan": "минивен"
	};

	var parts = [];
	if( this.opt_terminal == '1' ) {
		parts.push( 'терминал' );
	}
	if( this.opt_car_class != '' ) {
		parts.push( carTypes[this.opt_car_class] || this.opt_car_class );
	}
	if( this.opt_vip == '1' ) {
		parts.push( 'VIP' );
	}
	return parts.join( ', ' );
};

Order.prototype.formatAddress = function()
{
	return this.src.addr.format();
};

Order.prototype.formatDestination = function()
{
	return this.dest.addr.format();
};

window.Order = Order;
