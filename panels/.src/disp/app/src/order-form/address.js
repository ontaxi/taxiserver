function AddressGroupSection( $container, type )
{
	var $c = $( '<div></div>' );
	$container.append( $c );

	/*
	 * Subforms for three address types.
	 */
	var fromQueue = new QueueSection( disp, $c );
	var fromObject = new ObjectSection( disp, $c );
	var from = new AddressSection( disp, $c, type );

	from.onChange( function( addr ) {
		fromQueue.set( null );
		fromObject.set( null );
	});

	fromQueue.onChange( function( loc ) {
		fromObject.set( null );
		from.set( loc ? loc.addr : null );
	});

	fromObject.onChange( function( loc ) {
		from.set( loc ? loc.addr : null );
		fromQueue.set( null );
	});

	this.get = function()
	{
		var addr = from.get();
		var loc = fromQueue.get() || fromObject.get();
		var locId = loc ? loc.loc_id : null;
		return {
			addr: addr,
			loc_id: locId
		};
	};

	this.set = function( spec )
	{
		from.set( spec.addr );
		fromQueue.set( locQueue(spec.loc_id) );
	};

	function locQueue( loc_id ) {
		if( !loc_id ) return null;
		var q = disp.queues();
		for( var i = 0; i < q.length; i++ ) {
			if( q[i].loc_id == loc_id ) {
				return q[i].id;
			}
		}
		return null;
	}

	this.setQueue = function( qid )
	{
		fromQueue.set( qid );
		var loc = fromQueue.get();
		if( loc ) {
			fromObject.set( loc );
			from.set( loc.addr );
		}
	};

	this.slideToggle = function() {
		$c.slideToggle( 'fast' );
	};

	this.hide = function() {
		$c.hide();
	};
}

function AddressSection( disp, $container, type )
{
	var $c = $( '<div></div>' );
	var s = '<div><label>Город</label><input class="city"></div>\
	<div><label>Улица</label><input class="street"></div>\
	<div><label>Дом, корпус</label>\
		<input class="house" size="2">, <input class="building" size="2"></div>';
	if( type != "dest" ) {
		s += '<div><label>Подъезд, квартира</label>\
			<input class="entrance">, <input class="apartment"></div>';
	}

	var $s = $( s );
	$container.append( $c );
	$c.append( $s );

	var $city = $s.find( '.city' );
	var $street = $s.find( '.street' );
	var $house = $s.find( '.house' );
	var $building = $s.find( '.building' );
	var $entrance = $s.find( '.entrance' );
	var $apartment = $s.find( '.apartment' );

	$city.val( disp.param( "default_city" ) );
	$city.autocomplete( mapdata.getPlaceSuggestions );
	$street.autocomplete( function( term, callback ) {
		mapdata.getStreetSuggestions( term, $city.val(), callback );
	});

	var $all = $s.find( 'input' );
	var callback = null;

	$all.on( "change", function() {
		if( !callback ) return;
		callback( getAddr() );
	});

	this.get = getAddr;

	function getAddr()
	{
		return new Address({
			place: $city.val(),
			street: $street.val(),
			house: $house.val(),
			building: $building.val(),
			entrance: $entrance.val(),
			apartment: $apartment.val()
		});
	};

	this.set = function( addr )
	{
		if( addr == null ) {
			addr = {
				place: "",
				street: "",
				house: "",
				building: "",
				entrance: "",
				apartment: ""
			};
		}
		$city.val( addr.place );
		$street.val( addr.street );
		$house.val( addr.house );
		$building.val( addr.building );
		$entrance.val( addr.entrance );
		$apartment.val( addr.apartment );
	};

	this.onChange = function( f ) {
		callback = f;
	};
}

function QueueSection( disp, $container )
{
	var $c = $( '<div><label>Объект (к)</label></div>' );

	var s = '<select class="queue-loc"><option value=""></option>';
	disp.queues().forEach( function( q ) {
		if( !q.loc_id ) return;
		s += '<option value="'+q.id+'">'+q.name+'</option>';
	});
	s += '</select>';
	var $s = $(s);

	$container.append( $c );
	$c.append( $s );

	var callback = null;

	$s.on( "change", function() {
		var loc = disp.getQueueLocation( this.value );
		callback( loc );
	});

	this.onChange = function( f ) {
		callback = f;
	};

	this.get = function() {
		return disp.getQueueLocation( $s.val() );
	};

	this.set = function( id ) {
		$s.val( id );
	};
}

function ObjectSection( disp, $container )
{
	var $c = $( '<div><label>Объект</label></div>' );
	var $s = $( '<input class="loc">' );

	$container.append( $c );
	$c.append( $s );

	var callback = null;
	var location = null;

	$s.autocomplete(
		function( term, callback )
		{
			disp.suggestLocations( term ).then( function( locations ) {
				var strings = obj.column( locations, "name" );
				callback( strings, locations );
			});
		},
		function( name, loc ) {
			location = loc;
			callback( loc );
		}
	);
	$s.on( "change", function() {
		if( location && this.value == location.name ) {
			return;
		}
		location = null;
		callback( null );
	});

	this.onChange = function( f ) {
		callback = f;
	};

	this.get = function() {
		return location;
	};

	this.set = function( loc ) {
		location = loc;
		$s.val( loc ? loc.name : "" );
	};
}
