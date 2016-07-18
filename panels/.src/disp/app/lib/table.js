function Table( keys, names, className )
{
	if( !className ) className = 'items';
	if( !names ) names = {};
	var s = '<table><thead><tr>';
	keys.forEach( function( k )
	{
		s += '<th>' + (names[k] || k) + '</th>';
	});
	s += '</tr></thead></table>';
	var $table = $( s );
	$table.addClass( className );

	var $tbody = $( '<tbody></tbody>' );
	$table.append( $tbody );

	var s = '';

	this.add = function( obj )
	{
		var row = '<tr>';
		keys.forEach( function( k )
		{
			var val = escapeHTML( obj[k] );
			row += '<td class="'+k+'">' + val + '</td>';
		});
		row += '</tr>';
		s += row;
	};

	function escapeHTML( s )
	{
		if( s === null ) {
			return s;
		}
		return s.toString().replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );
	}

	this.show = function()
	{
		$tbody.html( s );
		s = '';
	};

	this.empty = function()
	{
		$tbody.empty();
		s = '';
	};

	this.appendTo = function( parent ) {
		$table.appendTo( parent );
	};
}
