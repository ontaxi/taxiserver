var html = (function(){

	var html = {};

	html.escape = function( s )
	{
		if( s === null ) return s;
		return s.toString().replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );
	};

	html.input = function( label, type, value, name )
	{
		var id = genId();
		var html = '<label for="'+id+'">'+label+'</label>';
		html += '<input type="'+type+'"';
		html += ' id="'+id+'"';
		if( name ) html += ' name="'+name+'"';
		if( value ) html += ' value="'+value+'"';
		html += '>';
		return html;
	};

	html.select = function( label, options, value, name )
	{
		var id = genId();
		var html = '<label for="'+id+'">'+label+'</label>';
		html += '<select';
		html += ' id="'+id+'"';
		if( name ) html += ' name="'+name+'"';
		if( value ) html += ' value="'+value+'"';
		html += '>';

		for( var value in options ) {
			var title = options[value];
			html += '<option value="'+value+'">' + title + '</option>';
		}
		html += '</select>';
		return html;
	};

	html.checkbox = function( label, checked, value, name ) {
		var id = genId();
		var html = "";
		html += '<input type="checkbox"';
		html += ' id="'+id+'"';
		if( name ) html += ' name="'+name+'"';
		if( value ) html += ' value="'+value+'"';
		if( checked ) html += ' checked';
		html += '>';
		html += '<label for="'+id+'">'+label+'</label>';
		return html;
	};

	html.textarea = function( label, value, name ) {
		var id = genId();
		var html = '<label for="'+id+'">'+label+'</label>';
		html += '<textarea';
		html += ' id="'+id+'"';
		if( name ) html += ' name="'+name+'"';
		html += '>';
		if( value ) html += this.escape( value );
		html += '</textarea>';
		return html;
	};

	html.table = function( rows, order, colnames )
	{
		var s = '<table>';
		/*
		 * Header
		 */
		s += '<tr>';
		order.forEach( function( k ) {
			s += '<td>' + html.escape( colnames[k] ) + '</td>';
		});
		s += '</tr>';
		/*
		 * Body
		 */
		rows.forEach( function( row )
		{
			s += '<tr>';
			order.forEach( function( k ) {
				s += '<td>' + html.escape( row[k] ) + '</td>';
			});
			s += '</tr>';
		});
		s += '</table>';
		return s;
	};

	var ids = 0;
	function genId() {
		return "--id-" + (++ids);
	}

	return html;
})();
