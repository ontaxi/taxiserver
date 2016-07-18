function DriversFilterWidget( disp )
{
	var s = '<div id="cars-selector">\
		<b>Выбор водителей:</b>\
		<span>\
		<input type="checkbox" id="cb-terminal-highlight">\
		<label for="cb-terminal-highlight">терминал</label>\
		</span>';

	var types = disp.driverTypes();
	if( types.length > 0 )
	{
		s += '<span>';
		types.forEach( function( type ) {
			var id = "r-filter-type-" + type.type_id;
			s += '<input type="checkbox" id="'+id+'" name="type" '
				+ 'value="'+type.type_id+'">' +
				'<label for="'+id+'">'+type.name+'</label>';
		});
		s += '<span>';
	}

	var groups = disp.driverGroups();
	if( groups.length > 0 )
	{
		s += '<span>';
		groups.forEach( function( group ) {
			var id = "r-filter-group-" + group.group_id;
			s += '<input type="checkbox" id="'+id+'" name="group" '
				+ 'value="'+group.group_id+'">' +
				'<label for="'+id+'">'+group.name+'</label>';
		});
		s += '<span>';
	}

	s += '</div>';

	var $c = $( s );
	var $term = $c.find( '#cb-terminal-highlight' );
	$term.on( 'change', applyFilter );

	var $type = $c.find( 'input[name="type"]' );
	$type.on( 'change', applyFilter );

	var $group = $c.find( 'input[name="group"]' );
	$group.on( 'change', applyFilter );

	this.root = function() {
		return $c.get(0);
	};

	var listeners = [];
	this.onChange = listeners.push.bind( listeners );

	this.clear = function() {
		$term.prop( "checked", false );
		$type.prop( "checked", false );
		$group.prop( 'checked', false );
	};

	function applyFilter()
	{
		var filter = [];
		if( $term.is( ':checked' ) ) {
			filter.push( {has_bank_terminal: 1} );
		}

		$type.filter( ":checked" ).each( function() {
			filter.push( {type_id: this.value} );
		});

		$group.filter( ":checked" ).each( function() {
			filter.push( {group_id: this.value} );
		});

		listeners.forEach( function( f ) {
			f( filter );
		});
	}
}
