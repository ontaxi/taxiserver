//"use strict";
(function()
{
	window.P = Promise;
	window.Promise = Promise;

	Promise.debug = true;

	var _id = 0;

	function postcall( func, arg ) {
		setTimeout( function() {
			func( arg );
		}, 1 );
	}

	function _tr( name, args ) {
		//console.log( "->", name, args );
	}

	function warn( e ) {
		if( Promise.debug ) {
			console.warn( "Exception in a Promise", e );
			console.log( e.stack );
		}
	}

	function newPromiseHandle()
	{
		_tr( "newPromiseHandle", arguments );
		var h = {
			promise: null,
			fulfil: null,
			reject: null
		};

		h.promise = new Promise( function( fulfil, reject ) {
			h.fulfil = function( val ) {
				postcall( fulfil, val );
			};
			h.reject = function( err ) {
				postcall( reject, err );
			};
		});
		return h;
	}

	function Promise( executor )
	{
		var id = ++_id;

		_tr( "Promise", arguments );

		/*
		 * Current state of the promise and fulfil or reject value.
		 */
		var state = "pending";
		var result;

		function msg() {
			/*
			var args = [ "[" + id + ", " + state + ", " + result + "]" ];
			//var args = [id, state, result];
			for( var i = 0; i < arguments.length; i++ ) {
				args.push( arguments[i] );
			}
			console.log.apply( console, args );
			*/
		}

		msg( "Promise", arguments );

		var onFulfil = [];
		var onReject = [];

		function fulfil( x )
		{
			msg( "fulfil", x );
			if( state != "pending" ) return;
			state = "fulfilled";
			result = x;
			/*
			 * Call all fulfil callbacks in the order of registration.
			 */
			var n = onFulfil.length;
			for( var i = 0; i < n; i++ ) {
				msg( "-> onFulfil[" + i + "]", result );
				postcall( onFulfil[i], result );
			}
		}

		function reject( e )
		{
			msg( "reject", e );

			if( state != "pending" ) return;
			state = "rejected";
			result = e;
			/*
			 * Call all reject callbacks in the order of registration.
			 */
			var n = onReject.length;
			for( var i = 0; i < n; i++ ) {
				postcall( onReject[i], result );
			}
		}

		this.then = function( onFulfilled, onRejected )
		{
			msg( "then", arguments );
			var next = newPromiseHandle();

			var f = function( promiseValue )
			{
				msg( "then->fulfil", arguments );
				if( isFunction( onFulfilled ) ) {
					try {
						msg( "then->onFulfilled", promiseValue );
						var x = onFulfilled( promiseValue );
						msg( "then->onFulfilled returned", x );
						resolvePromise( next, x );
					} catch( e ) {
						warn( e );
						next.reject( e );
					}
				}
				else {
					next.fulfil( promiseValue );
				}
			};

			var r = function( rejectReason )
			{
				msg( "then->reject", arguments );
				if( isFunction( onRejected ) )
				{
					try {
						var x = onRejected( rejectReason );
						resolvePromise( next, x );
					} catch( e ) {
						warn( e );
						next.reject( e );
					}
				}
				else {
					next.reject( rejectReason );
				}
			};

			switch( state )
			{
				case "pending":
					msg( "then: waiting for result" );
					onFulfil.push( f );
					onReject.push( r );
					break;
				case "fulfilled":
					msg( "then: already fulfilled" );
					f( result );
					break;
				case "rejected":
					msg( "then: already rejected" );
					r( result );
					break;
				default:
					throw "Unknown state: " + state;
			}

			return next.promise;
		};

		this.catch = function( onReject ) {
			return this.then( null, onReject );
		};

		function resolvePromise( handle, x )
		{
			msg( "resolvePromise", arguments, resolvePromise.caller );
			if( x === handle.promise ) {
				handle.reject( new TypeError(
					"Can't resolve a Promise with itself." ) );
				return;
			}

			if( !isObject( x ) && !isFunction( x ) ) {
				handle.fulfil( x );
				return;
			}

			/*
			 * If trying to access 'then' property of 'x' throws
			 * an error, reject the promise with that error.
			 */
			var then;
			try { then = x.then; } catch( e ) {
				warn( e );
				handle.reject( e );
				return;
			}

			if( !isFunction( then ) ) {
				handle.fulfil( x );
				return;
			}

			var stopped = false;
			try {
				then.call( x,
					function( val ) {
						msg( "then onSuccess", arguments );
						if( stopped ) return;
						stopped = true;
						handle.fulfil( val );
					},
					function( err ) {
						msg( "then onFail", arguments );
						if( stopped ) return;
						stopped = true;
						handle.reject( err );
					}
				);
			}
			catch( e ) {
				warn( e );
				if( !stopped ) {
					stopped = true;
					handle.reject( e );
				}
			}
		}

		executor( fulfil, reject );
	}

	Promise.resolve = function( x )
	{
		_tr( "Promise.resolve", arguments );
		if( x instanceof Promise ) {
			return x;
		}

		var p = new Promise( function( resolve, reject ) {
			resolve( x );
		});
		return p;
	};

	/*
	 * Returns a Promise rejected with the given reason.
	 */
	Promise.reject = function( reason )
	{
		_tr( "Promise.reject", arguments );
		var p = new Promise( function( resolve, reject ) {
			reject( reason );
		});
		return p;
	};

	Promise.all = function( arr )
	{
		_tr( "Promise.all", arguments );
		var handle = newPromiseHandle();

		/*
		 * Cast all given values to promises and wait for them.
		 */
		var resolved = 0;
		var values = [];
		var stopped = false;
		var n = arr.length;
		for( var i = 0; i < n; i++ )
		{
			/*
			 * If any promise has rejected by now, don't finish the
			 * loop.
			 */
			if( stopped ) break;
			/*
			 * 'ok' is "wrapped" to save the index 'i' in a closure.
			 */
			Promise.resolve( arr[i] ).then( ok(i), fail );
		}

		function ok(i)
		{
			/*
			 * When a promise is fulfilled, put its value to the result
			 * array. If this is the last value, resolve our promise
			 * and stop.
			 */
			return function( val )
			{
				_tr( "ok(" + i + ")", arguments );
				if( stopped ) return;
				values[i] = val;
				resolved++;
				if( resolved == n ) {
					stopped = true;
					handle.fulfil( values );
				}
			};
		}

		/*
		 * When a promise fails, fail our promise and stop.
		 */
		function fail( err ) {
			_tr( "fail", arguments );
			if( stopped ) return;
			stopped = true;
			handle.reject( err );
		}

		return handle.promise;
	};

	function isFunction( x ) {
		return typeof(x) == "function";
	}

	function isObject( x ) {
		return (typeof(x) == "object") && (x !== null);
	}
})();
