function DriverSection( $container )
{
	var s = '<select class="driver"><option value="0">Выбрать автоматически</option>';
	disp.drivers().forEach( function( d ) {
		s += tpl( '<option value="?">? - ?</option>',
			d.id, d.call_id, d.surname() );
	});
	s += '</select>';
	var $select = $( s );

	$container.append( '<label>Водитель</label>' );
	$container.append( $select );

	this.onChange = function( f ) { $select.on( 'change', f ); };
	this.get = function() {
		var id = $select.val();
		if( id != "" ) {
			id = parseInt( id, 10 );
		}
		return id;
	};
	this.set = function( id ) {
		$select.val( id );
	};
}

function OptionsSection( $container )
{
	var $s = $( '<div></div>' );
	var $class = $( html.select( "Тип автомобиля", {
		"ordinary": "Любой",
		"sedan": "Седан",
		"estate": "Универсал",
		"minivan": "Минивен"
	}) );
	var $vip = $( html.checkbox( "VIP" ) );
	var $term = $( html.checkbox( "Терминал" ) );
	$s.append( $class ).append( $vip ).append( $term );
	$container.append( $s );

	$class = $class.filter( "select" );

	this.get = function() {
		return {
			opt_car_class: $class.val(),
			opt_vip: $vip.is( ':checked' )? '1' : '0',
			opt_terminal: $term.is( ':checked' )? '1' : '0'
		};
	};

	this.set = function( order ) {
		$class.val( order.opt_car_class );
		$vip.prop( 'checked', order.opt_vip == '1' );
		$term.prop( 'checked', order.opt_terminal == '1' );
	};

	this.disable = function() {
		$class.val( "" );
		$vip.add( $term ).prop( "checked", false );
		$s.find( 'input, select' ).prop( "disabled", true );
		$s.slideUp( "fast" );
	};

	this.enable = function() {
		$s.find( 'input, select' ).prop( "disabled", false );
		$s.slideDown( "fast" );
	};
}
