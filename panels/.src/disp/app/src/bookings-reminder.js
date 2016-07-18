function initReminderScript( disp )
{
	var dialog = null;
	var sound = sounds.track( "/res/dispatcher/phone.ogg" );

	setInterval( check, 5000 );
	/*
	 * Checks if there are postponed orders that have to be processed
	 * now.
	 */
	function check()
	{
		/*
		 * If a dialog is already shown, don't check.
		 */
		if( dialog ) {
			return;
		}

		var now = time.utc();
		disp.orders().some( function( order )
		{
			if( !order.postponed() ) return false;

			if( now < order.reminder_time ) {
				return false;
			}

			return showReminder( order );
		});
	}

	function showReminder( order )
	{
		/*
		 * If we are editing this order now, don't pop up.
		 */
		if( orderForms.findOrderForm( order ) ) {
			return false;
		}

		var now = time.utc();

		dialog = new Dialog( formatOrderDescription( order ) );
		dialog.addButton( "Отправить заказ...", function()
		{
			order.exp_arrival_time = null;
			orderForms.show( order );
			sound.stop();
			dialog.close();
			dialog = null;
		}, "yes" );

		dialog.addButton( "Напомнить через минуту", function()
		{
			order.reminder_time = now + 60;
			dialog.close();
			dialog = null;
			sound.stop();
			check();
		}, "no" );

		dialog.show();
		sound.play();
		return true;
	}

	function formatOrderDescription( order )
	{
		var parts = [];
		parts.push( order.formatAddress() );

		var loc = disp.getLocation( order.src_loc_id );
		if( loc ) {
			parts.push( '&laquo;' + loc.name + '&raquo;' );
		}

		if( order.exp_arrival_time ) {
			parts.push( orderPostponeDescription( order ) );
		}
		parts.push( order.formatOptions() );

		return parts.join( '<br>' );
	}

	function orderPostponeDescription( order )
	{
		var dt = order.exp_arrival_time - time.utc();
		if( dt >= 0 ) {
			return 'Подать машину в '
				+ formatTime( time.local( order.exp_arrival_time ) )
				+ ' (через ' + formatSeconds( dt ) + ')';
		}
		else {
			return 'Машина должна была быть подана в '
				+ formatTime( time.local( order.exp_arrival_time ) )
				+ ' (' + formatSeconds( -dt ) + ' назад)';
		}
	}
}
