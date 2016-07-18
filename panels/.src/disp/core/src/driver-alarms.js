function initDriverAlarms( conn, listeners, data )
{
	var alarms = {};

	data.driver_alarms.forEach( function( alarm ) {
		alarms[alarm.driver_id] = alarm;
	});

	this.driverAlarms = function() {
		var list = [];
		for( var driverId in alarms ) {
			list.push( {driverId: driverId} );
		}
		return list;
	};

	conn.onMessage( 'driver-alarm-on', function( msg )
	{
		var driver = disp.getDriver( msg.data.driver_id );
		if( !driver ) return;

		alarms[driver.id] = msg.data;
		listeners.call( 'driver-alarm-on', {driver: driver} );
	});

	conn.onMessage( 'driver-alarm-off', function( msg )
	{
		var driver = disp.getDriver( msg.data.driver_id );
		if( !driver ) return;

		if( !(driver.id in alarms) ) {
			console.error( "There is no alarm for", driver.id );
			return;
		}
		listeners.call( 'driver-alarm-off', {driver: driver} );
	});
}
