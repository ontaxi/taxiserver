var OrderForm = ( function() {

function OrderForm( order )
{
	var listeners = new Listeners([
		"cancel",
		"submit"
	]);
	this.on = listeners.add.bind( listeners );

	var $container = $( '<form class="order-form"></form>' );
	/*
	 * Form title, for order number.
	 */
	var $title = $( '<div></div>' );
	$container.append( $title );

	var driver = new DriverSection( div() );
	var options = new OptionsSection( div() );
	var customer = new CustomerSection( div() );
	//$container.append( '<b>Место подачи</b>' );
	//var from = new AddressGroupSection( $container );
	$container.append( '<b>Место назначения</b>' );
	var to = new AddressGroupSection( div( 'dest-section' ), 'dest' );
	var postpone = new PostponeSection( div() );

	/*
	 * When a driver is specified, turn the options off.
	 */
	driver.onChange( syncOptions );

	//customer.onAddress( function( addr ) {
	//	from.set({addr: addr, loc_id: null});
	//});

	this.setDriver = function( id ) {
		driver.set( id );
		syncOptions();
	};

	function syncOptions() {
		if( driver.get() != '0' ) {
			options.disable();
		} else {
			options.enable();
		}
	}

	/*
	 * Comments input.
	 */
	var $comments = $( html.textarea( "Комментарии" ) );
	div().append( $comments );
	$comments = $comments.filter( 'textarea' );
	/*
	 * Status string, for progress reports.
	 */
	var $status = $( '<div class="status"></div>' );
	$container.append( $status );
	/*
	 * Buttons.
	 */
	addButtons();

	var $controls = $container.find( "input, select, button:not(.cancel), textarea" );

	function div( className ) {
		var $d = $( '<div></div>' );
		if( className ) $d.addClass( className );
		$container.append( $d );
		return $d;
	}

	if( order ) {
		$title.html( "Заказ № " + order.order_id );
		options.set( order );
		customer.set( order );
		$comments.val( order.comments );
		postpone.set( order );
		//from.set( order.src );
		to.set( order.dest );
	}
	else {
		$title.html( "Новый заказ" );
	}

	this.root = function() {
		return $container.get(0);
	};

	this.lock = function( status ) {
		$status.html( status );
		$controls.prop( "disabled", true );
	};

	this.unlock = function() {
		$status.html( "" );
		$controls.prop( "disabled", false );
	};

	this.locked = function() {
		return $controls.prop( "disabled" );
	};

	this.orderId = function() {
		if( !order ) return null;
		return order.order_uid;
	};

	this.setQueue = function( qid ) {
		// from.setQueue( qid );
	};

	function addButtons()
	{
		var $ok = $( '<button type="button">Отправить</button>' );
		var $no = $( '<button type="button" class="cancel">Закрыть</button>' );
		$container.append( $ok ).append( $no );
		$ok.on( 'click', function() {
			listeners.call( "submit", {
				order: getOrder(),
				driverId: driver.get()
			});
		});
		$no.on( "click", function() {
			listeners.call( "cancel" );
		});
	}

	function getOrder()
	{
		var data = obj.merge(
			options.get(),
			customer.get(),
			postpone.get()
		);
		data.comments = $comments.val();
		data.status = Order.prototype.POSTPONED;
		data.src = {
			addr: new Address({place: "", street: "", house: "", building: "", entrance: ""}),
			loc_id: null
		};
		data.dest = to.get();

		if( order ) {
			for( var k in data ) {
				order[k] = data[k];
			}
		} else {
			order = new Order( data );
		}

		return order;
	}
}

return OrderForm;
})();
