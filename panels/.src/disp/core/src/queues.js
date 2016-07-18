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
