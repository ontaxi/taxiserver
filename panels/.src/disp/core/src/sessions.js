function initSessions( conn, listeners, data )
{
	var sessions = {};
	var disp = this;

	data.sessions.forEach( function( s ) {
		var id = s.session_id;
		sessions[id] = s;
	});

	conn.onMessage( 'session-opened', function( msg )
	{
		var id = msg.data.session_id;
		var driver_id = msg.data.driver_id;
		var driver = disp.getDriver( driver_id );
		if( !driver ) {
			console.warn( "Unknown driver in session-opened: " + driver_id );
			return;
		}
		var s = new Session( msg.data );
		sessions[s.id] = s;
		listeners.call( 'sessions-changed' );
		listeners.call( 'session-opened', {session: s} );
	});

	conn.onMessage( 'session-closed', function( msg )
	{
		var id = msg.data.session_id;
		if( !(id in sessions) ) {
			console.warn( "Unknown session_id in session-closed: " + id );
			return;
		}
		listeners.call( 'session-closed', {session: sessions[id]} );
		delete sessions[id];
		listeners.call( 'sessions-changed' );
	});

	conn.onMessage( 'session-requested', function( msg )
	{
		var req = {
			driver_id: msg.data.driver_id,
			odometer: msg.data.odometer
		};
		listeners.call( 'session-requested', req );
	});

	this.sessionsEnabled = function() {
		return data.service_options.sessions == '1';
	};

	this.sessions = function()
	{
		var list = [];
		for( var k in sessions ) {
			list.push( sessions[k] );
		}
		return list;
	};

	this.sessionRequired = function( driverId )
	{
		if( data.service_options.sessions != '1' ) return false;
		return getDriverSession( driverId ) == null;
	};

	function getDriverSession( driverId )
	{
		for( var id in sessions ) {
			if( sessions[id].driver_id == driverId ) {
				return sessions[id];
			}
		}
		return null;
	};

	this.openSession = function( driver_id, odometer ) {
		return conn.send( 'open-session', {
			driver_id: driver_id,
			odometer: odometer
		});
	};

	this.closeSession = function( driver_id, odometer ) {
		return conn.send( 'close-session', {
			driver_id: driver_id,
			odometer: odometer
		});
	};
}
