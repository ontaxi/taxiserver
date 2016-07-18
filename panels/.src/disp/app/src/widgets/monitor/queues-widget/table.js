function QueuesWidgetTable( disp, items )
{
	/*
	 * Construct the table
	 */
	var QUEUE_COLUMNS = 20;
	var s = '<table class="queues-table">';
	s += '<thead><tr><th>&nbsp;</th>';
	for( var i = 0; i < QUEUE_COLUMNS; i++ ) {
		s += '<th>' + (i+1) + '</th>';
	}
	s += '</tr></thead>';
	s += '<tbody></tbody></table>';

	var $table = $( s );
	var $tbody = $table.find( "tbody" );

	var queues = {};
	var listeners = new Listeners([ "head-click", "item-click" ]);

	this.root = function() {
		return $table.get(0);
	};

	this.on = listeners.add.bind( listeners );

	initEvents();

	//--

	function initEvents()
	{
		$table.on( 'click', 'td', convert );
		$table.on( 'contextmenu', 'td', convert );

		function convert( event )
		{
			event.preventDefault();
			var $t = $( event.target );
			var $tr = $t.parents( "tr" );

			var data = {
				qid: $tr.data( "qid" ),
				button: event.which - 1,
				ctrlKey: event.ctrlKey,
				shiftKey: event.shiftKey
			};

			if( $t.hasClass( "queue-head" ) ) {
				listeners.call( "head-click", data );
				return;
			}

			if( $t.hasClass( "car" ) ) {
				data.id = $t.data( "id" );
				listeners.call( "item-click", data );
				return;
			}
		}
	}

	this.initDragging = function( onDragStart, onDragEnd, onDragCancel )
	{
		$table.on( 'selectstart', function( event ) {
			event.preventDefault();
		});

		var opt = {};
		opt.onDragStart = function( item )
		{
			var $t = $( item );
			/*
			 * Only driver icons can be dragged.
			 */
			if( !$t.hasClass( "car" ) ) {
				return false;
			}
			var $td = $t.parent();
			var $tr = $td.parent();

			var data = {
				id: $t.data( "id" ),
				qid: $tr.data( "qid" ),
				pos: $td.data( "pos" )
			};

			return onDragStart( data );
		};

		opt.onDragEnd = function( item, dest )
		{
			var $t = $( item );
			var $td = $( dest );
			var $tr = $td.parent();

			/*
			 * Filter cells that are not part of queues.
			 */
			var pos = $td.data( "pos" );
			if( typeof pos == "undefined" ) {
				return false;
			}

			var data = {
				id: $t.data( "id" ),
				qid: $tr.data( "qid" ),
				pos: pos
			};
			return onDragEnd( data );
		};

		opt.onDragCancel = function( item ) {
			onDragCancel( item );
		};

		opt.itemsSelector = "td > *";
		opt.landsSelector = "td";
		initDrag( $table.get(0), opt );
	};

	this.empty = function() {
		$tbody.empty();
		queues = {};
	};

	this.addQueue = function( q, rows )
	{
		if( !rows ) rows = 1;
		var qid = q.id;

		var Q = {
			rows: [],
			cells: [],
			items: [],
			number: null
		};
		queues[qid] = Q;
		for( var i = 0; i < rows; i++ ) {
			createRow( Q, q );
		}

		for( i = 0; i < q.min; i++ ) {
			Q.cells[i].className = 'req';
		}
	};

	this.addRule = function( name )
	{
		name = name || '';
		var s = '<tr><th colspan="'+(QUEUE_COLUMNS + 1)+'">'+name+'</th></tr>';
		$table.append( s );
	};

	this.setDrivers = function( map )
	{
		removeDrivers();
		for( var qid in map )
		{
			var list = map[qid];
			var q = queues[qid];
			q.number.innerHTML = list.length;
			var n = list.length;
			for( var i = 0; i < n; i++ )
			{
				var id = list[i];
				if( i >= q.cells.length ) break;
				var item = items.get( id );
				items.update( id );
				q.items[i] = item;
				q.cells[i].appendChild( item );
			}
		}
	};

	function removeDrivers()
	{
		for( var qid in queues ) {
			queues[qid].items.forEach( function( item ) {
				item.remove();
			});
		}
	}

	this.selectQueues = function( ids, className )
	{
		highlightRows( ids.map( toInt ), className );
	};

	this.selectQueuesExcept = function( ids, className )
	{
		var ids = ids.map( toInt );
		var list = [];
		for( var qid in queues ) {
			qid = parseInt( qid, 10 );
			if( ids.indexOf( qid ) == -1 ) {
				list.push( qid );
			}
		}
		highlightRows( list, className );
	};

	function highlightRows( ids, className )
	{
		className = className || "highlight";
		for( var qid in queues )
		{
			qid = parseInt( qid, 10 );
			var $r = $( queues[qid].rows );
			if( ids.indexOf( qid ) >= 0 ) {
				$r.addClass( className );
			}
			else {
				$r.removeClass( className );
			}
		}
	}

	//--

	function createRow( Q, q )
	{
		var qid = q.id;

		var row = document.createElement( 'tr' );
		row.setAttribute( 'data-qid', qid );
		Q.rows.push( row );

		/*
		 * The leftmost cell, the head.
		 */
		var td = document.createElement( 'td' );
		td.className = 'queue-head';
		td.innerHTML = q.name;

		/*
		 * If this is a subqueue, add a class and a priority indicator.
		 */
		if( Q.rows.length == 1 && q.parent_id ) {
			var p = document.createElement( 'span' );
			p.className = 'priority';
			p.innerHTML = romanNumeral( q.priority + 1 );
			td.appendChild( p );
			row.className = 'subqueue';
		}

		/*
		 * Cars number indicator.
		 */
		var number = document.createElement( 'span' );
		number.className = 'number';
		Q.number = number;
		number.innerHTML = '0';
		td.appendChild( number );
		row.appendChild( td );

		for( var i = 0; i < QUEUE_COLUMNS; i++ )
		{
			td = document.createElement( 'td' );
			td.setAttribute( 'data-pos', Q.cells.length );
			Q.cells.push( td );
			row.appendChild( td );
		}
		$table.append( row );
	}
}
