var hotkeys = (function()
{
	/*
	 * Hotkey spec => array of listeners.
	 */
	var listeners = {};

	$(window).on( 'keydown', dispatch );

	function dispatch( event )
	{
		var spec = getSpec( event );
		if( !spec || !(spec in listeners) ) return;
		/*
		 * Make a copy of the list because the listeners may remove
		 * themselves and other listeners.
		 */
		var F = listeners[spec].slice(0);
		var n = F.length;
		while( n-- > 0 )
		{
			/*
			 * If this listener has gone from the main list, don't
			 * call it.
			 */
			if( listeners[spec].indexOf( F[n] ) == -1 ) continue;
			/*
			 * If the listener returns true, stop.
			 */
			if( F[n]( event ) === true ) {
				break;
			}
		}
	}

	function getSpec( event )
	{
		var key = keyName( event.keyCode );
		if( !key ) {
			return null;
		}

		var spec = '';
		if( event.ctrlKey ) {
			spec += 'ctrl+';
		}
		if( event.altKey ) {
			spec += 'alt+';
		}
		spec += key;
		return spec;
	}

	function keyName( code )
	{
		var specialKeys = {
			45: "ins",
			27: "esc"
		};
		if( code in specialKeys ) {
			return specialKeys[code];
		}

		var code_a = 65;
		var code_z = code_a + 25;

		if( code < code_a || code > code_z ) {
			return null;
		}

		return String.fromCharCode( 'z'.charCodeAt(0) - (code_z - code) );
	}

	/*
	 * The form of spec is: [ctrl+][alt+]<key>.
	 * Example: bind( 'alt+c', myfunc ).
	 */
	function bind( spec, func )
	{
		if( !(spec in listeners) ) {
			listeners[spec] = [func];
		}
		else {
			listeners[spec].push( func );
		}
	}

	function unbind( spec, func )
	{
		if( !(spec in listeners) ) {
			return;
		}
		var pos = listeners[spec].indexOf( func );
		if( pos >= 0 ) {
			listeners[spec].splice( pos, 1 );
		}
	}

	return {
		bind: bind,
		unbind: unbind
	};
})();
