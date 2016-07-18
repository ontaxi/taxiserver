window.jobs = ( function()
{
	var jobs = [];

	function addJob( func, period )
	{
		period = period || 5000;
		var alarmPeriod = Math.max( period * 2, 10000 );

		var running = false;
		var id = null;
		var alarm = null;

		function tick() {
			running = true;
			func(done);
			alarm = setTimeout( warn, alarmPeriod );
		}

		function done( value )
		{
			running = false;
			clearTimeout( alarm );
			setTimeout( tick, period );
			/*
			 * We don't need the value given to us, but we have to pass
			 * it to the next "promise".
			 */
			return value;
		}

		function warn() {
			console.error( "The function", func, "is taking too long" );
		}

		function hurry()
		{
			if( running ) return;
			clearTimeout(id);
			tick();
		}

		function cancel() {
			clearTimeout( id );
			clearTimeout( alarm );
			running = false;
		}

		tick();
		var job = {
			hurry: hurry,
			cancel: cancel
		};
		jobs.push(job);
		return job;
	}

	return {
		/*
		 * Functions added using the "add" function must call back the
		 * "done" function given to them as the first argument. This is
		 * needed for functions doing network request.
		 */
		add: function( func, interval ) {
			return addJob( func, interval );
		},

		/*
		 * For other functions there is no need in synchronisation, thus
		 * this function which adds the wrapper that calls the done
		 * function allosing the func itself be clean from that.
		 */
		addfunc: function( func, interval ) {
			return addJob( function( done ) {
				done(); func();
			}, interval );
		},

		get: function() {
			return jobs;
		},

		clear: function()
		{
			var job;
			while( job = jobs.pop() ) {
				job.cancel();
			}
		}
	};
})();
