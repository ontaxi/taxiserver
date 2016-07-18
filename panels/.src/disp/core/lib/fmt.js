var fmt = (function()
{
	function fmt( template, _args_ )
	{
		var out = '';
		var argpos = 1;
		var n = template.length;

		for( var i = 0; i < n; i++ )
		{
			var ch = template.charAt(i);

			/*
			 * Try to read a conversion specification.
			 */
			var m = getMarker( template, i );
			if( !m ) {
				out += ch;
				continue;
			}

			/*
			 * Try to format the argument.
			 */
			var s = expand( m, arguments[argpos] );
			if( s === null ) {
				out += ch;
				continue;
			}
			argpos++;

			out += s;
			i += m.length - 1;
		}
		return out;
	}

	function getMarker( template, pos )
	{
		var n = template.length;
		if( template.charAt( pos ) != '%' ) {
			return null;
		}
		var _pos = pos;
		pos++;

		var m = {
			flags: '',
			width: '',
			type: '',
			precision: '',
			length: 0
		};

		// Zero or more flags
		while( pos < n )
		{
			var ch = template.charAt( pos );
			if( ch == '0' ) {
				m.flags += '0';
				pos++;
				continue;
			}
			break;
		}

		// Width
		while( pos < n && isDigit( template.charAt( pos ) ) ) {
			m.width += template.charAt( pos++ );
		}

		// Optional precision
		if( pos < n && template.charAt( pos ) == '.' )
		{
			pos++;
			while( pos < n && isDigit( template.charAt(pos) ) ) {
				m.precision += template.charAt(pos++);
			}
		}

		if( pos < n )
		{
			var ch = template.charAt( pos );
			if( ch == 's' || ch == 'd' || ch == 'f' ) {
				m.type = ch;
				pos++;
			}
		}

		if( !m.type ) {
			return null;
		}
		m.width = (m.width === '')? -1 : parseInt(m.width, 10);
		m.precision = (m.precision === '')? -1 : parseInt(m.precision, 10);
		m.length = pos - _pos;
		return m;
	}

	function expand( marker, arg )
	{
		if( marker.type == 's' )
		{
			if( marker.width >= 0 || marker.flags || marker.precision >= 0 ) {
				throw "Format %" + marker.type + " is not fully supported";
			}
			return arg;
		}

		if( marker.type == 'd' )
		{
			if( (marker.flags != '' && marker.flags != '0') || marker.precision >= 0 ) {
				throw "Format %" + marker.type + " is not fully supported";
			}
			var out = arg.toString();
			if( marker.width > 0 )
			{
				var pad = marker.flags;
				var n = marker.width - out.length;
				while( n-- > 0 ) {
					out = pad + out;
				}
			}
			return out;
		}

		if( marker.type == 'f' )
		{
			if( typeof arg == "string" ) {
				arg = parseFloat( arg );
			}
			if( typeof arg != "number" ) {
				throw "A number is expected for %f format";
			}

			if( marker.width >= 0 || marker.flags ) {
				throw "Format %f is not fully supported";
			}
			if( marker.precision >= 0 ) {
				return arg.toFixed( marker.precision );
			}
			return arg;
		}

		return null;
	}

	function isDigit( ch ) {
		return ch.length == 1 && "0123456789".indexOf( ch ) >= 0;
	}
	return fmt;
})();

/*
 * Lightweight analog of 'fmt' without any format specifiers. It just
 * replaces question marks with the arguments.
 */
function tpl( tpl, vars___ )
{
	var n = arguments.length;
	for( var i = 1; i < n; i++ ) {
		tpl = tpl.replace( '?', arguments[i] );
	}
	return tpl;
}
