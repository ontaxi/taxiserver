window.disp = new DispatcherClient();
$( document ).ready( function()
{
	disp.on( "ready", function() {
		initWidgets();
		initReminderScript( disp );
		initCalls( disp );
	});
	disp.on( "connection-error", function( event ) {
		if( event.data.error == "Unauthorised" ) {
			alert( "Ваша сессия была закрыта сервером, перезагрузите страницу." );
			return;
		}
		alert( "Ошибка соединения: " + event.data.error );
	});
	disp.on( "sync", function( event ) {
		alert( "Ваша сессия была закрыта сервером, перезагрузите страницу." );
		return;
	});
});

function initWidgets()
{
	/*
	 * Status bar and the settings button.
	 */
	var sb = addWidget( StatusBarWidget, "status-bar-container" );
	initSettings( disp, sb );

	/*
	 * Order button
	 */
	var $b = $( '<button type="button" id="order-button">Создать заказ (insert)</button>' );
	$b.appendTo( $( "#order-button-container" ) );
	$b.on( "click", function() {
		$b.addClass( "active" );
		orderForms.show();
		setTimeout( function() {
			$b.removeClass( "active" );
		}, 100 );
	});
	hotkeys.bind( "ins", function() {
		$b.click();
	});

	/*
	 * Orders list
	 */
	var orders = addWidget( OrdersWidget, "orders-container" );
	orders.on( "order-click", function( event ) {
		orderForms.show( event.data.order );
	});
	orders.on( "cancel-click", function( event ) {
		showCancelDialog( event.data.order );
	});

	/*
	 * Tabs
	 */
	initTabs();
}

function initTabs()
{
	var tabs = addWidget( TabsWidget, "tabs-container" );
	hotkeys.bind( 'alt+m', tabs.next );

	var monitor = initMonitorWidget( disp, tabs );
	initChat( disp, monitor.qw );

	var map = new MapWidget( disp );
	tabs.addTab( 'Карта', map.root() );
	tabs.PAGE_MAP = tabs.count() - 1;

	initAlerts( disp, tabs, map );

	var dw = new DriversTableWidget( disp );
	tabs.addTab( 'Водители', dw.root() );

	var orders = new OrdersTableWidget( disp );
	tabs.addTab( 'Заказы', orders.root() );

	var calc = new CalculatorWidget( disp );
	tabs.addTab( "Калькулятор", calc.root() );

	if( disp.sessionsEnabled() ) {
		initSessions( disp, tabs );
	}

	var log = new ServiceLogWidget( disp );
	tabs.addTab( 'Журнал', log.root() );
}

function addWidget( func, parentId )
{
	var w = new func( disp );
	document.getElementById( parentId ).appendChild( w.root() );
	return w;
}
