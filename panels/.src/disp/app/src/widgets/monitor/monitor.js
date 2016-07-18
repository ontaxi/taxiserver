/*
 * "Monitor" is the widgets combo on the first tab: imitations button,
 * drivers filter and queues table.
 */
function initMonitorWidget( disp, tabs )
{
	var $p = $( '<div></div>' );
	if( disp.imitationsEnabled() ) {
		var im = new ImitationsWidget( disp );
		$p.append( im.root() );
	}
	var filterWidget = new DriversFilterWidget( disp );
	$p.append( filterWidget.root() );

	var $invertButton = $( '<button type="button">Инвертировать</button>' );
	$invertButton.appendTo( filterWidget.root() );

	/*
	 * Button for sending announces.
	 */
	var $announceButton = $( '<button type="button">Отправить сообщение</button>' );
	$announceButton.appendTo( filterWidget.root() );

	var qw = new QueuesWidget( disp );
	$p.append( qw.root() );

	tabs.addTab( "Очереди", $p.get(0) );

	filterWidget.onChange( function( filter ) {
		qw.selectDrivers( filter );
		syncAnnounceButton();
	});

	/*
	 * On Ctrl-left-click toggle the clicked driver's selection.
	 */
	qw.on( "driver-click", function( event )
	{
		if( !event.data.ctrlKey || event.data.button != 0 ) {
			return;
		}
		qw.toggleSelection( event.data.driver.id );
		filterWidget.clear();
		syncAnnounceButton();
	});

	/*
	 * On invert button click invert the selection.
	 */
	$invertButton.on( "click", function() {
		qw.invertSelection();
		filterWidget.clear();
		syncAnnounceButton();
	});

	syncAnnounceButton();
	function syncAnnounceButton() {
		$announceButton.prop( "disabled", qw.selectedDrivers().length == 0 );
	}

	/*
	 * When the button is clicked, open a new announcement dialog.
	 */
	$announceButton.on( "click", function()
	{
		var d = new AnnounceDialog( disp, qw.selectedDrivers() );
		d.show();
	});

	return {
		qw: qw
	};
}
