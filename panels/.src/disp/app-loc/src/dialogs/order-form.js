var orderForms = (function() {

	var currentForms = [];

	/*
	 * Order form display function and related events.
	 */
	function show( order )
	{
		/*
		 * If form for this order is already shown, focus on it.
		 */
		var form = findOrderForm( order );
		if( form ) {
			form.layer.focus();
			return;
		}

		/*
		 * Create the form and put it on a draggable layer.
		 */
		var form = new OrderForm( order );
		if( order && !order.canEdit() ) {
			form.lock();
		}
		var layer = Layers.create( form.root() );
		form.layer = layer;
		currentForms.push( form );

		function closeForm()
		{
			var index = -1;
			for( var i = 0; i < currentForms.length; i++ ) {
				if( currentForms[i] == form ) {
					index = i;
					break;
				}
			}
			delete form.layer;
			layer.remove();
			currentForms.splice( index, 1 );
		}

		/*
		 * When the form's "cancel" button is clicked, remove the layer.
		 */
		form.on( "cancel", function() {
			closeForm();
		});

		/*
		 * When the form is submitted, save the order.
		 */
		form.on( "submit", function( event )
		{
			order = event.data.order;
			var driverId = event.data.driverId;
			var driver = disp.getDriver( driverId );

			if( driver && !driver.online() ) {
				(new Dialog( "Выбранный водитель сейчас не на связи" )).show();
				return;
			}

			if( driver && disp.sessionRequired( driverId ) ) {
				(new Dialog( "Выбранный водитель не вышел на смену" )).show();
				return;
			}

			form.lock( "Отправка заказа" );
			var p;
			if( order.postponed() ) {
				p = disp.saveOrder( order )
				.then( function() {
					toast( "Заказ сохранён" );
				});
			}
			else {
				p = disp.saveOrder( order )
				.then( function( val ) {
					if( driver ) {
						form.lock( "Ждём ответа от водителя" );
					} else {
						form.lock( "Идёт поиск водителя" );
					}
					return disp.sendOrder( order, driverId );
				})
				.then( function( assignedDriver ) {
					var car = disp.getDriverCar( assignedDriver.id );
					var text = orderDesc( order, assignedDriver, car );
					(new Dialog( text )).show();
				});
			}

			/*
			 * On success close the form.
			 */
			p.then( function() {
				closeForm();
			});
			/*
			 * On error show error message and leave the form open and
			 * unlocked.
			 */
			p.catch( function( error )
			{
				var msg;
				switch( error )
				{
					case 'dropped':
						if( driver ) {
							msg = "Водитель не принял заказ";
						} else {
							msg = "Никто не взял заказ";
						}
						break;
					default:
						msg = "Не удалось отправить заказ: " + error;
				}

				var d = new Dialog( msg );
				d.addButton( "OK", function() {
					d.close();
					form.unlock();
					layer.focus();
				}, "yes" );
				d.show();
			});
		});

		return form;
	}

	/*
	 * Returns a string describing an assigned order.
	 */
	function orderDesc( order, driver, car )
	{
		var info = [];

		var loc = disp.getLocation( order.src_loc_id );
		if( loc ) {
			info.push( '&laquo;' + loc.name + '&raquo;' );
		}
		info.push( order.formatAddress() );
		info.push( 'Водитель &mdash; ' + driver.call_id );
		info.push( car.format() );

		var waitTime = order.exp_arrival_time - time.utc();
		if( waitTime > 0 )
		{
			waitTime = Math.ceil( waitTime / 60 );
			if( waitTime > 1 ) {
				waitTime = waitTime + ' мин.';
			} else {
				waitTime = 'минуту';
			}
			info.push( 'Прибудет через ' + waitTime );
		}
		return info.join( '<br>' );
	}

	function getFocusForm()
	{
		return currentForms.find( function( f ) {
			return f.layer.hasFocus();
		});
	}

	function formIndex( order )
	{
		if( !order ) return -1;
		for( var i = 0; i < currentForms.length; i++ ) {
			if( currentForms[i].orderId() == order.order_uid ) {
				return i;
			}
		}
		return -1;
	}

	function findOrderForm( order )
	{
		var i = formIndex( order );
		return (i == -1)? null : currentForms[i];
	}

	return {
		show: show,
		getFocusForm: getFocusForm,
		findOrderForm: findOrderForm
	};
})();
