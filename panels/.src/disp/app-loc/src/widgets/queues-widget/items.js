function QueuesWidgetItems( disp )
{
	var items = {};
	var selections = {};

	this.select = function( filter, className )
	{
		if( !className ) className = "highlight";
		if( !filter ) {
			unselect( className );
			return;
		}

		selections[className] = filter;
		for( var id in items )
		{
			var d = disp.getDriver( id );
			if( obj.match( d, filter ) ) {
				items[id].addClass( className );
			}
			else {
				items[id].removeClass( className );
			}
		}
	};

	function unselect( className )
	{
		if( !(className in selections ) ) {
			return;
		}
		delete selections[className];
		for( var id in items ) {
			items[id].removeClass( className );
		}
	}

	this.get = function( id )
	{
		/*
		 * If not in cache, create and save.
		 */
		if( !(id in items) ) {
			items[id] = create( id );
			update( id );
		}
		return items[id].get(0);
	};

	this.update = update;

	//--

	function create( id )
	{
		var driver = disp.getDriver( id );
		var $icon = $( '<div class="car" data-id="'+id+'">'+driver.call_id+'</div>' );
		return $icon;
	}

	function update( id )
	{
		if( !(id in items) ) {
			return;
		}
		var icon = items[id].get(0);

		var className = getClassName( id );
		if( className != icon.className ) {
			icon.className = className;
		}

		var title = getTitle( id );
		if( title != icon.title ) {
			icon.title = title;
		}
	}

	function getClassName( id )
	{
		var taxi = disp.getDriver( id );
		var car = disp.getDriverCar( id );

		var className = 'car';
		if( car.body_type ) className += ' ' + car.body_type;

		var currentOrders = disp.getDriverOrders( id ).filter( function( o ) {
			return !o.closed();
		});
		if( currentOrders.length > 0 || taxi.is_busy == 1 ) {
			className += ' busy';
		}

		/*
		 * If the driver is in a queue and is too far from its location,
		 * add "away" class.
		 */
		var q = disp.getDriverQueue( id );
		var d = disp.getDriver( id );
		if( q ) {
			var d = geo.distance( d.coords(), q.coords() );
			if( d > 200 ) {
				className += ' away';
			}
		}

		if( !taxi.online() ) {
			className += ' offline';
		}

		if( taxi["is_fake"] == '1' ) {
			className += ' fake';
		}

		/*
		 * If the driver falls into a previously defined selection,
		 * add the corresponding class.
		 */
		for( var selectClass in selections )
		{
			var filter = selections[selectClass];
			if( obj.match( taxi, filter ) ) {
				className += ' ' + selectClass;
			}
		}

		return className;
	}

	function getTitle( id )
	{
		var driver = disp.getDriver( id );
		var car = disp.getDriverCar( id );
		var parts = [
			car.format(), driver.format(), driver.blockDesc()
		].filter( hasValue );
		return parts.join( ', ' );
	}
}
