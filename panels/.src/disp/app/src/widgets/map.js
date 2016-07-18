function MapWidget( disp )
{
	var $container = $( '<div id="map-widget"></div>' );
	this.root = function() {
		return $container.get(0);
	};

	// driver id => marker name
	var driverClasses = {};

	var map;

	/*
	 * The main program of the widget.
	 */
	getBounds().then( function( bounds )
	{
		var controls = createControls( bounds );
		map = createMap();
		controls.onClick( function( bounds ) {
			map.setBounds( bounds );
		});
		onFirstDisplay( $container, function() {
			map.setBounds( bounds[0] );
		});
		showQueues( map );
		showDrivers( map );
	});

	function onFirstDisplay( $e, func )
	{
		var $w = $(window);
		function track()
		{
			if( !$e.is( ":visible" ) ) {
				return;
			}
			func();
			$w.off( "resize", track );
		}

		$w.on( "resize", track );
		track();
	}

	this.setPosition = function( coords ) {
		map.panTo( coords[0], coords[1] );

	};

	this.setZoom = function( level ) {
		map.setZoom( level );
	};

	this.setClass = function( driverId, className ) {
		driverClasses[driverId] = className;
		updateMarker( driverId );
	};

	this.removeClass = function( driverId, className ) {
		delete driverClasses[driverId];
		updateMarker( driverId );
	};

	function updateMarker( id )
	{
		var driver = disp.getDriver( id );
		if( driver.is_online != '1' ) {
			return;
		}
		putCarMarker( map, driver );
	}

	//--

	function getBounds()
	{
		var P = {ok: null, fail: null};
		var promise = new Promise( function( ok, fail )
		{
			P.ok = ok;
			P.fail = fail;
		});

		var minskBounds = {
			name: "Минск и окрестность",
			min_lat: 53.87,
			max_lat: 53.93,
			min_lon: 27.555,
			max_lon: 27.575
		};

		var town = disp.param( "default_city" );
		if( town ) {
			mapdata.getAddressBounds( {place: town}, function( bounds ) {
				bounds.name = town;
				P.ok( [bounds] );
			});
		}
		else {
			P.ok( [minskBounds] );
		}
		return promise;
	}

	/*
	 * Creates buttons that switch map bounds.
	 */
	function createControls( bounds )
	{
		var callback = null;
		bounds.forEach( function( b )
		{
			var $button = $( '<button type="button">'+b.name+'</button>' );
			$container.append( $button );
			$button.on( 'click', function() {
				if( callback ) callback( b );
			});
		});

		return {
			onClick: function( f ) {
				assert( !callback, "only one onClick allowed" );
				callback = f;
			}
		};
	}

	function createMap()
	{
		var $map = $( '<div class="map"></div>' );
		$container.append( $map );
		map = new Map( $map.get(0) );
		map.addZoomControl( 'topleft' );
		map.setBounds = function( b ) {
			map.fitBounds( b.min_lat, b.max_lat, b.min_lon, b.max_lon );
		};
		$(window).on( "resize", function() {
			map.leaflet.invalidateSize();
		});
		return map;
	}

	function showQueues( map )
	{
		var flagIcon = L.icon({
			iconUrl: "/res/dispatcher/images/flag-icon.png",
			iconSize: [25, 27],
			iconAnchor: [12, 27]
		});

		disp.queues().forEach( function( q )
		{
			var coords = q.coords();
			if( !coords[0] || !coords[1] ) {
				return;
			}
			var options = {
				title: q.name,
				icon: flagIcon
			};

			map.setMarker( 'q_' + q.queue_id,
				coords[0], coords[1], options );
		});
	}

	function showDrivers( map )
	{
		disp.drivers().forEach( function( d )
		{
			if( !d.online() ) return;
			if( d.is_fake == '1' ) return;
			if( !d.coords()[0] ) return;
			if( !d.car_id ) return;
			putCarMarker( map, d );
		});

		disp.on( "driver-online-changed", function( event ) {
			var d = event.data.driver;
			if( d.online() ) {
				putCarMarker( map, d );
			} else {
				map.removeMarker( 'taxi_' + d.id );
			}
		});

		disp.on( 'driver-moved', function( event )
		{
			var driver = event.data.driver;
			putCarMarker( map, driver );
		});
	}

	//--

	function putCarMarker( map, driver )
	{
		/*
		 * If the driver is offline, don't show the marker.
		 */
		var coords = driver.coords();
		if( !coords[0] ) return;

		var options = {
			title: driver.call_id,
			icon: L.icon({
				iconUrl: driverIconUrl( driver ),
				iconSize: [25, 27],
				iconAnchor: [12, 27]
			})
		};

		var m = map.setMarker( "taxi_" + driver.id,
			coords[0], coords[1], options );
		m.bindLabel( driver.call_id, { noHide: true } ).showLabel();
	}

	function driverIconUrl( driver )
	{
		var pref = "/res/dispatcher/images/map-icon-";

		if( driver.id in driverClasses ) {
			return pref + driverClasses[driver.id] + ".gif";
		}

		var car = disp.getDriverCar( driver.id );
		var body = car ? car.body_type : "none";
		var carClass;
		switch( body )
		{
			case 'estate':
			case 'minivan':
				carClass = car.body_type;
				break;
			default:
				carClass = 'ordinary';
		}

		var url = pref + carClass;
		if( car && car['class'] == 'vip' ) url += "-vip";
		url += ".png";
		return url;
	}

	//--
}
