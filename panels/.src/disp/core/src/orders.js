function initOrders( conn, listeners, data )
{
	var _this = this;
	var orders = {};
	var orderPromises = {};
	var MAX_AGE = 12 * 3600 * 1000;

	initLists();
	setInterval( cleanOrders, 10000 );
	//setInterval( checkReminders, 1000 );

	//--

	function initLists()
	{
		var now = time.utc();

		data.recent_orders.forEach( function( d )
		{
			assertObj( d, {
				"order_uid": "str",
				"owner_id": "int",
				"taxi_id": "int?",
				"time_created": "int",
				"exp_arrival_time": "int?",
				"reminder_time": "int?",
				"status": "str",
				"src": "",
				"dest": "",
				"comments": "str",
				"customer_name": "str",
				"customer_phone": "str",
				"opt_car_class": "str",
				"opt_vip": "int",
				"opt_terminal": "int"
			});
			var o = new Order( d );
			/*
			 * If the order is closed and is too old, don't even add
			 * it.
			 */
			if( o.closed() && now - o.time_created >= MAX_AGE ) {
				return;
			}
			orders[o.id] = o;
		});
	}

	/*
	 * Remove all closed orders that are older than MAX_AGE.
	 */
	function cleanOrders()
	{
		var keys = [];
		var now = time.utc();
		for( var id in orders )
		{
			var order = orders[id];
			if( !order.closed() ) continue;
			if( now - order.time_created < MAX_AGE ) continue;
			keys.push( id );
		}
		if( !keys.length ) return;

		keys.forEach( function( id ) {
			var order = orders[id];
			listeners.call( "order-removed", {order: order} );
			delete orders[id];
		});
	}

	//--

	/*
	 * Save order in the "postponed" state.
	 */
	this.saveOrder = function( order )
	{
		var data = obj.subset( order, [
			'order_uid',
			'exp_arrival_time',
			'reminder_time',
			'src',
			'dest',
			'comments',
			'customer_name',
			'customer_phone',
			'opt_car_class',
			'opt_vip',
			'opt_terminal',
			'call_id'
		]);
		return conn.send( 'save-order', data );
	};

	/*
	 * Tells the server to dispatch the order to drivers.
	 */
	this.sendOrder = function( order, driver_id )
	{
		var order_uid = order.order_uid;
		if( typeof driver_id == "undefined" ) {
			driver_id = null;
		}

		var p = conn.send( "send-order", {
			order_uid: order_uid,
			driver_id: driver_id
		});
		/*
		 * If the command succeeds, create a new promise that will be
		 * resolved later and return it.
		 */
		p = p.then( function( val )
		{
			var h = {};
			h.promise = new Promise( function( ok, fail ) {
				h.ok = ok;
				h.fail = fail;
			});
			orderPromises[order_uid] = h;
			return h.promise;
		});

		return p;
	};

	this.cancelOrder = function( uid, reason ) {
		return conn.send( "cancel-order", {
			order_uid: uid,
			reason: reason
		});
	};

	conn.onMessage( "order-created", function( msg )
	{
		var data = msg.data;
		var uid = data.order_uid;
		var o = new Order( data );

		if( uid in orders )
		{
			/*
			 * Copy data to the existing order.
			 */
			for( var k in o ) {
				orders[uid][k] = o[k];
			}
			listeners.call( "order-changed", {order: orders[uid]} );
		}
		else
		{
			orders[uid] = o;
			listeners.call( "order-added", {order: o} );
		}
	});

	var statuses = {
		"taxi-arrived": Order.prototype.ARRIVED,
		"order-started": Order.prototype.STARTED,
		"order-finished": Order.prototype.FINISHED,
		"order-cancelled": Order.prototype.CANCELLED,
		"order-accepted": Order.prototype.ASSIGNED,
		"order-dropped": Order.prototype.DROPPED
	};

	for( var msgname in statuses ) {
		conn.onMessage( msgname, updateOrder );
	}

	function updateOrder( msg )
	{
		var uid = msg.data.order_uid;
		var order = orders[uid];
		if( !order ) {
			console.warn( "Unknown order uid: " + uid );
			return;
		}

		var status = statuses[msg.name];

		order.status = status;
		switch( status )
		{
			case order.CANCELLED:
				order.cancel_reason = msg.data.cancel_reason;
				failOrderPromise( uid, "cancelled" );
				break;
			case order.DROPPED:
				failOrderPromise( uid, "dropped" );
				break;
			case order.ASSIGNED:
				order.exp_arrival_time = msg.data.est_arrival_time;
				var driver = _this.getDriver( msg.data.driver_id );
				order.taxi_id = driver.id;
				fulfilOrderPromise( uid, driver );
				break;
		}
		listeners.call( "order-changed", {order: order} );
	}

	function failOrderPromise( uid, reason )
	{
		if( !(uid in orderPromises) ) {
			return;
		}
		orderPromises[uid].fail( reason );
		delete orderPromises[uid];
	}

	function fulfilOrderPromise( uid, driver )
	{
		if( !(uid in orderPromises) ) {
			return;
		}
		orderPromises[uid].ok( driver );
		delete orderPromises[uid];
	}

	this.getDriverOrders = function( driverId )
	{
		var list = [];
		for( var uid in orders ) {
			var order = orders[uid];
			if( order.taxi_id == driverId ) {
				list.push( order );
			}
		}
		return list;
	};

	/*
	 * Returns list of all current and some recent orders.
	 */
	this.orders = function() {
		return obj.toArray( orders );
	};

	/*
	 * Returns order with given id, if it is current or recent.
	 */
	this.getOrder = function( uid ) {
		return orders[uid];
	};
}
