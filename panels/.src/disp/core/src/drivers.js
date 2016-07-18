function initDrivers( conn, listeners, data )
{
	var drivers = {};
	var cars = {};

	/*
	 * Group id => group object.
	 */
	var groups = {};

	data.drivers.forEach( function( d ) {
		var d = new Driver( d );
		drivers[d.id] = d;
	});

	data.cars.forEach( function( d ) {
		var c = new Car( d );
		cars[c.id] = c;
	});

	data.groups.forEach( function( g ) {
		groups[g.group_id] = g;
	});

	this.drivers = function() {
		return obj.toArray( drivers ).sort( function( a, b ) {
			return natcmp( a.call_id, b.call_id );
		});
	};

	this.driverGroups = function() {
		return obj.toArray( groups );
	};

	this.getDriver = function( driverId ) {
		return drivers[driverId];
	};

	this.getCar = function( carId ) {
		return cars[carId];
	};

	this.getDriverCar = function( driverId ) {
		var d = drivers[driverId];
		return cars[d.car_id];
	};

	this.driverTypes = function() {
		return data.driver_types;
	};

	/*
	 * Blocks given driver for given amount of seconds. If `seconds` is
	 * < 0, then the driver is unblocked.
	 */
	this.blockDriver = function( driverId, seconds, reason ) {
		return conn.send( 'ban-taxi', {
			driver_id: driverId,
			seconds: seconds,
			reason: reason
		});
	};

	this.unblockDriver = function( driverId ) {
		return conn.send( 'unban-taxi', {
			driver_id: driverId
		});
	};

	this.changeDriverGroup = function( driverId, groupId ) {
		return conn.send( 'change-driver-group', {
			driver_id: driverId,
			group_id: groupId
		});
	};

	conn.onMessage( 'driver-changed', function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;

		var prevOnline = driver.is_online == '1';

		var diff = msg.data.diff;
		for( var k in diff ) {
			driver[k] = diff[k];
		}

		var online = driver.is_online == '1';
		if( online != prevOnline ) {
			listeners.call( "driver-online-changed", {driver: driver} );
		}
		listeners.call( 'driver-changed', {driver: driver} );
	});

	conn.onMessage( "driver-blocked", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;

		driver.block_until = msg.data.until;
		driver.block_reason = msg.data.reason;
		listeners.call( "driver-block-changed", {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});

	conn.onMessage( "driver-unblocked", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;

		driver.block_until = 0;
		driver.block_reason = "";
		listeners.call( "driver-block-changed", {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});

	conn.onMessage( 'driver-position', function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;

		driver.latitude = msg.data.latitude;
		driver.longitude = msg.data.longitude;
		listeners.call( 'driver-moved', {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});

	conn.onMessage( "driver-busy", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;

		driver.is_busy = msg.data.busy;
		listeners.call( "driver-changed", {driver: driver} );
	});

	function msgDriver( msg ) {
		var driver_id = msg.data.driver_id;
		var driver = drivers[driver_id];
		if( !driver ) {
			console.warn( "Received " + msg.name + " for unknown driver", driver_id );
			return null;
		}
		return driver;
	}
}
