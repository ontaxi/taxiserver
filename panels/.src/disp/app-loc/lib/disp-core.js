/*
	Compilation date: 2016-03-10
	Number of files: 29
*/
(function() {
"use strict";

// lib/assert.js
function assert( val, msg, obj )
{
	if( val ) return;
	if( !msg ) msg = "assertion failed";
	console.error( msg, obj );
	throw msg;
}

function assertObj( obj, fields )
{
	assert( obj, "assertObj: given object is " + obj, obj );

	for( var k in fields )
	{
		assert( k in obj, "no field '" + k + "'", obj );
		var type = fields[k];
		assert( typeMatch( obj[k], type ),
			"field '"+k+"' has wrong type ("+(typeof obj[k])+")" );
	}
}

function typeMatch( val, type )
{
	if( type == '' ) return true;

	var nullOk;
	if( type.substr( -1 ) == "?" ) {
		nullOk = true;
		type = type.substring( 0, type.length - 1 );
	}
	else {
		nullOk = false;
	}

	if( val === null && nullOk ) {
		return true;
	}

	switch( type )
	{
		case "str":
			return typeof val == "string";
		case "flt":
			return typeof val == "number";
		case "int":
			return typeof val == "number" && Math.round( val ) == val;
		default:
			throw new Error( "typeMatch: unknown type " + type );
	}
}


// lib/dx.js
function DX( baseUrl )
{
	/*
	 * RTT estimation and time of the last request.
	 */
	var rtt = 0;
	var t = 0;

	this.RTT = function() { return rtt; }

	this.get = function( path, args )
	{
		var url = baseUrl + '/' + path;
		if( args ) {
			url += argString( args );
		}
		t = Date.now();
		return http.get( url ).then( check );
	};

	this.post = function( path, data )
	{
		var url = baseUrl + '/' + path;
		t = Date.now();
		return http.post( url, data ).then( check );
	};

	function argString( args )
	{
		var i = 0;
		var str = '';
		for( var k in args ) {
			str += (i > 0) ? '&' : '?';
			str += k + '=' + encodeURIComponent( args[k] );
			i++;
		}
		return str;
	}

	function check( data )
	{
		rtt = Date.now() - t;
		if( data.errno ) {
			throw data.errstr;
		}
		return data.data;
	}
}


// lib/fmt.js
var fmt = (function()
{
	function fmt( template, _args_ )
	{
		var out = '';
		var argpos = 1;
		var n = template.length;

		for( var i = 0; i < n; i++ )
		{
			var ch = template.charAt(i);

			/*
			 * Try to read a conversion specification.
			 */
			var m = getMarker( template, i );
			if( !m ) {
				out += ch;
				continue;
			}

			/*
			 * Try to format the argument.
			 */
			var s = expand( m, arguments[argpos] );
			if( s === null ) {
				out += ch;
				continue;
			}
			argpos++;

			out += s;
			i += m.length - 1;
		}
		return out;
	}

	function getMarker( template, pos )
	{
		var n = template.length;
		if( template.charAt( pos ) != '%' ) {
			return null;
		}
		var _pos = pos;
		pos++;

		var m = {
			flags: '',
			width: '',
			type: '',
			precision: '',
			length: 0
		};

		// Zero or more flags
		while( pos < n )
		{
			var ch = template.charAt( pos );
			if( ch == '0' ) {
				m.flags += '0';
				pos++;
				continue;
			}
			break;
		}

		// Width
		while( pos < n && isDigit( template.charAt( pos ) ) ) {
			m.width += template.charAt( pos++ );
		}

		// Optional precision
		if( pos < n && template.charAt( pos ) == '.' )
		{
			pos++;
			while( pos < n && isDigit( template.charAt(pos) ) ) {
				m.precision += template.charAt(pos++);
			}
		}

		if( pos < n )
		{
			var ch = template.charAt( pos );
			if( ch == 's' || ch == 'd' || ch == 'f' ) {
				m.type = ch;
				pos++;
			}
		}

		if( !m.type ) {
			return null;
		}
		m.width = (m.width === '')? -1 : parseInt(m.width, 10);
		m.precision = (m.precision === '')? -1 : parseInt(m.precision, 10);
		m.length = pos - _pos;
		return m;
	}

	function expand( marker, arg )
	{
		if( marker.type == 's' )
		{
			if( marker.width >= 0 || marker.flags || marker.precision >= 0 ) {
				throw "Format %" + marker.type + " is not fully supported";
			}
			return arg;
		}

		if( marker.type == 'd' )
		{
			if( (marker.flags != '' && marker.flags != '0') || marker.precision >= 0 ) {
				throw "Format %" + marker.type + " is not fully supported";
			}
			var out = arg.toString();
			if( marker.width > 0 )
			{
				var pad = marker.flags;
				var n = marker.width - out.length;
				while( n-- > 0 ) {
					out = pad + out;
				}
			}
			return out;
		}

		if( marker.type == 'f' )
		{
			if( typeof arg == "string" ) {
				arg = parseFloat( arg );
			}
			if( typeof arg != "number" ) {
				throw "A number is expected for %f format";
			}

			if( marker.width >= 0 || marker.flags ) {
				throw "Format %f is not fully supported";
			}
			if( marker.precision >= 0 ) {
				return arg.toFixed( marker.precision );
			}
			return arg;
		}

		return null;
	}

	function isDigit( ch ) {
		return ch.length == 1 && "0123456789".indexOf( ch ) >= 0;
	}
	return fmt;
})();

/*
 * Lightweight analog of 'fmt' without any format specifiers. It just
 * replaces question marks with the arguments.
 */
function tpl( tpl, vars___ )
{
	var n = arguments.length;
	for( var i = 1; i < n; i++ ) {
		tpl = tpl.replace( '?', arguments[i] );
	}
	return tpl;
}


// lib/format.js
/*
 * Takes raw phone number string and formats it nicely.
 * The format is "+375 <code> <3d>-<2d>-<2d>".
 */
function formatPhone( str )
{
	if( !str ) return str;
	var original = str;
	if( str.indexOf( "+375" ) == 0 ) {
		str = str.substr( 4 );
	}

	str = str.replace( /[^\d]/g, '' );

	var parts = [
		str.substr( 0, 2 ),
		str.substr( 2, 3 ),
		str.substr( 5, 2 ),
		str.substr( 7 )
	];

	if( parts[3] == '' || parts[3].length > 2 ) return original;

	var s = '+375 ' + parts.shift();
	if( parts.length > 0 ) {
		s += ' ' + parts.join( '-' );
	}

	return s;
}

/*
 * Formats time as hour:minute. The argument is UTC seconds.
 */
function formatTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );
	return fmt( "%02d:%02d", d.getHours(), d.getMinutes() );
}

/*
 * Formats unixtime as "day.month.year hours:minutes".
 */
function formatDateTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );

	return fmt( "%02d.%02d.%d %02d:%02d",
		d.getDate(),
		d.getMonth() + 1,
		d.getFullYear(),
		d.getHours(),
		d.getMinutes()
	);
}


// lib/http.js
"use strict";

var http = (function()
{
	var http = {};

	/*
	 * Creates urls. "vars" is a dict with query vars. "base" can have
	 * variables in it too.
	 * Example: createURL( '/?v=json&b=mapdata', {p: bounds, lat: ...} )
	 */
	http.createURL = function( base, vars )
	{
		var url = base;
		var haveQ = url.indexOf( '?' ) != -1;

		for( var i in vars )
		{
			if( typeof vars[i] == "undefined" ) continue;

			if( !haveQ ) {
				url += '?';
				haveQ = true;
			} else {
				url += '&';
			}

			url += i + "=" + encodeURIComponent( vars[i] );
		}
		return url;
	};

	http.get = function( url ) {
		return promise( $.get( url ) );
	};

	http.post = function( url, data ) {
		return promise( $.post( url, data ) );
	};

	/*
	 * Converts jQuery deferred/jqXHR/whatever-it's-called-now to a
	 * Promise object with additional 'abort' function.
	 */
	function promise( jp )
	{
		var p = new Promise( function( ok, fail ) {
			jp.done( ok ).fail( fail );
		});
		p.abort = function() {
			jp.abort();
		};
		return p;
	}

	return http;
})();


// lib/listeners.js
function Listeners( events, statefulEvents )
{
	if( typeof statefulEvents == "undefined" ) {
		statefulEvents = [];
	}

	var listeners = {};
	var eventStates = {};

	for( var i = 0; i < events.length; i++ )
	{
		var k = events[i];
		if( k.charAt(0) == "*" ) {
			k = k.substr( 1 );
			statefulEvents.push( k );
			continue;
		}
		listeners[k] = [];
	}

	for( var i = 0; i < statefulEvents.length; i++ ) {
		var k = statefulEvents[i];
		listeners[k] = [];
		eventStates[k] = null;
	}

	function event( type, context, data )
	{
		var stopped = false;

		this.type = type;
		this.data = data;

		this.getContext = function() {
			return context;
		};

		this.stop = function() {
			stopped = true;
		};

		this.isStopped = function() {
			return stopped;
		};
	}

	/*
	 * Adds a listener of the given type. If 'first' is true, the
	 * function is added at the beginning of the list.
	 */
	this.add = function( type, func, first )
	{
		if( !(type in listeners) ) {
			throw "Unknown event type: " + type;
		}
		/*
		 * If this is a "stateful" event that has been already fired,
		 * and not cancelled, call the given listener.
		 */
		if( statefulEvents.indexOf( type ) >= 0 )
		{
			var e = eventStates[type];
			if( e && !e.isStopped() ) {
				func.call( e.getContext(), e );
			}
			// and add to the list anyway
		}

		if( first ) {
			listeners[type].unshift( func );
		} else {
			listeners[type].push( func );
		}
	};

	this.call = function( type, data, context )
	{
		if( !(type in listeners) ) {
			throw "Unknown event type: " + type;
		}

		if( typeof data == "undefined" ) {
			data = {};
		}

		var e = new event(type, context, data);

		if( statefulEvents.indexOf( type ) >= 0 ) {
			eventStates[type] = e;
		}

		var n = listeners[type].length;
		var r;
		for( var i = 0; i < n; i++ )
		{
			r = listeners[type][i].call( context, e );
			if( r === false ) return false;
			if( e.isStopped() ) {
				return r;
			}
		}
		return true;
	};
}


// lib/obj.js
/*
 * Some operations on objects.
 */
var obj = (function()
{
	var obj = {};

	obj.merge = function( _args_ )
	{
		var o = {};
		for( var i = 0; i < arguments.length; i++ )
		{
			var add = arguments[i];
			for( var k in add ) {
				o[k] = add[k];
			}
		}
		return o;
	};

	obj.subset = function( o, fields )
	{
		var s = {};
		var n = fields.length;
		var k;
		for( var i = 0; i < n; i++ ) {
			k = fields[i];
			s[k] = o[k];
		}
		return s;
	};

	obj.copy = function( o ) {
		return JSON.parse( JSON.stringify( o ) );
	};

	obj.toArray = function( o ) {
		var a = [];
		for( var k in o ) {
			a.push( o[k] );
		}
		return a;
	};

	obj.keys = function( o ) {
		var keys = [];
		for( var k in o ) keys.push( k );
		return keys;
	};

	/*
	 * Returns a map of array indexed by values of
	 * their keyname field.
	 */
	obj.index = function( array, keyname )
	{
		var index = {};
		var n = array.length;
		for( var i = 0; i < n; i++ )
		{
			var item = array[i];
			var key = item[keyname];
			if( !key ) continue;
			index[key] = item;
		}
		return index;
	};

	/*
	 * Returns first element matching to the filter, from the array.
	 */
	obj.find = function( array, filter )
	{
		var r = [];
		var n = array.length;
		for( var i = 0; i < n; i++ ) {
			if( this.match( array[i], filter ) ) {
				r.push( array[i] );
			}
		}
		return r;
	};

	/*
	 * Returns first element matching to the filter, from the array.
	 */
	obj.findOne = function( array, filter )
	{
		var n = array.length;
		for( var i = 0; i < n; i++ ) {
			if( this.match( array[i], filter ) ) {
				return array[i];
			}
		}
		return null;
	};

	/*
	 * Returns true if filter is a matching subset of item.
	 */
	obj.match = function( item, filter )
	{
		for( var k in filter )
		{
			if( !(k in item) || (item[k] != filter[k]) ) {
				return false;
			}
		}
		return true;
	};

	obj.column = function( items, key )
	{
		var list = [];
		for( var i = 0; i < items.length; i++ ) {
			var item = items[i];
			list.push( item[key] );
		}
		return list;
	};

	/*
	 * Returns true if the given object is empty.
	 */
	obj.isEmpty = function( item )
	{
		for( var k in item ) return false;
		return true;
	};

	obj.unique = function( array )
	{
		var set = {};
		var vals = [];

		for( var i = 0; i < items.length; i++ ) {
			var i = array[i];
			if( i in set ) continue;
			set[i] = true;
			vals.push( i );
		}

		return vals;
	};

	return obj;
})();


// lib/same.js
var same = (function() {

	function same( v1, v2 )
	{
		if( v1 === v2 ) {
			return true;
		}
		if( typeof v1 != typeof v2 ) {
			return false;
		}
		if( Array.isArray( v1 ) ) {
			return arrSame( v1, v2 );
		}
		if( typeof v1 == "object" ) {
			return objSame( v1, v2 );
		}
		return false;
	}

	function arrSame( a1, a2 )
	{
		var n = a1.length;
		if( n != a2.length ) {
			return false;
		}
		for( var i = 0; i < n; i++ ) {
			if( !same( a1[i], a2[i] ) ) {
				return false;
			}
		}
		return true;
	}

	function objSame( o1, o2 )
	{
		for( var k in o1 ) {
			if( !(k in o2) ) {
				return false;
			}
			if( !same( o1[k], o2[k] ) ) {
				return false;
			}
		}
		for( var k in o2 ) {
			if( !(k in o1) ) {
				return false;
			}
		}
		return true;
	}

	return same;
})();


// lib/time.js
/*
 * Time utility to help deal with incorrectly set clock at client side.
 */
var time = (function() {
	var time = {};

	/*
	 * We maintan here that <local time> + <diff> = <utc time>.
	 */
	var diff;
	/*
	 * Scale division for the correction in seconds. Roughing up the
	 * scale eliminates effect of network lag. If 'snap' is 20,
	 * reported differences between local and utc time below 10 seconds
	 * are ignored.
	 */
	var snap = 20;

	/*
	 * Set the real time. After this is done, time.utc will return
	 * correct UTC time.
	 */
	time.set = function( realUTC ) {
		var x = realUTC - now();
		diff = Math.round( x / snap ) * snap;
	};

	time.diff = function() {
		return diff;
	};

	/*
	 * Converts given local ("incorrect") time to UTC time (in seconds).
	 * 'local' is the local time in seconds. If 'local' is undefined,
	 * current local time is assumed.
	 */
	time.utc = function( local ) {
		if( typeof local == "undefined" ) {
			local = now();
		}
		return local + diff;
	};

	/*
	 * Converts UTC time to local ("incorrect") time in seconds.
	 * If 'utc' is undefined, current local time is returned.
	 */
	time.local = function( utc ) {
		if( typeof utc == "undefined" ) {
			return now();
		}
		return utc - diff;
	};

	/*
	 * Returns UTC timestamp from the given local Date object.
	 */
	time.utcFromDate = function( date ) {
		return this.utc( Math.round( date.getTime() / 1000 ) );
	};

	function now() {
		return Math.round( Date.now() / 1000 );
	}

	return time;
})();

window.time = time;


// src/chat.js
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


// src/connection.js
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

		console.log( "Send:", cmd, data );

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
			console.log( "Message:", m );
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


// src/disp.js

function DispatcherClient()
{
	var url = "/dx/dispatcher";

	/*
	 * Dispatcher events.
	 */
	var listeners = new Listeners( [
		"*ready",
		"chat-message-received",
		"chat-front-changed",
		"connection-error",
		"driver-alarm-on",
		"driver-alarm-off",
		"driver-moved",
		"driver-changed",
		"driver-online-changed",
		"driver-block-changed",
		"queues-changed",
		"queue-assignments-changed",
		"order-added",
		"order-changed",
		"order-removed",
		"session-requested",
		"session-opened",
		"session-closed",
		"sessions-changed",
		"setting-changed",
		"service-log",
		"sync"
	] );

	this.on = listeners.add.bind( listeners );

	var _this = this;
	var data = null;

	/*
	 * Initialize the connection with the server.
	 */
	var conn = new Connection();
	conn.onMessage( 'init', init );
	conn.onMessage( 'error', function( msg ) {
		listeners.call( "connection-error", msg.data );
	});
	conn.onMessage( 'sync', function( msg ) {
		listeners.call( "sync" );
	});
	conn.open( url );

	function init( msg )
	{
		data = msg.data;
		time.set( data.now );

		for( var i = 0; i < data.fares.length; i++ ) {
			data.fares[i] = new Fare( data.fares[i] );
		}

		[ initSettings,
			initChat,
			initDrivers,
			initDriverAlarms,
			initOrders,
			initLocations,
			initQueues,
			initSessions,
			initImitations ].forEach(
		function( f ) {
			f.call( _this, conn, listeners, data );
		});

		listeners.call( 'ready' );
	}

	conn.onMessage( "service-log", function( msg ) {
		listeners.call( "service-log", msg.data );
	});

	this.id = function() { return data.who.id; };
	this.login = function() { return data.who.login; };
	this.RTT = function() { return conn.RTT(); };

	this.param = function( name ) {
		return data.service_options[name];
	};

	this.fares = function() {
		return data.fares;
	};

	this.findCustomer = function( phone )
	{
		return conn.dx().get( "customer-info", {phone: phone} )
		.then( function( info )
		{
			if( !info ) throw "No such customer";
			var c = {name: info.name, addresses: []};
			info.addresses.forEach( function( data ) {
				var addr = new Address( data );
				if( addr.isEmpty() ) return;
				c.addresses.push( addr );
			});
			return c;
		});
	};
}
window.DispatcherClient = DispatcherClient;


// src/driver-alarms.js
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


// src/drivers.js
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


// src/imitations.js
function initImitations( conn, listeners, data )
{
	this.setDriverOnline = function( driver_id, online ) {
		return conn.send( 'set-imitation-online', {
			taxi_id: driver_id,
			online: online? 1 : 0
		})
	};

	this.imitationsEnabled = function() {
		return data.service_options.imitations == "1";
	};
}


// src/locations.js
function initLocations( conn, listeners, data )
{
	var locations = {};

	data.queue_locations.forEach( function( d ) {
		var loc = new Location( d );
		locations[loc.id] = loc;
	});

	this.locations = function() {
		return obj.toArray( locations );
	};

	this.getLocation = function( locId ) {
		return locations[locId];
	};

	this.getQueueLocation = function( qid ) {
		for( var locid in locations ) {
			if( locations[locid].queue_id == qid ) {
				return locations[locid];
			}
		}
		return null;
	};

	this.suggestLocations = function( term ) {
		return conn.dx().get( "locations", {term: term} );
	};
}


// src/obj/address.js
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


// src/obj/car.js
function Car( data )
{
	var spec = {
		car_id: "int",
		name: "str",
		plate: "str",
		body_type: "str",
		color: "str"
	};
	assertObj( data, spec );

	for( var k in spec ) {
		this[k] = data[k];
	}

	this.id = this.car_id;
}

Car.prototype.bodyName = function()
{
	var bodies = {
		"sedan": "седан",
		"estate": "универсал",
		"hatchback": "хетчбек",
		"minivan": "минивен",
		"bus": "автобус"
	};

	if( this.body_type in bodies ) return bodies[this.body_type];
	return this.body_type;
};

Car.prototype.format = function()
{
	var parts = [
		this.name, this.color, this.bodyName(), this.plate
	].filter( hasValue );
	return parts.join( ', ' );
};


// src/obj/chatmsg.js
function ChatMsg( data )
{
	var spec = {
		"id": "int",
		"text": "str",
		"from": "int",
		"to": "int?",
		"to_type": "str?",
		"utc": "int"
	};

	assertObj( data, spec );

	for( var k in spec ) this[k] = data[k];
}


// src/obj/driver.js
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


// src/obj/fare.js
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


// src/obj/location.js
function Location( data )
{
	var spec = {
		"loc_id": "int",
		"name": "str",
		"contact_phone": "str?",
		"contact_name": "str?",
		"addr": "",
		"latitude": "flt",
		"longitude": "flt",
		"queue_id": "int?"
	};

	for( var k in spec ) this[k] = data[k];

	this.id = data.loc_id;

	this.coords = function() {
		return [this.latitude, this.longitude];
	};
}


// src/obj/order.js
function Order( data )
{
	if( !("order_uid" in data) ) {
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


// src/obj/queue.js
function Queue( data )
{
	var spec = {
		"queue_id": "int",
		"parent_id": "int?",
		"name": "str",
		"order": "int",
		"priority": "int",
		"min": "int",
		"latitude": "flt",
		"longitude": "flt",
		"loc_id": "int?"
	};
	assertObj( data, spec );

	for( var k in spec ) {
		this[k] = data[k];
	}

	this.id = data.queue_id;
}

Queue.prototype.coords = function() {
	return [this.latitude, this.longitude];
};


// src/obj/session.js
function Session( data )
{
	var spec = {
		"session_id": "int",
		"driver_id": "int",
		"car_id": "int",
		"time_started": "int"
	};
	assertObj( data, spec );

	for( var k in spec ) {
		this[k] = data[k];
	}

	this.id = this.session_id;
}


// src/orders.js
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
			'opt_terminal'
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
			error( "Unknown order uid: " + uid );
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


// src/queues.js
function initQueues( conn, listeners, data )
{
	var queues = {};
	var queueDrivers = {}; // qid => [driver_id, ...]
	var disp = this;

	/*
	 * Group id => group object.
	 */
	var groups = {};

	data.queues.forEach( function( d ) {
		var q = new Queue( d );
		q.subqueues = [];
		queues[q.id] = q;
	});

	var tree = createTree();
	function createTree()
	{
		var Q = {};
		obj.keys( queues ).forEach( function( qid )
		{
			var q = queues[qid];
			var pid = q.parent_id;

			if( pid ) {
				if( !(pid in Q) ) {
					Q[pid] = queues[pid];
				}
				Q[pid].subqueues.push( q );
			}
			else {
				Q[qid] = q;
			}
		});

		var list = [];
		for( var qid in Q ) {
			Q[qid].subqueues = Q[qid].subqueues.sort( function( q1, q2 ) {
				return q1.priority - q2.priority;
			});
			list.push( Q[qid] );
		}
		return list.sort( function( a, b ) { return a.order - b.order } );
	}

	saveAssignments( data.queues_snapshot );

	data.groups.forEach( function( g ) {
		groups[g.group_id] = g;
	});

	var prevSnapshot = [];

	conn.onMessage( "-queues-snapshot", function( msg )
	{
		var data = msg.data;
		/*
		 * If the snapshot hasn't changed, ignore the update.
		 */
		if( same( prevSnapshot, data ) ) {
			return;
		}
		prevSnapshot = data;

		queueDrivers = {};
		saveAssignments( data );
		listeners.call( "queue-assignments-changed" );
	});

	function saveAssignments( data )
	{
		data.forEach( function( o ) {
			/*
			 * Make sure the identifiers are not strings.
			 */
			var list = [];
			o.drivers.forEach( function( id ) {
				list.push( parseInt( id, 10 ) );
			});
			var qid = o.queue_id;
			queueDrivers[qid] = list;
		});
	}

	/*
	 * Returns array of drivers in the given queue.
	 */
	this.getQueueDrivers = function( qid ) {
		var a = [];
		queueDrivers[qid].forEach( function( id ) {
			a.push( disp.getDriver( id ) );
		});
		return a;
	};

	/*
	 * Returns queue the driver is in.
	 */
	this.getDriverQueue = function( driverId )
	{
		var loc = driverPosition( driverId );
		if( !loc ) return null;
		return queues[loc.qid];
	};

	this.queues = function() {
		var list = [];
		tree.forEach( function( q ) {
			list.push( q );
			q.subqueues.forEach( function( q ) {
				list.push( q );
			});
		});
		return list;
	};

	this.getQueue = function( queueId ) {
		return queues[queueId];
	};

	function driverPosition( driverId )
	{
		for( var qid in queueDrivers )
		{
			var list = queueDrivers[qid];
			var pos = list.indexOf( driverId );
			if( pos != -1 ) {
				return {qid: qid, pos: pos};
			}
		}
		return null;
	}

	this.restoreDriverQueue = function( driver_id )
	{
		return conn.send( 'restore-queue', {
			driver_id: driver_id
		});
	};

	this.assignDriverQueue = function( driver_id, qid, pos )
	{
		if( qid <= 0 ) {
			return this.removeDriverQueue( driver_id );
		}

		return conn.send( 'put-into-queue', {
			driver_id: driver_id,
			queue_id: qid,
			pos: pos
		});
	};

	this.removeDriverQueue = function( driver_id )
	{
		return conn.send( 'remove-from-queue', {
			driver_id: driver_id
		});
	};

	this.suggestQueue = function( driver_id, qid, pos )
	{
		return conn.send( 'suggest-queue', {
			driver_id: driver_id,
			queue_id: qid,
			pos: pos
		});
	};

	this.changeQueue = function( qid, min, priority )
	{
		return conn.send( 'change-queue', {
			queue_id: qid,
			min: min,
			priority: priority
		});
	};

	conn.onMessage( 'queue-changed', function( msg )
	{
		var data = msg.data;
		var q = queues[data.queue_id];
		q.min = data.min;
		q.priority = data.priority;

		/*
		 * Resort the queues list since the order has changed.
		 */
		if( q.parent_id ) {
			resortQueueChildren( q );
		}
		listeners.call( "queues-changed" );
	});

	function resortQueueChildren( q )
	{
		var p = queues[q.parent_id];
		var list = p.subqueues;

		for( var i = 0; i < list.length; i++ )
		{
			if( list[i].queue_id == q.id ) {
				break;
			}
		}
		list.splice( i, 1 );
		list.splice( q.priority, 0, q );
		for( i = 0; i < list.length; i++ ) {
			list[i].priority = i;
		}
	}

	this.allowedQueues = function( driverId )
	{
		var driver = this.getDriver( driverId );
		var available = groups[driver.group_id].queues.slice();
		return available;
	};

	this.getQueueGroups = function( qid )
	{
		var list = [];
		for( var gid in groups ) {
			if( groups[gid].queues.indexOf( qid ) >= 0 ) {
				list.push( groups[gid] );
			}
		}
		return list;
	};

	this.haveNonQueueGroups = function()
	{
		for( var gid in groups )
		{
			var g = groups[gid];
			if( g.queues.length == 0 ) {
				return true;
			}
		}
		return false;
	};
}


// src/sessions.js
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


// src/settings.js
function initSettings( conn, listeners, data )
{
	var settings = {};

	try {
		var s = JSON.parse( data.who.settings );
		settings = obj.merge( settings, s );
	} catch( e ) {
		console.warn( "Could not parse saved settings:", e );
	}

	this.getSetting = function( name, def ) {
		if( name in settings ) return settings[name];
		return def;
	};

	this.changeSetting = function( name, val ) {
		if( settings[name] == val ) return;
		settings[name] = val;
	};

	this.saveSettings = function() {
		return conn.dx().post( 'prefs', {prefs: JSON.stringify( settings )} );
	};
}

})();
