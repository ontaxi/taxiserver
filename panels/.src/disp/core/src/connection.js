function Connection()
{
	var messageFunctions = {};
	var ready = false;
	var pref;
	var dx;
	var PERIOD = 3000;

	var channel = {
		seq: undefined, // current sequence number
		urgent: false, // urgent flag
		progress: false, // a request is in progress
		tid: null // timeout id for next scheduled request
	};

	this.RTT = function() { return dx.RTT(); };

	/*
	 * Open the connection. The URL argument specifies the prefix for
	 * DX requests.
	 */
	this.open = function( url )
	{
		pref = url;
		dx = new DX( url );

		/*
		 * Get the initial data packet that describes all current
		 * state of the service, and emit it as an init message.
		 */
		dx.get( 'init' ).then( function( data )
		{
			if( data.who.type != 'dispatcher' ) {
				throw "Wrong identity";
			}

			/*
			 * Start updates before dispatching init so that both
			 * directions work when the application is called.
			 */
			if( typeof data.seq == "undefined" ) {
				throw "Undefined sequence number in startUpdates";
			}
			channel.seq = data.seq;
			channel.tid = setTimeout( receive, PERIOD );
			setTimeout( checkQueues, PERIOD );
			ready = true;

			/*
			 * Send the init message to the application.
			 */
			var msg = {
				name: 'init',
				data: data
			};
			dispatchMessage( msg );
		});
	};

	/*
	 * Sends a message to the server.
	 */
	this.send = function( cmd, data )
	{
		if( !ready ) {
			throw "Can't send " + cmd + ", not ready yet";
		}
		if( typeof data == "undefined" ) {
			data = {};
		}

		var p = dx.post( 'cmd', {
			cmd: cmd,
			data: JSON.stringify( data )
		});

		/*
		 * The application may start waiting for a response to this
		 * message we are sending. Since this is a polling emulation,
		 * that response may be delayed by the period, so we would
		 * signal the receiving loop to get new data now.
		 */
		p.then( function( value ) {
			receive();
			return value;
		});

		return p;
	};

	//--

	/*
	 * Schedule next channel update.
	 */
	function receive()
	{
		/*
		 * If a request is already in progress, set the urgent flag so
		 * that the next iteration will start right away.
		 */
		if( channel.progress ) {
			channel.urgent = true;
			return;
		}

		/*
		 * If we are idle, cancel the timer and go now.
		 */
		if( channel.tid ) {
			clearTimeout( channel.tid );
		}
		channel.progress = true;
		dx.get( "channel-updates", {"last-message-id": channel.seq} )
		.catch( function( error ) {
			channel.progress = false;
			/*
			 * If something happens with the request, consume the
			 * error and keep the loop running.
			 */
			console.warn( "Channel error:", error );
			return [];
		})
		.then( function( messages ) {
			channel.progress = false;
			/*
			 * Reschedule the next update before processing
			 * the messages just to shave off few milliseconds.
			 */
			if( channel.urgent ) {
				channel.urgent = false;
				channel.tid = setTimeout( receive, 1 );
			}
			else {
				channel.tid = setTimeout( receive, PERIOD );
			}
			return messages;
		})
		.then( processMessages )
	}

	function processMessages( messages )
	{
		messages.forEach( function( m ) {
			channel.seq = m.message_id;
			var msg = {name: m.type, data: m.data};
			try {
				dispatchMessage( msg );
			} catch( error ) {
				console.warn( "Message error:", error );
				dispatchMessage( {name: "error", data: {error: error}} );
			}
		});
	}

	/*
	 * While synchronizing queue images using just update messages is
	 * appealing, there is at least one race condition which might cause
	 * the wrong client-size image right from the beginning. Rather than
	 * deal with that, better stick to brute force until the performance
	 * becomes an issue.
	 */
	function checkQueues()
	{
		dx.get( "queues-snapshot" ).then( function( data ) {
			dispatchMessage( {name: "-queues-snapshot", data: data} );
		})
		.catch( function( error ) {
			console.warn( error );
			dispatchMessage( {name: "error", data: {error: error}} );
		})
		.then( function() {
			setTimeout( checkQueues, PERIOD );
		});
	}

	function dispatchMessage( msg )
	{
		var n = msg.name;
		if( !(n in messageFunctions ) ) {
			console.warn( "Unknown message: " + msg.name );
			return;
		}
		messageFunctions[n].forEach( function( f ) {
			f( msg );
		});
	}



	/*
	 * Add a function to listen to given type of messages.
	 */
	this.onMessage = function( messageType, func )
	{
		if( messageType in messageFunctions ) {
			messageFunctions[messageType].push( func );
		} else {
			messageFunctions[messageType] = [ func ];
		}
	};

	this.dx = function() {
		return dx;
	};
}
