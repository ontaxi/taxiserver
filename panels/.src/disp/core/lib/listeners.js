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
