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
