function QueuesWidget( disp, options )
{
	var defaults = {
		disableDragging: false,
		disableFakeQueues: false
	};
	options = options || {};
	for( var k in defaults ) {
		if( !(k in options) ) {
			options[k] = defaults[k];
		}
	}

	var items = new QueuesWidgetItems( disp );
	var table = new QueuesWidgetTable( disp, items );

	this.root = function() {
		return table.root();
	};

	this.selectDrivers = function( filter ) {
		items.select( filter );
	};

	/*
	 * Conditions for queues are:
	 * - no session: online, !blocked, !session
	 * - blocked: online, blocked
	 * - none: online, !blocked, session
	 * - city: online, !blocked, session, no accessible queues
	 * - normal queue: !blocked, session
	 */
	table.NONE = 0;
	table.BLOCKED = -1;
	table.NO_SESSION = -2;
	table.CITY = -3;

	//--

	addQueues();
	fillDrivers();
	/*
	 * When configuration of queues changes, redraw the widget
	 */
	disp.on( 'queues-changed', function( event ) {
		table.empty();
		addQueues();
		fillDrivers();
	});

	trackDrivers();

	if( !options.disableDragging ) {
		initQueueDragging( disp, table );
	}
	initQueueClicking( disp, table );

	//--

	function addQueues()
	{
		if( !options.disableFakeQueues )
		{
			if( disp.sessionsEnabled() ) {
				table.addQueue({id: table.NO_SESSION, name: "Не вышли на смену"});
			}

			table.addQueue({id: table.BLOCKED, name: "Заблокированы"});
			table.addQueue( {id: table.NONE, name: "Не записаны"});
			/*
			 * If there are drivers who don't have access to any queues,
			 * add a special row for them.
			 */
			if( disp.haveNonQueueGroups() ) {
				table.addRow( {id: table.CITY, name: "Город"} );
			}
			table.addRule( '' );
		}

		disp.queues().forEach( function( q ) {
			table.addQueue( q );
		});
	}

	function fillDrivers()
	{
		var map = {};
		function push( qid, val ) {
			if( !(qid in map) ) map[qid] = [val];
			else map[qid].push( val );
		}

		if( !options.disableFakeQueues )
		{
			disp.drivers().forEach( function( d )
			{
				if( !d.online() ) return;
				if( disp.getDriverQueue( d.id ) ) {
					return;
				}
				if( disp.sessionRequired( d.id ) ) {
					push( table.NO_SESSION, d.id );
					return;
				}
				if( d.blocked() ) {
					push( table.BLOCKED, d.id );
					return;
				}
				if( disp.allowedQueues( d.id ).length == 0 ) {
					push( table.CITY, d.id );
					return;
				}
				push( table.NONE, d.id );
			});
		}

		disp.queues().forEach( function( q ) {
			disp.getQueueDrivers( q.id ).forEach( function( driver, pos ) {
				push( q.id, driver.id );
			});
		});
		table.setDrivers( map );
	}

	function trackDrivers()
	{
		/*
		 * When a driver's property has changed, update the icon.
		 */
		disp.on( 'driver-changed', function( e ) {
			items.update( e.data.driver.id );
		});
		/*
		 * When an order is changed, update the driver associated with
		 * that order.
		 */
		disp.on( 'order-changed', function( e ) {
			var id = e.data.order.taxi_id;
			if( id ) {
				items.update( id );
			}
		});
		/*
		 * When queue assignments have changed, simply recreate the
		 * picture.
		 */
		disp.on( "queue-assignments-changed", fillDrivers );
		disp.on( "driver-online-changed", fillDrivers );
		disp.on( "sessions-changed", fillDrivers );
		disp.on( "driver-block-changed", fillDrivers );
	}
}
