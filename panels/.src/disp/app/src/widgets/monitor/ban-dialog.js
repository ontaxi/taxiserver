function showBanDialog( driverId )
{
	var driver = disp.getDriver( driverId );

	var $s = $( '<div>'
		+ 'Заблокировать водителя ' + driver.call_id + ' на '
		+ '<input type="number" min="10" step="10" value="10" size="3"> мин.'
		+ '<br><label>Причина:</label><input name="reason">'
		+ '</div>' );

	var d = new Dialog( $s.get(0) );
	d.addButton( "Заблокировать", function()
	{
		var minutes = $s.find( 'input[type="number"]' ).val();
		var reason = $s.find( 'input[name="reason"]' ).val();
		var seconds = minutes * 60;
		disp.blockDriver( driverId, seconds, reason );
		d.close();
	}, "yes" );
	d.addButton( "Отменить", null, "no" );
	d.show();
}

function showUnbanDialog( driverId )
{
	var driver = disp.getDriver( driverId );

	var d = new Dialog( "Разблокировать водителя " + driver.call_id + "?" );
	d.addButton( "Да", function() {
		disp.unblockDriver( driverId );
		d.close();
	}, "yes" );
	d.addButton( "Нет", null, "no" );
	d.show();
}
