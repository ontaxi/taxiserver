function SessionsWidget( disp )
{
	var $container = $( '<div></div>' );

	this.root = function() {
		return $container.get(0);
	};

	var $button = $( '<button type="button">Открыть смену</button>' );
	$button.on( 'click', function() {
		showOpenSessionDialog();
	});
	$container.append( $button );

	var $table = $( '<table class="items"><thead>'
		+ '<tr><th>Начало</th>'
		+ '<th>Водитель</th>'
		+ '<th>Машина</th>'
		+ '<th></th>'
		+ '</thead><tbody></tbody>' );
	var $tbody = $table.find( 'tbody' );
	$container.append( $table );
	$tbody.on( 'click', 'button', function( event )
	{
		var driver_id = $( this ).data( 'driver_id' );
		if( !driver_id ) {
			return;
		}
		closeSessionClick.call( this, driver_id );
	});

	disp.on( 'sessions-changed', refresh );
	refresh();

	//--

	function closeSessionClick( driver_id )
	{
		var button = this;

		var d = disp.getDriver( driver_id );
		/*
		 * If the driver is an imitation, close the session without
		 * asking.
		 */
		if( d.is_fake == '1' ) {
			button.disabled = true;
			disp.closeSession( driver_id, 0 );
			return;
		}
		/*
		 * If the driver is real, ask for the odometer value before
		 * closing.
		 */
		showCloseSessionDialog( driver_id );
	}

	function refresh()
	{
		var str = '';
		disp.sessions().forEach( function( s )
		{
			var driver = disp.getDriver( s.driver_id );
			var car = disp.getDriverCar( s.driver_id );
			str += '<tr><td>' + formatDateTime( time.local( s.time_started ) ) + '</td>'
			+ '<td>' + driver.call_id + '</td>'
			+ '<td>' + car.name + '</td>'
			+ '<td><button type="button" data-id="'+s.session_id+'" data-driver_id="'+s.driver_id+'">Закрыть</button>'
			+ '</tr>';
		});
		$tbody.html( str );
	}
}

var curOpenSessionDialog = null;

function showOpenSessionDialog( driverId )
{
	if( driverId && !disp.sessionRequired( driverId ) ) {
		return;
	}

	if( curOpenSessionDialog && curOpenSessionDialog.isOpen() ) {
		curOpenSessionDialog.focus();
		return;
	}

	var drivers = disp.drivers();

	var s = '<select><option value="0"></option>';
	var n = 0;
	disp.drivers().forEach( function( driver ) {
		if( !disp.sessionRequired( driver.driver_id ) ) {
			return;
		}
		n++;
		s += tpl( '<option value="?">? - ?</option>',
			driver.id, driver.call_id, driver.surname() );
	});
	s += '</select>';

	if( !n ) {
		toast( "Все смены уже открыты" );
		return;
	}

	s = '<div><label>Водитель</label>' + s + '</div>'
		+ '<div><label>Одометр</label>'
		+ '<input type="number" min="0" step="1"></div>';
	var $s = $( '<div>' + s + '</div>' );
	var $id = $s.find( 'select' );
	var $km = $s.find( 'input' );

	if( driverId ) {
		$id.val( driverId );
	}

	curOpenSessionDialog = new Dialog( $s.get(0) );
	curOpenSessionDialog.addButton( "Открыть", function()
	{
		var driver_id = $id.val();
		var odometer = $km.val();
		if( driver_id == '0' ) {
			toast( "Не выбран водитель" );
			return;
		}
		disp.openSession( driver_id, odometer )
		.catch( function( error ) {
			Dialog.show( sessionError( error ) );
		});
		curOpenSessionDialog.close();
	}, "yes" );

	curOpenSessionDialog.addButton( "Отменить", null, "no" );
	curOpenSessionDialog.show();
}

function showCloseSessionDialog( driver_id )
{
	var driver = disp.getDriver( driver_id );
	if( !driver ) {
		console.error( "Unknown driver id: ", driver_id );
		return;
	}

	var $s = $( '<div><label>Одометр</label>'
		+ '<input type="number" min="0" step="1"></div>' );
	var d = new Dialog( $s.get(0) );
	d.setTitle( "Закрытие смены для " + driver.call_id );
	d.addButton( "Закрыть", function()
	{
		var odometer = $s.find( 'input' ).val();
		disp.closeSession( driver_id, odometer );
		d.close();
	}, "yes" );
	d.addButton( "Отменить", function() {
		d.close();
	}, "no" );
	d.show();
}
