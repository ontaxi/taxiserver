/*
 * Top-level view of the whole program.
 */

window.disp = new DispatcherClient();

disp.on( 'ready', function()
{
	$(document).ready( function() {
		main();
	});
});

function main() {
	createOrderButton( document.getElementById( 'button-container' ) );
	createQueuesWidget( document.getElementById( 'queues-container' ) );
	createOrdersWidget( document.getElementById( 'orders-container' ) );
}

//--

function createOrderButton( container ) {
	/*
	 * Draw the button.
	 */
	var $b = $( '<button id="order-button">Заказ (insert)</button>' );
	$b.appendTo( container );
	/*
	 * When the button is clicked, show new order form.
	 */
	$b.on( 'click', function() {
		$b.addClass( 'active' );
		orderForms.show();
		setTimeout( function() {
			$b.removeClass( 'active' );
		}, 100 );
	});

	hotkeys.bind( "ins", function() {
		$b.click();
	});
}

function createQueuesWidget( container )
{
	var qw = new QueuesWidget( disp, {
		disableDragging: true,
		disableFakeQueues: true
	});
	container.appendChild( qw.root() );
}

/*
 * Widget with list of current orders.
 */
function createOrdersWidget( container )
{
	/*
	 * Create orders widget and fill it with current orders.
	 */
	var ow = new OrdersWidget( disp, {hideAddresses: true} );
	container.appendChild( ow.root() );

	ow.on( 'order-click', function( e ) {
		var order = e.data.order;
		orderForms.show( order );
	});

	ow.on( 'cancel-click', function( e ) {
		var order = e.data.order;
		showCancelDialog( order );
	});
}
