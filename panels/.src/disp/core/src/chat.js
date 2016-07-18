function initChat( conn, listeners, data )
{
	var ack = {};
	var last = {};
	var disp = this;

	data.drivers.forEach( function( driver ) {
		ack[driver.driver_id] = 0;
		last[driver.driver_id] = 0;
	});

	this.getChatMessages = function( driverId, from, to )
	{
		return conn.dx().get( "chat-messages", {
			driver_id: driverId,
			from: from,
			to: to
		})
		.then( function( arr ) {
			var a = [];
			arr.forEach( function( data ) {
				a.push( new ChatMsg( data ) );
			});
			return a;
		});
	};

	this.sendChatMessage = function( driverId, str )
	{
		var driver = this.getDriver( driverId );
		if( !driver ) {
			return Promise.fail( "Unknown driver id: " + driverId );
		}

		return conn.send( "send-chat-message", {
			to: driverId,
			text: str,
			to_type: null
		});
	};

	this.broadcastChatMessage = function( driverIds, str )
	{
		return conn.send( "broadcast-chat", {
			to: driverIds,
			text: str
		});
	};

	this.haveNewMessages = function( driverId ) {
		return ack[driverId] < last[driverId];
	};

	this.markChatMessages = function( driverId, lastId )
	{
		if( lastId <= ack[driverId] ) {
			return;
		}
		if( lastId > last[driverId] ) {
			return;
		}
		ack[driverId] = lastId;
		listeners.call( "chat-front-changed", {
			driver: this.getDriver( driverId ),
			unread: last[driverId] - ack[driverId]
		});
	};

	function moveFront( message )
	{
		var driverId = message.from;
		var d = disp.getDriver( driverId );
		if( !d ) return;

		last[driverId] = message.id;
		if( ack[driverId] == 0 ) {
			ack[driverId] = message.id - 1;
		}
		listeners.call( "chat-front-changed", {
			driver: d,
			unread: last[driverId] - ack[driverId]
		});
	}

	conn.onMessage( "chat-message", function( msg )
	{
		var message = new ChatMsg( msg.data );
		moveFront( message );
		listeners.call( "chat-message-received", {message: message} );
	});
}
