function CalcAddressPicker( disp, $container )
{
	var $c = $( '<div class="address-picker"></div>' );
	var s = '<div><label>Город</label><input class="city"></div>\
	<div><label>Улица</label><input class="street"></div>\
	<div><label>Дом, корпус</label>\
		<input class="house">, <input class="building"></div>';

	var $s = $( s );
	$container.append( $c );
	$c.append( $s );

	var $city = $s.find( '.city' );
	var $street = $s.find( '.street' );
	var $house = $s.find( '.house' );
	var $building = $s.find( '.building' );

	$city.val( disp.param( "default_city" ) );
	$city.autocomplete( mapdata.getPlaceSuggestions );
	$street.autocomplete( function( term, callback ) {
		mapdata.getStreetSuggestions( term, $city.val(), callback );
	});

	var $all = $s.find( 'input' );
	var callback = null;

	$all.on( "change", function() {
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
			entrance: "",
			apartment: ""
		});
	};

	this.set = function( addr )
	{
		if( addr == null ) {
			addr = {
				place: "",
				street: "",
				house: "",
				building: ""
			};
		}
		$city.val( addr.place );
		$street.val( addr.street );
		$house.val( addr.house );
		$building.val( addr.building );
	};

	this.enable = function( quick ) {
		$c.find( "input" ).prop( "disabled", false );
		if( quick ) {
			$c.show();
		} else {
			$c.slideDown( "fast" );
		}
	};

	this.disable = function( quick ) {
		$c.find( "input" ).prop( "disabled", true );
		if( quick ) {
			$c.hide();
		} else {
			$c.slideUp( "fast" );
		}
	};

	this.onChange = function( f ) {
		callback = f;
	};
}
