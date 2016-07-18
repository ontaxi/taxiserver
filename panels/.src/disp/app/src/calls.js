function initCalls( disp )
{
	// call_id => {form, deviceName, sent}
	var calls = {};

	disp.on( 'line-connected', function( event ) {
		toast( "Подсоединена линия: " + event.data.line_id );
	});

	disp.on( 'line-disconnected', function( event ) {
		toast( "Линия &laquo;" + event.data.line_id + "&raquo; отключилась" );
	});

	disp.on( 'call-accepted', function( event )
	{
		var phone = event.data.caller_id;
		var lineId = event.data.line_id;
		var callId = event.data.call_id;
		var city = event.data.city || disp.param( "default_city" );
		var t = time.local( event.data.time );

		/*
		 * Open a new order form and put the client's number in.
		 */
		var order = new Order({
			src: {
				addr: { place: city },
				loc_id: null
			}
		});
		order.call_id = callId;

		var form = orderForms.show( order );
		form.setCustomerPhone( phone, true );
		var title = fmt( "%s, поступил в %s, разговор",
			lineId, formatTime( t ) );
		form.setTitle( title, 'speaking' );

		calls[callId] = {
			form: form,
			lineId: lineId,
			sent: false,
			time: t
		};

		form.on( 'submit', function() {
			calls[callId].sent = true;
		});

		form.layer.onRemove( function() {
			delete calls[callId];
		});
	});

	disp.on( 'call-ended', function( event )
	{
		var callId = event.data.call_id;
		var call = calls[callId];
		if( !call ) {
			return;
		}

		var lineId = call.lineId;
		var form = call.form;
		var t = call.time;

		var title = fmt( "%s, поступил в %s, разговор окончен",
			lineId, formatTime( t ) );
		form.setTitle( title, 'hangup' );

		/*
		 * If the order hasn't been sent, ask why.
		 */
		if( !call.sent )
		{
			var $c = $( '<div><label>Причина</label><textarea></textarea></div>' );
			var d = new Dialog( $c );
			d.setTitle( "Заказ не отправлен" );
			d.addButton( 'Закрыть', function() {
				var reason = $c.find( 'textarea' ).val();
				d.close();
			});
			d.show();
		}
	});
}
