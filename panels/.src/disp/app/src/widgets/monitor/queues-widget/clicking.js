function initQueueClicking( disp, table, listeners )
{
	/*
	 * Split the click events into explicit left-click and right-click
	 * types.
	 */
	table.on( "item-click", function( event )
	{
		var driver = disp.getDriver( event.data.id );
		var queue = disp.getQueue( event.data.qid );

		listeners.call( "driver-click", {
			driver: driver,
			button: event.data.button,
			ctrlKey: event.data.ctrlKey
		} );

		if( event.data.button == 0 ) {
			return driverLeftClick( driver, queue, event );
		} else {
			return driverRightClick( driver, queue, event );
		}
	});

	table.on( "head-click", function( event )
	{
		var queue = disp.getQueue( event.data.qid );
		if( !queue ) return;
		if( event.data.button == 0 ) {
			return queueLeftClick( queue );
		} else {
			return queueRightClick( queue );
		}
	});

	//--

	function driverLeftClick( driver, queue, event )
	{
		if( event.data.ctrlKey ) {
			return;
		}
		/*
		 * If there is an open editable form, update it with the
		 * driver.
		 */
		var form = orderForms.getFocusForm();
		if( form && !form.locked() ) {
			form.setDriver( driver.id );
			return;
		}

		/*
		 * If can't send an order to this driver, ignore the click.
		 */
		if( driver.blocked() || disp.sessionRequired( driver.id ) ) {
			return;
		}

		/*
		 * Create new form and set the driver and the queue in it.
		 */
		var form = orderForms.show();
		if( queue ) {
			form.setQueue( queue.id );
		}
		form.setDriver( driver.id );
	}

	function driverRightClick( driver, queue )
	{
		if( driver.is_fake != '1' ) {
			return;
		}

		var d = new Dialog( "Убрать " + driver.call_id + "?" );
		d.addButton( "Да", function() {
			disp.setDriverOnline( driver.id, false ).catch( function( error ) {
				Dialog.show( "Ошибка: " + error );
			});
			d.close();
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}

	function queueLeftClick( queue )
	{
		/*
		 * If this is not a location queue, ignore the click.
		 */
		if( !disp.getQueueLocation( queue.id ) ) {
			return;
		}
		/*
		 * If there is an open editable form, update it with the queue.
		 */
		var form = orderForms.getFocusForm();
		if( form && !form.locked() ) {
			form.setQueue( queue.id );
			return;
		}
		/*
		 * Otherwise create a new form and the the queue in it.
		 */
		var form = orderForms.show();
		form.setQueue( queue.id );
	}

	/*
	 * Show a dialog with queue settings.
	 */
	function queueRightClick( queue )
	{
		var s = '<div>'
			+ '<div>'
			+ '<label>Количество дежурных машин</label>'
			+ '<input type="number" min="0" step="1"'
				+ ' name="min" value="'+queue.min+'">'
			+ '</div>';

		/*
		 * For subqueues show also priority value.
		 */
		if( queue.parent_id ) {
			s += '<div>'
			+ '<label>Приоритет (0&ndash;9)</label>'
			+ '<input type="number" min="0" max="9" step="1"'
				+ ' name="priority" value="'+queue.priority+'">'
			+ '</div>';
		} else {
			s += '<input type="hidden" name="priority" value="'+queue.priority+'">';
		}

		s += '</div>';

		var $src = $( s );

		var d = new Dialog( $src.get(0) );
		d.addButton( "Изменить", function() {
			var min = $src.find( '[name="min"]' ).val();
			var priority = $src.find( '[name="priority"]' ).val();
			if( priority < 0 || priority > 9 ) {
				toast( "Недопустимое значение приоритета: " + priority );
				return;
			}
			if( min < 0 ) {
				toast( "Недопустимое значение количества дежурных: " + min );
				return;
			}
			disp.changeQueue( queue.id, min, priority );
			d.close();
		}, "yes" );
		d.addButton( "Отменить", null, "no" );
		d.setTitle( fmt( "Очередь «%s»", queue.name ) );
		d.show();
	}
}
