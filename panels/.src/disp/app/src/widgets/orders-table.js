function OrdersTableWidget( disp )
{
	var $container = $( '<div></div>' );
	this.root = function() {
		return $container.get(0);
	};

	var controls = createControls( $container );
	var table = createTable( $container );

	controls.onChange( showTable );
	showTable();

	function createControls( $container )
	{
		var $c = $( '<div>\
			<label><input type="checkbox" checked> Текущие</label>\
			<label><input type="checkbox" checked> Отложенные</label>\
			<label><input type="checkbox"> Закрытые</label>\
		</div>' );

		var $cb = $c.find( 'input' );
		var $open = $cb.eq(0);
		var $pending = $cb.eq(1);
		var $closed = $cb.eq(2);

		function bool( $checkbox ) {
			return $checkbox.is( ':checked' );
		}

		$container.append( $c );

		return {
			onChange: function( f ) {
				$cb.on( 'change', f );
			},
			state: function() {
				return {
					open: bool( $open ),
					pending: bool( $pending ),
					closed: bool( $closed )
				};
			}
		};
	}

	function createTable( $container )
	{
		var header = [
			"time", "dispatcher", "customer", "addr", "comments",
			"driver", "car", "status"
		];
		var names = {
			time: "Время создания",
			dispatcher: "Диспетчер",
			customer: "Клиент",
			addr: "Адрес подачи",
			comments: "Комментарии",
			driver: "Водитель",
			car: "Автомобиль",
			status: "Состояние"
		};

		var t = new Table( header, names );
		t.appendTo( $container );
		return t;
	}

	function showTable()
	{
		var show = controls.state();
		table.empty();
		disp.orders().forEach( function( order )
		{
			if( order.closed() && !show.closed ) {
				return;
			}
			if( !order.closed() && !show.open ) {
				return;
			}
			if( order.postponed() && !show.pending ) {
				return;
			}
			table.add( formatRow( order ) );
		});
		table.show();
	}

	function formatRow( order )
	{
		var driver = disp.getDriver( order.taxi_id );
		var car = driver ? disp.getDriverCar( driver.id ) : null;

		var row = {
			time: formatDateTime( time.local( order.time_created ) ),
			dispatcher: order.owner_id,
			customer: formatCustomer( order ),
			addr: order.src.addr.format(),
			comments: order.comments,
			driver: driver? driver.format() : '',
			car: car? car.format() : '',
			status: order.statusName()
		};

		return row;
	}

	function formatCustomer( order )
	{
		if( !order.customer_phone ) {
			return order.customer_name;
		}
		var s = formatPhone( order.customer_phone );
		if( order.customer_name ) {
			s += ' (' + order.customer_name + ')';
		}
		return s;
	}
}
