function QueuesWidgetItems( disp )
{
	var items = {};
	var selections = {};

	this.select = function( filter, className )
	{
		if( !className ) className = "highlight";

		if( !filter ) {
			filter = [];
		}
		selections[className] = filter;
		sync( className );
	};

	this.selectedItems = function( className )
	{
		if( !className ) className = "highlight";
		var list = [];
		for( var id in items ) {
			if( items[id].hasClass( className ) ) {
				list.push( id );
			}
		}
		return list;
	};

	this.addSelection = function( id, className )
	{
		if( !className ) className = "highlight";

		breakConditions( className );

		if( !(id in items) || (items[id].hasClass( className )) ) {
			return;
		}

		selections[className].push( {id: id} );
		items[id].addClass( className );
	};

	this.removeSelection = function( id, className )
	{
		if( !className ) className = "highlight";

		breakConditions( className );

		if( !(id in items) || (!items[id].hasClass( className )) ) {
			return;
		}

		var pos = -1;
		var n = selections[className].length;
		for( var i = 0; i < n; i++ ) {
			if( selections[className][i].id == id ) {
				pos = i;
				break;
			}
		}
		if( pos == -1 ) {
			return;
		}
		selections[className].splice( pos, 1 );
		items[id].removeClass( className );
	};

	this.toggleSelection = function( id, className )
	{
		if( !className ) className = "highlight";

		if( !(id in items) ) {
			return;
		}

		if( items[id].hasClass( className ) ) {
			this.removeSelection( id, className );
		}
		else {
			this.addSelection( id, className );
		}
	};

	this.invertSelection = function( id, className )
	{
		if( !className ) className = "highlight";

		selections[className] = [];
		for( var id in items )
		{
			var item = items[id];
			if( item.hasClass( className ) ) {
				item.removeClass( className );
			}
			else {
				item.addClass( className );
				selections[className].push( {id: id} );
			}
		}
	};

	//--

	/*
	 * Replaces meta conditions with explicit id conditions.
	 */
	function breakConditions( className )
	{
		var cond = [];
		for( var id in items )
		{
			if( items[id].hasClass( className ) ) {
				cond.push( {id: id} );
			}
		}
		selections[className] = cond;
	}

	function sync( className )
	{
		var cond = selections[className];
		if( !cond ) return;

		for( var id in items )
		{
			var driver = disp.getDriver( id )
			if( match( driver, cond ) ) {
				items[id].addClass( className );
			}
			else {
				items[id].removeClass( className );
			}
		}
	}

	function match( driver, cond )
	{
		var n = cond.length;
		if( n == 0 ) return false;
		for( var i = 0; i < n; i++ ) {
			if( obj.match( driver, cond[i] ) ) {
				return true;
			}
		}
		return false;
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
		if( !car ) {
			return "no-car";
		}

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
			var filters = selections[selectClass];
			for( var i = 0; i < filters.length; i++ )
			{
				var f = filters[i];
				if( obj.match( taxi, f ) ) {
					className += ' ' + selectClass;
					break;
				}
			}
		}

		return className;
	}

	function getTitle( id )
	{
		var driver = disp.getDriver( id );
		var car = disp.getDriverCar( id );
		var parts = [];
		if( car ) parts.push( car.format() );
		parts.push( driver.format() );
		parts.push( driver.blockDesc() );
		parts = parts.filter( hasValue );
		return parts.join( ', ' );
	}
}
