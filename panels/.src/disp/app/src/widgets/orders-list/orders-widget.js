function OrdersWidget( disp, options )
{
	options = options || {};
	var $container = createList();
	var listeners = new Listeners( ['order-click', 'cancel-click'] );

	this.on = listeners.add.bind( listeners );

	this.root = function() {
		return $container.get(0);
	};

	/*
	 * order id => array of timeouts.
	 */
	var timeouts = {};

	/*
	 * Fill the widget with orders from the current list.
	 */
	disp.orders().forEach( function( order ) {
		addOrder( order );
	});

	/*
	 * When orders change, update the widget.
	 */
	disp.on( 'order-changed', function( e ) {
		updateOrder( e.data.order );
	});
	disp.on( 'order-added', function( e ) {
		addOrder( e.data.order );
	});
	disp.on( 'order-removed', function( e ) {
		removeOrder( e.data.order );
	});

	//--

	/*
	 * Orders go into separate "sublists" depending on their status,
	 * and they are sorted by different time values depending of which
	 * sublist they are. To unify all that, every list item is assigned
	 * a "stamp" determined by order status and relevant time value.
	 */

	function createList()
	{
		var $list = $( '<div id="orders-widget">\
			<div class="postponed">\
				<div class="list"></div>\
			</div>\
			<div class="current">\
				<div class="list"></div>\
			</div>\
			<div class="closed">\
				<div class="list"></div>\
			</div>\
		</div>' );

		$list.on( 'click', '.order', function( event ) {
			var uid = $(this).data( 'uid' );
			var order = disp.getOrder( uid );
			listeners.call( 'order-click', {order: order} );
		});

		$list.on( 'click', '.cancel', function( event ) {
			event.stopPropagation();
			var $t = $( this ).parents( '.order' );
			var uid = $t.data( 'uid' );
			var order = disp.getOrder( uid );
			listeners.call( 'cancel-click', {order: order} );
		});

		return $list;
	}

	function addOrder( order )
	{
		var $el = $( '<div></div>' );
		$el.data( 'uid', order.order_uid );
		$el.data( 'stamp', orderStamp( order ) );
		updateItem( $el, order );
		insertItem( $el, order );
		addTimers( order, $el );
	};

	function updateOrder( order )
	{
		var $el = findItem( order );
		if( !$el ) {
			console.warn( "updateOrder: no element" );
			addOrder( order );
			return;
		}

		/*
		 * The order changed its class or time, remove its item and
		 * insert where appropriate.
		 */
		var oldStamp = parseInt( $el.data( 'stamp' ), 10 );
		var newStamp = orderStamp( order );
		if( newStamp != oldStamp ) {
			$el.data( 'stamp', newStamp );
			$el.detach();
			insertItem( $el, order );
		}
		updateItem( $el, order );

		removeTimers( order );
		addTimers( order, $el );
	};

	/*
	 * Remove the given order from the list.
	 */
	function removeOrder( order )
	{
		var $el = findItem( order );
		if( !$el ) {
			console.warn( "removeOrder: no element" );
			return;
		}
		$el.remove();
		$el = null;

		/*
		 * If have timers, remove them.
		 */
		removeTimers( order );
	};

	// --

	function orderStamp( order )
	{
		if( order.postponed() ) {
			return order.exp_arrival_time;
		}
		if( order.closed() ) {
			return -order.time_created;
		}
		return order.time_created;
	}

	function insertItem( $el, order )
	{
		var $list = getList( order );
		var $nextItem = findNextItem( $list, $el );
		if( $nextItem ) {
			$el.insertBefore( $nextItem );
		} else {
			$list.append( $el );
		}
	}

	/*
	 * Finds the element in the list before which the $el element must
	 * be inserted. Returns null if $el must be placed at the end of
	 * the list.
	 */
	function findNextItem( $list, $el )
	{
		var $next = null;
		var stamp = parseInt( $el.data( 'stamp' ), 10 );
		$list.find( '.order' ).each( function()
		{
			var $t = $( this );
			if( parseInt( $t.data( 'stamp' ), 10 ) >= stamp ) {
				$next = $t;
				return false;
			}
		});
		return $next;
	}

	/*
	 * Returns element from the lists for the given order.
	 */
	function findItem( order )
	{
		var $item = null;
		$container.find( '.order' ).each( function()
		{
			var $t = $( this );
			if( $t.data( 'uid' ) == order.order_uid ) {
				$item = $t;
				return false;
			}
		});
		return $item;
	}

	/*
	 * Returns the list to put the given order in.
	 * There are several sublists in which order are put depending on
	 * their status.
	 */
	function getList( order )
	{
		if( order.postponed() ) {
			return $container.find( '.postponed .list' );
		}
		if( order.closed() ) {
			return $container.find( '.closed .list' );
		}
		return $container.find( '.current .list' );
	}

	function updateItem( $el, order )
	{
		var el = $el.get(0);
		el.className = 'order ' + getClassName( order );
		var s = '';
		if( order.status != order.CANCELLED ) {
			s += '<div class="cancel">Отменить</div>';
		}
		s += '<div class="number">№ ' + order.order_id + '</div>';
		if( !options.hideAddresses ) {
			s += '<div class="address">' + formatOrderDestination( order ) + '</div>';
		}
		s += '<div class="comments">' + html.escape( order.comments ) + '</div>';
		s += '<div class="customer">' + formatCustomer( order ) + '</div>';
		s += '<div class="status">' + formatStatus( order ) + '</div>';
		s += '<div class="driver">' + formatDriver( order ) + '</div>';
		el.innerHTML = s;
	}

	function addTimers( order, $el )
	{
		if( !order.postponed() ) return;
		var a = [];

		var times = [
			order.reminder_time - time.utc() - 300, // "soon"
			order.exp_arrival_time - time.utc(), // "urgent"
			order.reminder_time - time.utc() // "expired"
		];

		times.forEach( function( t ) {
			if( t <= 0 ) return;
			var tid = setTimeout( updateItem.bind( undefined, $el, order ), t * 1000 );
			a.push( tid );
		});

		if( a.length > 0 ) {
			timeouts[order.id] = a;
		}
	}

	function removeTimers( order )
	{
		if( order.id in timeouts ) {
			var a = timeouts[order.id];
			delete timeouts[order.id];
			while( a.length ) clearTimeout( a.shift() );
		}
	}

	//--

	function getClassName( order )
	{
		if( !order.postponed() ) {
			return order.closed() ? 'closed' : 'current';
		}

		var now = time.utc();
		var t1 = order.reminder_time;
		var t2 = order.exp_arrival_time;
		if( t1 > t2 ) {
			t1 = t2;
		}

		// Enough time - green.
		if( now < t1 ) {
			return 'far';
		}
		// after reminder - yellow
		if( now < t2 ) {
			return 'soon';
		}
		// 10 minutes late - red
		if( now < t2 + 600 ) {
			return 'urgent';
		}
		// expired.
		return 'expired';
	}

	function formatOrderDestination( order )
	{
		var addr;
		var loc = disp.getLocation( order.src_loc_id );
		if( loc ) {
			addr = '<span class="location">' + loc.name + '</span>';
		}
		else {
			addr = order.formatAddress();
		}
		return addr;
	}

	function formatCustomer( order )
	{
		var n = order.customer_phone;
		if( !n || n == '' || n == '+375' ) {
			return '';
		}
		return fmt( '<a href="tel:%s">%s</a>',
			order.customer_phone, formatPhone( order.customer_phone )
		);
	}

	function formatStatus( order )
	{
		var s = order.statusName();
		if( order.postponed() ) {
			s += ", подать в " + formatTime( order.exp_arrival_time );
		}
		else {
			s = formatTime( order.time_created ) + ", " + s;
		}
		return s;
	}

	/*
	 * Write a UTC time as a readable local time string.
	 */
	function formatTime( t )
	{
		/*
		 * As we receive a pure UTC, we have to compensate for the
		 * client's wrong clock.
		 */
		t = time.local( t );
		var d = new Date( t * 1000 );
		var s = fmt( "%02d:%02d", d.getHours(), d.getMinutes() );

		var now = new Date( time.utc() * 1000 );
		if( d.getDate() == now.getDate()
			&& d.getMonth() == now.getMonth()
			&& d.getFullYear() == now.getFullYear() ) {
			return s;
		}

		var diff = (d.getTime() - now.getTime()) / 1000 / 3600 / 24;

		if( diff > 0 && diff < 1 ) {
			s += " завтра";
		}
		else if( diff < 0 && diff > -1 ) {
			s += " вчера";
		}
		else {
			var monthNames = [
				'января', 'февраля', 'марта', 'апреля', 'мая',
				'июня', 'июля', 'августа', 'сентября', 'октября',
				'ноября', 'декабря'
			];
			s += ", " + d.getDate() + " " + monthNames[d.getMonth()];
		}

		return s;
	}

	function formatDriver( order )
	{
		var taxi = disp.getDriver( order.taxi_id );
		var call_id = taxi ? taxi.call_id : null;
		if( call_id ) {
			return call_id;
		}
		return '';
	}
}
