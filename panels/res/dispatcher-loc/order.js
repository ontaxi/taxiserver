/*
	Compilation date: 2016-03-03
	Number of files: 33
*/
(function() {
"use strict";

// lib/autocomplete.js
"use strict";
(function(){
                                                            // lib/autocomplete.js:3
/*
 * optionsFunction is a function taking entered term and returning
 * corresponding array of suggestions.
 */
$.fn.autocomplete = function( optionsFunction, acceptCallback )
{
	return this.each( function() {
		initAutocomplete.call( this, optionsFunction, acceptCallback );
	});
};
                                                            // lib/autocomplete.js:14
/*
 * A structure for the generated drop-down list.
 */
function List( $input, $list, optionsFunc, acceptCallback )
{
	// The input
	this.$input = $input;
                                                            // lib/autocomplete.js:22
	// The UL element we show below the input
	this.$list = $list;
                                                            // lib/autocomplete.js:25
	// Suggestions function and onAccept function
	this.func = optionsFunc;
	this.acceptCallback = acceptCallback;
                                                            // lib/autocomplete.js:29
	// Array of currently shown suggestions
	this.contents = [];
	this.contexts = [];
                                                            // lib/autocomplete.js:33
	// Currently highlighted suggestion
	this.selection = -1;
                                                            // lib/autocomplete.js:36
	// Previous value of the input
	this.prevValue = '';
}
                                                            // lib/autocomplete.js:40
/*
 * The main init function for a single input element.
 */
function initAutocomplete( optionsFunc, acceptCallback )
{
	var $input = $( this );
	var $list = buildList( $input );
	var list = new List( $input, $list, optionsFunc, acceptCallback );
                                                            // lib/autocomplete.js:49
	initInputEvents( list );
	initKeyboardEvents( list );
	initMouseEvents( list );
}
                                                            // lib/autocomplete.js:54
/*
 * Takes an input and returns the list for it.
 */
function buildList( $input )
{
	/*
	 * Disable the browser's autocompletion feature.
	 */
	$input.attr( "autocomplete", "off" );
                                                            // lib/autocomplete.js:64
	/*
	 * Create list element and insert it after the input.
	 * Simply appending it to the body would make positioning easier,
	 * but it would cause problems if the input itself was in a
	 * positioned container (a draggable dialog, for example).
	 */
	var $list = $( "<div class=\"autocomplete\"></div>" );
	$list.css( "position", "absolute" );
	$list.insertAfter( $input );
	$list.css( 'display', 'none' );
                                                            // lib/autocomplete.js:75
	/*
	 * Make sure that the input's and the list's parent has relative or
	 * absolute positioning.
	 */
	var $parent = $list.parent();
	var pos = $parent.css( 'position' );
	if( pos != 'absolute' && pos != 'relative' ) {
		$parent.css( 'position', 'relative' );
	}
                                                            // lib/autocomplete.js:85
	return $list;
}
                                                            // lib/autocomplete.js:88
function initInputEvents( list )
{
	/*
	 * Save the list variable in a closure.
	 */
	function oninput( event ) {
		updateInput( list );
	}
                                                            // lib/autocomplete.js:97
	/*
	 * We have to listen for "input" events and react to them.
	 * As of 2014, significant number of browsers still don't support
	 * it. For them we have to fall back to listening for "keyup"
	 * events.
                                                            // lib/autocomplete.js:103
	/*
	 * If oninput is supported, use it.
	 */
	var inputEventSupported = ('oninput' in document.createElement( 'input' ) );
	if( inputEventSupported ) {
		list.$input.on( "input", oninput );
		return true;
	}
	/*
	 * Otherwise, do a trick with keyup.
	 */
	list.$input.on( "keyup", function( event )
	{
		if( event.keyCode >= 32 && event.keyCode <= 127 ){
			updateInput( list );
		}
	});
}
                                                            // lib/autocomplete.js:122
/*
 * Gets called whenever the associated input value is changed.
 */
function updateInput( list )
{
	var MIN_LENGTH = 1;
                                                            // lib/autocomplete.js:129
	var newValue = list.$input.val();
                                                            // lib/autocomplete.js:131
	/* If the value hasn't changed, don't do anything. */
	if( list.currentValue == newValue ) {
		return;
	}
                                                            // lib/autocomplete.js:136
	list.prevValue = list.currentValue;
	list.currentValue = newValue;
                                                            // lib/autocomplete.js:139
	if( list.currentValue < MIN_LENGTH ) {
		hideList( list );
		return;
	}
                                                            // lib/autocomplete.js:144
	/*
	 * Save the list variable in closure and call the suggestions
	 * function with it.
	 */
	var f = function( options, contexts ) {
		showSuggestions( list, options, contexts );
	}
	list.func.call( undefined, list.currentValue, f );
}
                                                            // lib/autocomplete.js:154
function hideList( list ) {
	list.$list.css( 'display', 'none' );
}
                                                            // lib/autocomplete.js:158
function showSuggestions( list, suggestions, contexts )
{
	var $list = list.$list;
                                                            // lib/autocomplete.js:162
	$list.empty();
	list.selection = -1;
	list.contents = suggestions;
	list.contexts = contexts;
                                                            // lib/autocomplete.js:167
	var container = createItems( suggestions );
	if( !container ) {
		hideList( list );
		return;
	}
                                                            // lib/autocomplete.js:173
	$list.append( container );
	$list.css( 'display', 'block' );
	/*
	 * After we fill the list, we call alignList to update the list
	 * position. We have to do it every time because in general the page
	 * layout could change at any time, and not only due to the window
	 * resize.
	 */
	alignList( list );
}
                                                            // lib/autocomplete.js:184
function createItems( suggestions )
{
	var n = suggestions.length;
	if( !n ) {
		return null;
	}
                                                            // lib/autocomplete.js:191
	var container = document.createElement( 'ul' );
	var s = '';
	for( var i = 0; i < n; i++ ) {
		s += '<li data-index="'+i+'">' + suggestions[i] + '</li>';
	}
	container.innerHTML = s;
	return container;
}
                                                            // lib/autocomplete.js:200
/*
 * Move list to the correct position relative to the input.
 */
function alignList( list )
{
	var $input = list.$input;
	var $list = list.$list;
                                                            // lib/autocomplete.js:208
	var offset = $input.position();
	var hmargin = $input.outerWidth(true) - $input.outerWidth();
                                                            // lib/autocomplete.js:211
	var left = offset.left + hmargin/2;
	/*
	 * We assume that there is always enough space below the input.
	 */
	var top = offset.top + $input.outerHeight();
                                                            // lib/autocomplete.js:217
	$list.css({
		"left": left + "px",
		"top": top + "px",
		"min-width": $input.outerWidth() + "px"
	})
}
                                                            // lib/autocomplete.js:224
function initKeyboardEvents( list )
{
	/* Event key codes. */
	var KEY_UP = 38;
	var KEY_DOWN = 40;
	var KEY_ENTER = 13;
                                                            // lib/autocomplete.js:231
	var $input = list.$input;
	var $list = list.$list;
                                                            // lib/autocomplete.js:234
	$input.on( 'keydown', onKeyPress );
                                                            // lib/autocomplete.js:236
	/*
	 * Processes key presses at the list.
	 */
	function onKeyPress( event )
	{
		if( !$list.is( ":visible" ) ) {
			return;
		}
                                                            // lib/autocomplete.js:245
		var index = list.selection;
                                                            // lib/autocomplete.js:247
		switch( event.keyCode )
		{
			case KEY_UP:
				selectItem( list, index - 1 );
				break;
			case KEY_DOWN:
				selectItem( list, index + 1 );
				break;
			case KEY_ENTER:
				acceptItem( list, index );
				break;
			default:
				return;
		}
                                                            // lib/autocomplete.js:262
		event.preventDefault();
		event.stopPropagation();
	}
}
                                                            // lib/autocomplete.js:267
function selectItem( list, index )
{
	var n = list.contents.length;
	var $list = list.$list;
                                                            // lib/autocomplete.js:272
	if( !n ) {
		return;
	}
                                                            // lib/autocomplete.js:276
	if( index < 0 ) {
		index = n-1;
	}
	else {
		index = index % n;
	}
                                                            // lib/autocomplete.js:283
	var $prev = $list.find( 'li' ).eq( list.selection );
	var $next = $list.find( 'li' ).eq( index );
                                                            // lib/autocomplete.js:286
	$prev.removeClass( 'selected' );
	$next.addClass( 'selected' );
                                                            // lib/autocomplete.js:289
	list.selection = index;
}
                                                            // lib/autocomplete.js:292
function acceptItem( list, index )
{
	var n = list.contents.length;
	if( index < 0 || index >= n ) {
		return;
	}
                                                            // lib/autocomplete.js:299
	var item = list.contents[index];
	list.$input.val( item ).trigger( "change" );
	hideList( list );
                                                            // lib/autocomplete.js:303
	if( list.acceptCallback )
	{
		var context;
		if( list.contexts ) {
			context = list.contexts[index];
		}
		else {
			context = null;
		}
		list.acceptCallback(item, context);
	}
}
                                                            // lib/autocomplete.js:316
function initMouseEvents( list )
{
	var $list = list.$list;
                                                            // lib/autocomplete.js:320
	/*
	 * Update selection when pointed by mouse.
	 */
	$list.on( 'mouseenter', 'li', function( event )
	{
		var index = $(this).data( 'index' );
		selectItem( list, index );
	});
                                                            // lib/autocomplete.js:329
	/*
	 * When a list entry is clicked, accept it.
	 */
	$list.on( "click", 'li', function( event )
	{
		var index = $(this).data( 'index' );
		acceptItem( list, index );
		event.stopPropagation();
	});
                                                            // lib/autocomplete.js:339
	/*
	 * When anything outside the list is clicked, hide the list.
	 */
	$( "body" ).on( 'click', function()
	{
		hideList( list );
	});
}
                                                            // lib/autocomplete.js:348
})();


// lib/conv.js
function toInt( val )
{
	if( typeof val == "string" ) {
		return parseInt( val, 10 );
	}
	return val;
}
                                                            // lib/conv.js:8
/*
 * Tells whether the given value is non-empty.
 */
function hasValue( val )
{
	if( !val ) return false;
	while( val.length && val.charAt(0) == ' ' ){
		val = val.substr(1);
	}
	return val != '';
}


// lib/dialog.js
/*
 * A wrapper around Layers to create dialogs with content and buttons.
 */
function Dialog( content )
{
	/*
	 * A Layers object.
	 */
	var layer = null;
                                                            // lib/dialog.js:10
	var $container = $( '<div class="w-dialog"></div>' );
	var $title = $( '<div class="title"></div>' );
	var $content = $( '<div class="content"></div>' );
	if( content ) {
		$content.append( content );
	}
	var $buttons = $( '<div class="buttons"></div>' );
	var $yesButton = null;
	var $noButton = null;
                                                            // lib/dialog.js:20
	/*
	 * The 'onclick' is a function to be called when the button is
	 * pressed. If not specified, then "close" function will be
	 * assigned.
	 *
	 * The 'keytype' may be set to "yes" or "no" to give the button
	 * a meaning which will be used when processing key presses.
	 */
	this.addButton = function( title, onclick, keytype )
	{
		var $b = $( '<button type="button">' + title + '</button>' );
		/*
		 * If no function, use 'close', and treat it as a 'yes' button,
		 * unless specified otherwise.
		 */
		if( !onclick ) {
			onclick = this.close.bind( this );
			if( !keytype ) keytype = 'yes';
		}
                                                            // lib/dialog.js:40
		$b.on( 'click', onclick.bind( this ) );
		$buttons.append( $b );
                                                            // lib/dialog.js:43
		switch( keytype ) {
			case 'yes':
				$yesButton = $b;
				break;
			case 'no':
				$noButton = $b;
				break;
		}
	};
                                                            // lib/dialog.js:53
	this.setTitle = function( title ) {
		$title.html( title );
	};
                                                            // lib/dialog.js:57
	this.show = function()
	{
		/*
		 * If there are no buttons, add a default one.
		 */
		if( !$buttons.is( ':parent' ) ) {
			this.addButton( 'OK' );
		}
		$container.append( $title ).append( $content ).append( $buttons );
		layer = Layers.create( $container.get(0) );
		/*
		 * If positive button was defined, focus on it.
		 */
		if( $yesButton ) {
			$yesButton.focus();
		}
                                                            // lib/dialog.js:74
		if( $yesButton ) listenKeys( this, 13, $yesButton ); // enter
		if( $noButton ) listenKeys( this, 27, $noButton ); // escape
                                                            // lib/dialog.js:77
		layer.onBlur( function() {
			callListeners( 'blur' );
		});
		layer.onFocus( function() {
			callListeners( 'focus' );
		});
	};
                                                            // lib/dialog.js:85
	function listenKeys( _this, code, $b )
	{
		$(window).on( 'keydown', function( event ) {
			if( event.keyCode != code ) {
				return;
			}
			if( !layer.hasFocus() ) {
				return;
			}
			$b.click();
			event.stopPropagation();
		});
	}
                                                            // lib/dialog.js:99
	this.close = function()
	{
		layer.remove();
		layer = null;
	};
                                                            // lib/dialog.js:105
	this.isOpen = function() {
		return layer != null;
	};
                                                            // lib/dialog.js:109
	var listeners = {
		"focus": [],
		"blur": []
	};
                                                            // lib/dialog.js:114
	function callListeners( type ) {
		for( var i = 0; i < listeners[type].length; i++ ) {
			listeners[type][i]();
		}
	}
                                                            // lib/dialog.js:120
	this.on = function( type, func ) {
		listeners[type].push( func );
	};
}


// lib/disp-core.js
/*
	Compilation date: 2016-02-24
	Number of files: 29
*/
(function() {
"use strict";
                                                            // lib/disp-core.js:7
// lib/assert.js
function assert( val, msg, obj )
{
	if( val ) return;
	if( !msg ) msg = "assertion failed";
	console.error( msg, obj );
	throw msg;
}
                                                            // lib/disp-core.js:16
function assertObj( obj, fields )
{
	assert( obj, "assertObj: given object is " + obj, obj );
                                                            // lib/disp-core.js:20
	for( var k in fields )
	{
		assert( k in obj, "no field '" + k + "'", obj );
		var type = fields[k];
		assert( typeMatch( obj[k], type ),
			"field '"+k+"' has wrong type ("+(typeof obj[k])+")" );
	}
}
                                                            // lib/disp-core.js:29
function typeMatch( val, type )
{
	if( type == '' ) return true;
                                                            // lib/disp-core.js:33
	var nullOk;
	if( type.substr( -1 ) == "?" ) {
		nullOk = true;
		type = type.substring( 0, type.length - 1 );
	}
	else {
		nullOk = false;
	}
                                                            // lib/disp-core.js:42
	if( val === null && nullOk ) {
		return true;
	}
                                                            // lib/disp-core.js:46
	switch( type )
	{
		case "str":
			return typeof val == "string";
		case "flt":
			return typeof val == "number";
		case "int":
			return typeof val == "number" && Math.round( val ) == val;
		default:
			throw new Error( "typeMatch: unknown type " + type );
	}
}
                                                            // lib/disp-core.js:59
                                                            // lib/disp-core.js:60
// lib/dx.js
function DX( baseUrl )
{
	/*
	 * RTT estimation and time of the last request.
	 */
	var rtt = 0;
	var t = 0;
                                                            // lib/disp-core.js:69
	this.RTT = function() { return rtt; }
                                                            // lib/disp-core.js:71
	this.get = function( path, args )
	{
		var url = baseUrl + '/' + path;
		if( args ) {
			url += argString( args );
		}
		t = Date.now();
		return http.get( url ).then( check );
	};
                                                            // lib/disp-core.js:81
	this.post = function( path, data )
	{
		var url = baseUrl + '/' + path;
		t = Date.now();
		return http.post( url, data ).then( check );
	};
                                                            // lib/disp-core.js:88
	function argString( args )
	{
		var i = 0;
		var str = '';
		for( var k in args ) {
			str += (i > 0) ? '&' : '?';
			str += k + '=' + encodeURIComponent( args[k] );
			i++;
		}
		return str;
	}
                                                            // lib/disp-core.js:100
	function check( data )
	{
		rtt = Date.now() - t;
		if( data.errno ) {
			throw data.errstr;
		}
		return data.data;
	}
}
                                                            // lib/disp-core.js:110
                                                            // lib/disp-core.js:111
// lib/fmt.js
var fmt = (function()
{
	function fmt( template, _args_ )
	{
		var out = '';
		var argpos = 1;
		var n = template.length;
                                                            // lib/disp-core.js:120
		for( var i = 0; i < n; i++ )
		{
			var ch = template.charAt(i);
                                                            // lib/disp-core.js:124
			/*
			 * Try to read a conversion specification.
			 */
			var m = getMarker( template, i );
			if( !m ) {
				out += ch;
				continue;
			}
                                                            // lib/disp-core.js:133
			/*
			 * Try to format the argument.
			 */
			var s = expand( m, arguments[argpos] );
			if( s === null ) {
				out += ch;
				continue;
			}
			argpos++;
                                                            // lib/disp-core.js:143
			out += s;
			i += m.length - 1;
		}
		return out;
	}
                                                            // lib/disp-core.js:149
	function getMarker( template, pos )
	{
		var n = template.length;
		if( template.charAt( pos ) != '%' ) {
			return null;
		}
		var _pos = pos;
		pos++;
                                                            // lib/disp-core.js:158
		var m = {
			flags: '',
			width: '',
			type: '',
			precision: '',
			length: 0
		};
                                                            // lib/disp-core.js:166
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
                                                            // lib/disp-core.js:178
		// Width
		while( pos < n && isDigit( template.charAt( pos ) ) ) {
			m.width += template.charAt( pos++ );
		}
                                                            // lib/disp-core.js:183
		// Optional precision
		if( pos < n && template.charAt( pos ) == '.' )
		{
			pos++;
			while( pos < n && isDigit( template.charAt(pos) ) ) {
				m.precision += template.charAt(pos++);
			}
		}
                                                            // lib/disp-core.js:192
		if( pos < n )
		{
			var ch = template.charAt( pos );
			if( ch == 's' || ch == 'd' || ch == 'f' ) {
				m.type = ch;
				pos++;
			}
		}
                                                            // lib/disp-core.js:201
		if( !m.type ) {
			return null;
		}
		m.width = (m.width === '')? -1 : parseInt(m.width, 10);
		m.precision = (m.precision === '')? -1 : parseInt(m.precision, 10);
		m.length = pos - _pos;
		return m;
	}
                                                            // lib/disp-core.js:210
	function expand( marker, arg )
	{
		if( marker.type == 's' )
		{
			if( marker.width >= 0 || marker.flags || marker.precision >= 0 ) {
				throw "Format %" + marker.type + " is not fully supported";
			}
			return arg;
		}
                                                            // lib/disp-core.js:220
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
                                                            // lib/disp-core.js:237
		if( marker.type == 'f' )
		{
			if( typeof arg == "string" ) {
				arg = parseFloat( arg );
			}
			if( typeof arg != "number" ) {
				throw "A number is expected for %f format";
			}
                                                            // lib/disp-core.js:246
			if( marker.width >= 0 || marker.flags ) {
				throw "Format %f is not fully supported";
			}
			if( marker.precision >= 0 ) {
				return arg.toFixed( marker.precision );
			}
			return arg;
		}
                                                            // lib/disp-core.js:255
		return null;
	}
                                                            // lib/disp-core.js:258
	function isDigit( ch ) {
		return ch.length == 1 && "0123456789".indexOf( ch ) >= 0;
	}
	return fmt;
})();
                                                            // lib/disp-core.js:264
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
                                                            // lib/disp-core.js:277
                                                            // lib/disp-core.js:278
// lib/format.js
/*
 * Takes raw phone number string and formats it nicely.
 * The format is "+375 <code> <3d>-<2d>-<2d>".
 */
function formatPhone( str )
{
	if( !str ) return str;
	var original = str;
	if( str.indexOf( "+375" ) == 0 ) {
		str = str.substr( 4 );
	}
                                                            // lib/disp-core.js:291
	str = str.replace( /[^\d]/g, '' );
                                                            // lib/disp-core.js:293
	var parts = [
		str.substr( 0, 2 ),
		str.substr( 2, 3 ),
		str.substr( 5, 2 ),
		str.substr( 7 )
	];
                                                            // lib/disp-core.js:300
	if( parts[3] == '' || parts[3].length > 2 ) return original;
                                                            // lib/disp-core.js:302
	var s = '+375 ' + parts.shift();
	if( parts.length > 0 ) {
		s += ' ' + parts.join( '-' );
	}
                                                            // lib/disp-core.js:307
	return s;
}
                                                            // lib/disp-core.js:310
/*
 * Formats time as hour:minute. The argument is UTC seconds.
 */
function formatTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );
	return fmt( "%02d:%02d", d.getHours(), d.getMinutes() );
}
                                                            // lib/disp-core.js:320
/*
 * Formats unixtime as "day.month.year hours:minutes".
 */
function formatDateTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );
                                                            // lib/disp-core.js:328
	return fmt( "%02d.%02d.%d %02d:%02d",
		d.getDate(),
		d.getMonth() + 1,
		d.getFullYear(),
		d.getHours(),
		d.getMinutes()
	);
}
                                                            // lib/disp-core.js:337
                                                            // lib/disp-core.js:338
// lib/http.js
"use strict";
                                                            // lib/disp-core.js:341
var http = (function()
{
	var http = {};
                                                            // lib/disp-core.js:345
	/*
	 * Creates urls. "vars" is a dict with query vars. "base" can have
	 * variables in it too.
	 * Example: createURL( '/?v=json&b=mapdata', {p: bounds, lat: ...} )
	 */
	http.createURL = function( base, vars )
	{
		var url = base;
		var haveQ = url.indexOf( '?' ) != -1;
                                                            // lib/disp-core.js:355
		for( var i in vars )
		{
			if( typeof vars[i] == "undefined" ) continue;
                                                            // lib/disp-core.js:359
			if( !haveQ ) {
				url += '?';
				haveQ = true;
			} else {
				url += '&';
			}
                                                            // lib/disp-core.js:366
			url += i + "=" + encodeURIComponent( vars[i] );
		}
		return url;
	};
                                                            // lib/disp-core.js:371
	http.get = function( url ) {
		return promise( $.get( url ) );
	};
                                                            // lib/disp-core.js:375
	http.post = function( url, data ) {
		return promise( $.post( url, data ) );
	};
                                                            // lib/disp-core.js:379
	/*
	 * Converts jQuery deferred/jqXHR/whatever-it's-called-now to a
	 * Promise object with additional 'abort' function.
	 */
	function promise( jp )
	{
		var p = new Promise( function( ok, fail ) {
			jp.done( ok ).fail( fail );
		});
		p.abort = function() {
			jp.abort();
		};
		return p;
	}
                                                            // lib/disp-core.js:394
	return http;
})();
                                                            // lib/disp-core.js:397
                                                            // lib/disp-core.js:398
// lib/listeners.js
function Listeners( events, statefulEvents )
{
	if( typeof statefulEvents == "undefined" ) {
		statefulEvents = [];
	}
                                                            // lib/disp-core.js:405
	var listeners = {};
	var eventStates = {};
                                                            // lib/disp-core.js:408
	for( var i = 0; i < events.length; i++ )
	{
		var k = events[i];
		if( k.charAt(0) == "*" ) {
			k = k.substr( 1 );
			statefulEvents.push( k );
			continue;
		}
		listeners[k] = [];
	}
                                                            // lib/disp-core.js:419
	for( var i = 0; i < statefulEvents.length; i++ ) {
		var k = statefulEvents[i];
		listeners[k] = [];
		eventStates[k] = null;
	}
                                                            // lib/disp-core.js:425
	function event( type, context, data )
	{
		var stopped = false;
                                                            // lib/disp-core.js:429
		this.type = type;
		this.data = data;
                                                            // lib/disp-core.js:432
		this.getContext = function() {
			return context;
		};
                                                            // lib/disp-core.js:436
		this.stop = function() {
			stopped = true;
		};
                                                            // lib/disp-core.js:440
		this.isStopped = function() {
			return stopped;
		};
	}
                                                            // lib/disp-core.js:445
	/*
	 * Adds a listener of the given type. If 'first' is true, the
	 * function is added at the beginning of the list.
	 */
	this.add = function( type, func, first )
	{
		if( !(type in listeners) ) {
			throw "Unknown event type: " + type;
		}
		/*
		 * If this is a "stateful" event that has been already fired,
		 * and not cancelled, call the given listener.
		 */
		if( statefulEvents.indexOf( type ) >= 0 )
		{
			var e = eventStates[type];
			if( e && !e.isStopped() ) {
				func.call( e.getContext(), e );
			}
			// and add to the list anyway
		}
                                                            // lib/disp-core.js:467
		if( first ) {
			listeners[type].unshift( func );
		} else {
			listeners[type].push( func );
		}
	};
                                                            // lib/disp-core.js:474
	this.call = function( type, data, context )
	{
		if( !(type in listeners) ) {
			throw "Unknown event type: " + type;
		}
                                                            // lib/disp-core.js:480
		if( typeof data == "undefined" ) {
			data = {};
		}
                                                            // lib/disp-core.js:484
		var e = new event(type, context, data);
                                                            // lib/disp-core.js:486
		if( statefulEvents.indexOf( type ) >= 0 ) {
			eventStates[type] = e;
		}
                                                            // lib/disp-core.js:490
		var n = listeners[type].length;
		var r;
		for( var i = 0; i < n; i++ )
		{
			r = listeners[type][i].call( context, e );
			if( r === false ) return false;
			if( e.isStopped() ) {
				return r;
			}
		}
		return true;
	};
}
                                                            // lib/disp-core.js:504
                                                            // lib/disp-core.js:505
// lib/obj.js
/*
 * Some operations on objects.
 */
var obj = (function()
{
	var obj = {};
                                                            // lib/disp-core.js:513
	obj.merge = function( _args_ )
	{
		var o = {};
		for( var i = 0; i < arguments.length; i++ )
		{
			var add = arguments[i];
			for( var k in add ) {
				o[k] = add[k];
			}
		}
		return o;
	};
                                                            // lib/disp-core.js:526
	obj.subset = function( o, fields )
	{
		var s = {};
		var n = fields.length;
		var k;
		for( var i = 0; i < n; i++ ) {
			k = fields[i];
			s[k] = o[k];
		}
		return s;
	};
                                                            // lib/disp-core.js:538
	obj.copy = function( o ) {
		return JSON.parse( JSON.stringify( o ) );
	};
                                                            // lib/disp-core.js:542
	obj.toArray = function( o ) {
		var a = [];
		for( var k in o ) {
			a.push( o[k] );
		}
		return a;
	};
                                                            // lib/disp-core.js:550
	obj.keys = function( o ) {
		var keys = [];
		for( var k in o ) keys.push( k );
		return keys;
	};
                                                            // lib/disp-core.js:556
	/*
	 * Returns a map of array indexed by values of
	 * their keyname field.
	 */
	obj.index = function( array, keyname )
	{
		var index = {};
		var n = array.length;
		for( var i = 0; i < n; i++ )
		{
			var item = array[i];
			var key = item[keyname];
			if( !key ) continue;
			index[key] = item;
		}
		return index;
	};
                                                            // lib/disp-core.js:574
	/*
	 * Returns first element matching to the filter, from the array.
	 */
	obj.find = function( array, filter )
	{
		var r = [];
		var n = array.length;
		for( var i = 0; i < n; i++ ) {
			if( this.match( array[i], filter ) ) {
				r.push( array[i] );
			}
		}
		return r;
	};
                                                            // lib/disp-core.js:589
	/*
	 * Returns first element matching to the filter, from the array.
	 */
	obj.findOne = function( array, filter )
	{
		var n = array.length;
		for( var i = 0; i < n; i++ ) {
			if( this.match( array[i], filter ) ) {
				return array[i];
			}
		}
		return null;
	};
                                                            // lib/disp-core.js:603
	/*
	 * Returns true if filter is a matching subset of item.
	 */
	obj.match = function( item, filter )
	{
		for( var k in filter )
		{
			if( !(k in item) || (item[k] != filter[k]) ) {
				return false;
			}
		}
		return true;
	};
                                                            // lib/disp-core.js:617
	obj.column = function( items, key )
	{
		var list = [];
		for( var i = 0; i < items.length; i++ ) {
			var item = items[i];
			list.push( item[key] );
		}
		return list;
	};
                                                            // lib/disp-core.js:627
	/*
	 * Returns true if the given object is empty.
	 */
	obj.isEmpty = function( item )
	{
		for( var k in item ) return false;
		return true;
	};
                                                            // lib/disp-core.js:636
	obj.unique = function( array )
	{
		var set = {};
		var vals = [];
                                                            // lib/disp-core.js:641
		for( var i = 0; i < items.length; i++ ) {
			var i = array[i];
			if( i in set ) continue;
			set[i] = true;
			vals.push( i );
		}
                                                            // lib/disp-core.js:648
		return vals;
	};
                                                            // lib/disp-core.js:651
	return obj;
})();
                                                            // lib/disp-core.js:654
                                                            // lib/disp-core.js:655
// lib/same.js
var same = (function() {
                                                            // lib/disp-core.js:658
	function same( v1, v2 )
	{
		if( v1 === v2 ) {
			return true;
		}
		if( typeof v1 != typeof v2 ) {
			return false;
		}
		if( Array.isArray( v1 ) ) {
			return arrSame( v1, v2 );
		}
		if( typeof v1 == "object" ) {
			return objSame( v1, v2 );
		}
		return false;
	}
                                                            // lib/disp-core.js:675
	function arrSame( a1, a2 )
	{
		var n = a1.length;
		if( n != a2.length ) {
			return false;
		}
		for( var i = 0; i < n; i++ ) {
			if( !same( a1[i], a2[i] ) ) {
				return false;
			}
		}
		return true;
	}
                                                            // lib/disp-core.js:689
	function objSame( o1, o2 )
	{
		for( var k in o1 ) {
			if( !(k in o2) ) {
				return false;
			}
			if( !same( o1[k], o2[k] ) ) {
				return false;
			}
		}
		for( var k in o2 ) {
			if( !(k in o1) ) {
				return false;
			}
		}
		return true;
	}
                                                            // lib/disp-core.js:707
	return same;
})();
                                                            // lib/disp-core.js:710
                                                            // lib/disp-core.js:711
// lib/time.js
/*
 * Time utility to help deal with incorrectly set clock at client side.
 */
var time = (function() {
	var time = {};
                                                            // lib/disp-core.js:718
	/*
	 * We maintan here that <local time> + <diff> = <utc time>.
	 */
	var diff;
	/*
	 * Scale division for the correction in seconds. Roughing up the
	 * scale eliminates effect of network lag. If 'snap' is 20,
	 * reported differences between local and utc time below 10 seconds
	 * are ignored.
	 */
	var snap = 20;
                                                            // lib/disp-core.js:730
	/*
	 * Set the real time. After this is done, time.utc will return
	 * correct UTC time.
	 */
	time.set = function( realUTC ) {
		var x = realUTC - now();
		diff = Math.round( x / snap ) * snap;
	};
                                                            // lib/disp-core.js:739
	time.diff = function() {
		return diff;
	};
                                                            // lib/disp-core.js:743
	/*
	 * Converts given local ("incorrect") time to UTC time (in seconds).
	 * 'local' is the local time in seconds. If 'local' is undefined,
	 * current local time is assumed.
	 */
	time.utc = function( local ) {
		if( typeof local == "undefined" ) {
			local = now();
		}
		return local + diff;
	};
                                                            // lib/disp-core.js:755
	/*
	 * Converts UTC time to local ("incorrect") time in seconds.
	 * If 'utc' is undefined, current local time is returned.
	 */
	time.local = function( utc ) {
		if( typeof utc == "undefined" ) {
			return now();
		}
		return utc - diff;
	};
                                                            // lib/disp-core.js:766
	/*
	 * Returns UTC timestamp from the given local Date object.
	 */
	time.utcFromDate = function( date ) {
		return this.utc( Math.round( date.getTime() / 1000 ) );
	};
                                                            // lib/disp-core.js:773
	function now() {
		return Math.round( Date.now() / 1000 );
	}
                                                            // lib/disp-core.js:777
	return time;
})();
                                                            // lib/disp-core.js:780
window.time = time;
                                                            // lib/disp-core.js:782
                                                            // lib/disp-core.js:783
// src/chat.js
function initChat( conn, listeners, data )
{
	var ack = {};
	var last = {};
	var disp = this;
                                                            // lib/disp-core.js:790
	data.drivers.forEach( function( driver ) {
		ack[driver.driver_id] = 0;
		last[driver.driver_id] = 0;
	});
                                                            // lib/disp-core.js:795
	this.getChatMessages = function( driverId, from, to )
	{
		return conn.dx().get( "chat-messages", {
			driver_id: driverId,
			from: from,
			to: to
		})
		.then( function( arr ) {
			var a = [];
			arr.forEach( function( data ) {
				a.push( new ChatMsg( data ) );
			});
			return a;
		});
	};
                                                            // lib/disp-core.js:811
	this.sendChatMessage = function( driverId, str )
	{
		var driver = this.getDriver( driverId );
		if( !driver ) {
			return Promise.fail( "Unknown driver id: " + driverId );
		}
                                                            // lib/disp-core.js:818
		return conn.send( "send-chat-message", {
			to: driverId,
			text: str,
			to_type: null
		});
	};
                                                            // lib/disp-core.js:825
	this.broadcastChatMessage = function( driverIds, str )
	{
		return conn.send( "broadcast-chat", {
			to: driverIds,
			text: str
		});
	};
                                                            // lib/disp-core.js:833
	this.haveNewMessages = function( driverId ) {
		return ack[driverId] < last[driverId];
	};
                                                            // lib/disp-core.js:837
	this.markChatMessages = function( driverId, lastId )
	{
		if( lastId <= ack[driverId] ) {
			return;
		}
		if( lastId > last[driverId] ) {
			return;
		}
		ack[driverId] = lastId;
		listeners.call( "chat-front-changed", {
			driver: this.getDriver( driverId ),
			unread: last[driverId] - ack[driverId]
		});
	};
                                                            // lib/disp-core.js:852
	function moveFront( message )
	{
		var driverId = message.from;
		var d = disp.getDriver( driverId );
		if( !d ) return;
                                                            // lib/disp-core.js:858
		last[driverId] = message.id;
		if( ack[driverId] == 0 ) {
			ack[driverId] = message.id - 1;
		}
		listeners.call( "chat-front-changed", {
			driver: d,
			unread: last[driverId] - ack[driverId]
		});
	}
                                                            // lib/disp-core.js:868
	conn.onMessage( "chat-message", function( msg )
	{
		var message = new ChatMsg( msg.data );
		moveFront( message );
		listeners.call( "chat-message-received", {message: message} );
	});
}
                                                            // lib/disp-core.js:876
                                                            // lib/disp-core.js:877
// src/connection.js
function Connection()
{
	var messageFunctions = {};
	var ready = false;
	var pref;
	var dx;
	var PERIOD = 3000;
                                                            // lib/disp-core.js:886
	var channel = {
		seq: undefined, // current sequence number
		urgent: false, // urgent flag
		progress: false, // a request is in progress
		tid: null // timeout id for next scheduled request
	};
                                                            // lib/disp-core.js:893
	this.RTT = function() { return dx.RTT(); };
                                                            // lib/disp-core.js:895
	/*
	 * Open the connection. The URL argument specifies the prefix for
	 * DX requests.
	 */
	this.open = function( url )
	{
		pref = url;
		dx = new DX( url );
                                                            // lib/disp-core.js:904
		/*
		 * Get the initial data packet that describes all current
		 * state of the service, and emit it as an init message.
		 */
		dx.get( 'init' ).then( function( data )
		{
			if( data.who.type != 'dispatcher' ) {
				throw "Wrong identity";
			}
                                                            // lib/disp-core.js:914
			/*
			 * Start updates before dispatching init so that both
			 * directions work when the application is called.
			 */
			if( typeof data.seq == "undefined" ) {
				throw "Undefined sequence number in startUpdates";
			}
			channel.seq = data.seq;
			channel.tid = setTimeout( receive, PERIOD );
			setTimeout( checkQueues, PERIOD );
			ready = true;
                                                            // lib/disp-core.js:926
			/*
			 * Send the init message to the application.
			 */
			var msg = {
				name: 'init',
				data: data
			};
			dispatchMessage( msg );
		});
	};
                                                            // lib/disp-core.js:937
	/*
	 * Sends a message to the server.
	 */
	this.send = function( cmd, data )
	{
		if( !ready ) {
			throw "Can't send " + cmd + ", not ready yet";
		}
		if( typeof data == "undefined" ) {
			data = {};
		}
                                                            // lib/disp-core.js:949
		console.log( "Send:", cmd, data );
                                                            // lib/disp-core.js:951
		var p = dx.post( 'cmd', {
			cmd: cmd,
			data: JSON.stringify( data )
		});
                                                            // lib/disp-core.js:956
		/*
		 * The application may start waiting for a response to this
		 * message we are sending. Since this is a polling emulation,
		 * that response may be delayed by the period, so we would
		 * signal the receiving loop to get new data now.
		 */
		p.then( function( value ) {
			receive();
			return value;
		});
                                                            // lib/disp-core.js:967
		return p;
	};
                                                            // lib/disp-core.js:970
	//--
                                                            // lib/disp-core.js:972
	/*
	 * Schedule next channel update.
	 */
	function receive()
	{
		/*
		 * If a request is already in progress, set the urgent flag so
		 * that the next iteration will start right away.
		 */
		if( channel.progress ) {
			channel.urgent = true;
			return;
		}
                                                            // lib/disp-core.js:986
		/*
		 * If we are idle, cancel the timer and go now.
		 */
		if( channel.tid ) {
			clearTimeout( channel.tid );
		}
		channel.progress = true;
		dx.get( "channel-updates", {"last-message-id": channel.seq} )
		.catch( function( error ) {
			channel.progress = false;
			/*
			 * If something happens with the request, consume the
			 * error and keep the loop running.
			 */
			console.warn( "Channel error:", error );
			return [];
		})
		.then( function( messages ) {
			channel.progress = false;
			/*
			 * Reschedule the next update before processing
			 * the messages just to shave off few milliseconds.
			 */
			if( channel.urgent ) {
				channel.urgent = false;
				channel.tid = setTimeout( receive, 1 );
			}
			else {
				channel.tid = setTimeout( receive, PERIOD );
			}
			return messages;
		})
		.then( processMessages )
	}
                                                            // lib/disp-core.js:1021
	function processMessages( messages )
	{
		messages.forEach( function( m ) {
			console.log( "Message:", m );
			channel.seq = m.message_id;
			var msg = {name: m.type, data: m.data};
			try {
				dispatchMessage( msg );
			} catch( error ) {
				console.warn( "Message error:", error );
				dispatchMessage( {name: "error", data: {error: error}} );
			}
		});
	}
                                                            // lib/disp-core.js:1036
	/*
	 * While synchronizing queue images using just update messages is
	 * appealing, there is at least one race condition which might cause
	 * the wrong client-size image right from the beginning. Rather than
	 * deal with that, better stick to brute force until the performance
	 * becomes an issue.
	 */
	function checkQueues()
	{
		dx.get( "queues-snapshot" ).then( function( data ) {
			dispatchMessage( {name: "-queues-snapshot", data: data} );
		})
		.catch( function( error ) {
			console.warn( error );
			dispatchMessage( {name: "error", data: {error: error}} );
		})
		.then( function() {
			setTimeout( checkQueues, PERIOD );
		});
	}
                                                            // lib/disp-core.js:1057
	function dispatchMessage( msg )
	{
		var n = msg.name;
		if( !(n in messageFunctions ) ) {
			console.warn( "Unknown message: " + msg.name );
			return;
		}
		messageFunctions[n].forEach( function( f ) {
			f( msg );
		});
	}
                                                            // lib/disp-core.js:1069
                                                            // lib/disp-core.js:1070
                                                            // lib/disp-core.js:1071
	/*
	 * Add a function to listen to given type of messages.
	 */
	this.onMessage = function( messageType, func )
	{
		if( messageType in messageFunctions ) {
			messageFunctions[messageType].push( func );
		} else {
			messageFunctions[messageType] = [ func ];
		}
	};
                                                            // lib/disp-core.js:1083
	this.dx = function() {
		return dx;
	};
}
                                                            // lib/disp-core.js:1088
                                                            // lib/disp-core.js:1089
// src/disp.js
                                                            // lib/disp-core.js:1091
function DispatcherClient()
{
	var url = "/dx/dispatcher";
                                                            // lib/disp-core.js:1095
	/*
	 * Dispatcher events.
	 */
	var listeners = new Listeners( [
		"*ready",
		"chat-message-received",
		"chat-front-changed",
		"connection-error",
		"driver-alarm-on",
		"driver-alarm-off",
		"driver-moved",
		"driver-changed",
		"driver-online-changed",
		"driver-block-changed",
		"queues-changed",
		"queue-assignments-changed",
		"order-added",
		"order-changed",
		"order-removed",
		"session-requested",
		"session-opened",
		"session-closed",
		"sessions-changed",
		"setting-changed",
		"service-log",
		"sync"
	] );
                                                            // lib/disp-core.js:1123
	this.on = listeners.add.bind( listeners );
                                                            // lib/disp-core.js:1125
	var _this = this;
	var data = null;
                                                            // lib/disp-core.js:1128
	/*
	 * Initialize the connection with the server.
	 */
	var conn = new Connection();
	conn.onMessage( 'init', init );
	conn.onMessage( 'error', function( msg ) {
		listeners.call( "connection-error", msg.data );
	});
	conn.onMessage( 'sync', function( msg ) {
		listeners.call( "sync" );
	});
	conn.open( url );
                                                            // lib/disp-core.js:1141
	function init( msg )
	{
		data = msg.data;
		time.set( data.now );
                                                            // lib/disp-core.js:1146
		for( var i = 0; i < data.fares.length; i++ ) {
			data.fares[i] = new Fare( data.fares[i] );
		}
                                                            // lib/disp-core.js:1150
		[ initSettings,
			initChat,
			initDrivers,
			initDriverAlarms,
			initOrders,
			initLocations,
			initQueues,
			initSessions,
			initImitations ].forEach(
		function( f ) {
			f.call( _this, conn, listeners, data );
		});
                                                            // lib/disp-core.js:1163
		listeners.call( 'ready' );
	}
                                                            // lib/disp-core.js:1166
	conn.onMessage( "service-log", function( msg ) {
		listeners.call( "service-log", msg.data );
	});
                                                            // lib/disp-core.js:1170
	this.id = function() { return data.who.id; };
	this.login = function() { return data.who.login; };
	this.RTT = function() { return conn.RTT(); };
                                                            // lib/disp-core.js:1174
	this.param = function( name ) {
		return data.service_options[name];
	};
                                                            // lib/disp-core.js:1178
	this.fares = function() {
		return data.fares;
	};
                                                            // lib/disp-core.js:1182
	this.findCustomer = function( phone )
	{
		return conn.dx().get( "customer-info", {phone: phone} )
		.then( function( info )
		{
			if( !info ) throw "No such customer";
			var c = {name: info.name, addresses: []};
			info.addresses.forEach( function( data ) {
				var addr = new Address( data );
				if( addr.isEmpty() ) return;
				c.addresses.push( addr );
			});
			return c;
		});
	};
}
window.DispatcherClient = DispatcherClient;
                                                            // lib/disp-core.js:1200
                                                            // lib/disp-core.js:1201
// src/driver-alarms.js
function initDriverAlarms( conn, listeners, data )
{
	var alarms = {};
                                                            // lib/disp-core.js:1206
	data.driver_alarms.forEach( function( alarm ) {
		alarms[alarm.driver_id] = alarm;
	});
                                                            // lib/disp-core.js:1210
	this.driverAlarms = function() {
		var list = [];
		for( var driverId in alarms ) {
			list.push( {driverId: driverId} );
		}
		return list;
	};
                                                            // lib/disp-core.js:1218
	conn.onMessage( 'driver-alarm-on', function( msg )
	{
		var driver = disp.getDriver( msg.data.driver_id );
		if( !driver ) return;
                                                            // lib/disp-core.js:1223
		alarms[driver.id] = msg.data;
		listeners.call( 'driver-alarm-on', {driver: driver} );
	});
                                                            // lib/disp-core.js:1227
	conn.onMessage( 'driver-alarm-off', function( msg )
	{
		var driver = disp.getDriver( msg.data.driver_id );
		if( !driver ) return;
                                                            // lib/disp-core.js:1232
		if( !(driver.id in alarms) ) {
			console.error( "There is no alarm for", driver.id );
			return;
		}
		listeners.call( 'driver-alarm-off', {driver: driver} );
	});
}
                                                            // lib/disp-core.js:1240
                                                            // lib/disp-core.js:1241
// src/drivers.js
function initDrivers( conn, listeners, data )
{
	var drivers = {};
	var cars = {};
                                                            // lib/disp-core.js:1247
	data.drivers.forEach( function( d ) {
		var d = new Driver( d );
		drivers[d.id] = d;
	});
                                                            // lib/disp-core.js:1252
	data.cars.forEach( function( d ) {
		var c = new Car( d );
		cars[c.id] = c;
	});
                                                            // lib/disp-core.js:1257
	this.drivers = function() {
		return obj.toArray( drivers ).sort( function( a, b ) {
			return natcmp( a.call_id, b.call_id );
		});
	};
                                                            // lib/disp-core.js:1263
	this.getDriver = function( driverId ) {
		return drivers[driverId];
	};
                                                            // lib/disp-core.js:1267
	this.getCar = function( carId ) {
		return cars[carId];
	};
                                                            // lib/disp-core.js:1271
	this.getDriverCar = function( driverId ) {
		var d = drivers[driverId];
		return cars[d.car_id];
	};
                                                            // lib/disp-core.js:1276
	this.driverTypes = function() {
		return data.driver_types;
	};
                                                            // lib/disp-core.js:1280
	/*
	 * Blocks given driver for given amount of seconds. If `seconds` is
	 * < 0, then the driver is unblocked.
	 */
	this.blockDriver = function( driverId, seconds, reason ) {
		return conn.send( 'ban-taxi', {
			driver_id: driverId,
			seconds: seconds,
			reason: reason
		});
	};
                                                            // lib/disp-core.js:1292
	this.unblockDriver = function( driverId ) {
		return conn.send( 'unban-taxi', {
			driver_id: driverId
		});
	};
                                                            // lib/disp-core.js:1298
	this.changeDriverGroup = function( driverId, groupId ) {
		return conn.send( 'change-driver-group', {
			driver_id: driverId,
			group_id: groupId
		});
	};
                                                            // lib/disp-core.js:1305
	conn.onMessage( 'driver-changed', function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1310
		var prevOnline = driver.is_online == '1';
                                                            // lib/disp-core.js:1312
		var diff = msg.data.diff;
		for( var k in diff ) {
			driver[k] = diff[k];
		}
                                                            // lib/disp-core.js:1317
		var online = driver.is_online == '1';
		if( online != prevOnline ) {
			listeners.call( "driver-online-changed", {driver: driver} );
		}
		listeners.call( 'driver-changed', {driver: driver} );
	});
                                                            // lib/disp-core.js:1324
	conn.onMessage( "driver-blocked", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1329
		driver.block_until = msg.data.until;
		driver.block_reason = msg.data.reason;
		listeners.call( "driver-block-changed", {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});
                                                            // lib/disp-core.js:1335
	conn.onMessage( "driver-unblocked", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1340
		driver.block_until = 0;
		driver.block_reason = "";
		listeners.call( "driver-block-changed", {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});
                                                            // lib/disp-core.js:1346
	conn.onMessage( 'driver-position', function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1351
		driver.latitude = msg.data.latitude;
		driver.longitude = msg.data.longitude;
		listeners.call( 'driver-moved', {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});
                                                            // lib/disp-core.js:1357
	conn.onMessage( "driver-busy", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1362
		driver.is_busy = msg.data.busy;
		listeners.call( "driver-changed", {driver: driver} );
	});
                                                            // lib/disp-core.js:1366
	function msgDriver( msg ) {
		var driver_id = msg.data.driver_id;
		var driver = drivers[driver_id];
		if( !driver ) {
			console.warn( "Received " + msg.name + " for unknown driver", driver_id );
			return null;
		}
		return driver;
	}
}
                                                            // lib/disp-core.js:1377
                                                            // lib/disp-core.js:1378
// src/imitations.js
function initImitations( conn, listeners, data )
{
	this.setDriverOnline = function( driver_id, online ) {
		return conn.send( 'set-imitation-online', {
			taxi_id: driver_id,
			online: online? 1 : 0
		})
	};
                                                            // lib/disp-core.js:1388
	this.imitationsEnabled = function() {
		return data.service_options.imitations == "1";
	};
}
                                                            // lib/disp-core.js:1393
                                                            // lib/disp-core.js:1394
// src/locations.js
function initLocations( conn, listeners, data )
{
	var locations = {};
                                                            // lib/disp-core.js:1399
	data.queue_locations.forEach( function( d ) {
		var loc = new Location( d );
		locations[loc.id] = loc;
	});
                                                            // lib/disp-core.js:1404
	this.locations = function() {
		return obj.toArray( locations );
	};
                                                            // lib/disp-core.js:1408
	this.getLocation = function( locId ) {
		return locations[locId];
	};
                                                            // lib/disp-core.js:1412
	this.getQueueLocation = function( qid ) {
		for( var locid in locations ) {
			if( locations[locid].queue_id == qid ) {
				return locations[locid];
			}
		}
		return null;
	};
                                                            // lib/disp-core.js:1421
	this.suggestLocations = function( term ) {
		return conn.dx().get( "locations", {term: term} );
	};
}
                                                            // lib/disp-core.js:1426
                                                            // lib/disp-core.js:1427
// src/obj/address.js
function Address( data )
{
	this.place = '';
	this.street = '';
	this.house = '';
	this.building = '';
	this.entrance = '';
	this.apartment = '';
                                                            // lib/disp-core.js:1437
	for( var k in data ) {
		this[k] = data[k];
	}
}
                                                            // lib/disp-core.js:1442
Address.prototype.format = function()
{
	var s = this.street;
	if( this.house && this.house != '' )
	{
		s += ", д." + this.house;
		if( this.building && this.building != '' ){
			s += " к. " + this.building;
		}
		if( this.entrance && this.entrance != '' ){
			s += ", под. " + this.entrance;
		}
		if( this.apartment && this.apartment != '' ) {
			s += ", кв. " + this.apartment;
		}
	}
	return s;
};
                                                            // lib/disp-core.js:1461
Address.prototype.isEmpty = function()
{
	return this.place == "" || this.street == "";
};
                                                            // lib/disp-core.js:1466
window.Address = Address;
                                                            // lib/disp-core.js:1468
                                                            // lib/disp-core.js:1469
// src/obj/car.js
function Car( data )
{
	var spec = {
		car_id: "int",
		name: "str",
		plate: "str",
		body_type: "str",
		color: "str"
	};
	assertObj( data, spec );
                                                            // lib/disp-core.js:1481
	for( var k in spec ) {
		this[k] = data[k];
	}
                                                            // lib/disp-core.js:1485
	this.id = this.car_id;
}
                                                            // lib/disp-core.js:1488
Car.prototype.bodyName = function()
{
	var bodies = {
		"sedan": "седан",
		"estate": "универсал",
		"hatchback": "хетчбек",
		"minivan": "минивен",
		"bus": "автобус"
	};
                                                            // lib/disp-core.js:1498
	if( this.body_type in bodies ) return bodies[this.body_type];
	return this.body_type;
};
                                                            // lib/disp-core.js:1502
Car.prototype.format = function()
{
	var parts = [
		this.name, this.color, this.bodyName(), this.plate
	].filter( hasValue );
	return parts.join( ', ' );
};
                                                            // lib/disp-core.js:1510
                                                            // lib/disp-core.js:1511
// src/obj/chatmsg.js
function ChatMsg( data )
{
	var spec = {
		"id": "int",
		"text": "str",
		"from": "int",
		"to": "int?",
		"to_type": "str?",
		"utc": "int"
	};
                                                            // lib/disp-core.js:1523
	assertObj( data, spec );
                                                            // lib/disp-core.js:1525
	for( var k in spec ) this[k] = data[k];
}
                                                            // lib/disp-core.js:1528
                                                            // lib/disp-core.js:1529
// src/obj/driver.js
function Driver( data )
{
	var spec = {
		"driver_id": "int",
		"call_id": "str",
		"name": "str",
		"phone": "str",
		"car_id": "int?",
		"group_id": "int",
		"type_id": "int?",
		"is_fake": "int",
		"has_bank_terminal": "int",
		"is_online": "int",
		"block_until": "int",
		"block_reason": "str",
		"latitude": "flt",
		"longitude": "flt",
		"is_busy": "int"
	};
	assertObj( data, spec );
	for( var k in spec ) {
		this[k] = data[k];
	}
	this.id = this.driver_id;
}
                                                            // lib/disp-core.js:1556
Driver.prototype.surname = function()
{
	var pos = this.name.indexOf( ' ' );
	if( pos == -1 ) return this.name;
	return this.name.substr( 0, pos );
};
                                                            // lib/disp-core.js:1563
Driver.prototype.coords = function() {
	return [this.latitude, this.longitude];
};
                                                            // lib/disp-core.js:1567
Driver.prototype.online = function() {
	return this.is_online == 1;
};
                                                            // lib/disp-core.js:1571
Driver.prototype.blocked = function()
{
	return this.block_until > time.utc();
};
                                                            // lib/disp-core.js:1576
Driver.prototype.blockDesc = function()
{
	if( !this.blocked() ) {
		return '';
	}
                                                            // lib/disp-core.js:1582
	var msg = 'Заблокирован до ';
                                                            // lib/disp-core.js:1584
	var now = new Date();
	var release = new Date( time.local( this.block_until ) * 1000 );
                                                            // lib/disp-core.js:1587
	if( release.getDate() == now.getDate() ) {
		msg += formatTime( release.getTime() / 1000 );
	} else {
		msg += formatDateTime( release.getTime() / 1000 );
	}
	if( this.block_reason != '' ) {
		msg += ' (' + this.block_reason + ')';
	}
	return msg;
};
                                                            // lib/disp-core.js:1598
Driver.prototype.format = function()
{
	if( !this.name ) return this.call_id;
                                                            // lib/disp-core.js:1602
	var s = this.name;
	if( this.phone ) {
		s += ', тел. ' + formatPhone( this.phone );
	}
	return s;
};
                                                            // lib/disp-core.js:1609
                                                            // lib/disp-core.js:1610
// src/obj/fare.js
function Fare( data )
{
	var spec = {
		"name": "str",
		"minimal_price": "int",
		"start_price": "int",
		"kilometer_price": "int",
		"slow_hour_price": "int"
	};
                                                            // lib/disp-core.js:1621
	assertObj( data, spec );
                                                            // lib/disp-core.js:1623
	for( var k in spec ) this[k] = data[k];
}
                                                            // lib/disp-core.js:1626
Fare.prototype.price = function( distance )
{
	var price = this.start_price + distance / 1000 * this.kilometer_price;
	if( price < this.minimal_price ) {
		price = this.minimal_price;
	}
	return price;
};
                                                            // lib/disp-core.js:1635
                                                            // lib/disp-core.js:1636
// src/obj/location.js
function Location( data )
{
	var spec = {
		"loc_id": "int",
		"name": "str",
		"contact_phone": "str?",
		"contact_name": "str?",
		"addr": "",
		"latitude": "flt",
		"longitude": "flt",
		"queue_id": "int?"
	};
                                                            // lib/disp-core.js:1650
	for( var k in spec ) this[k] = data[k];
                                                            // lib/disp-core.js:1652
	this.id = data.loc_id;
                                                            // lib/disp-core.js:1654
	this.coords = function() {
		return [this.latitude, this.longitude];
	};
}
                                                            // lib/disp-core.js:1659
                                                            // lib/disp-core.js:1660
// src/obj/order.js
function Order( data )
{
	if( !("order_uid" in data) ) {
		data.order_uid = fmt( "%d-%d", disp.id(), Date.now() );
	}
                                                            // lib/disp-core.js:1667
	if( "src" in data ) {
		this.src = {
			addr: new Address( data.src.addr ),
			loc_id: data.src.loc_id
		};
	}
	else {
		this.src = {
			addr: new Address(),
			loc_id: null
		};
	}
                                                            // lib/disp-core.js:1680
	if( data.dest && ("addr" in data.dest) ) {
		this.dest = {
			addr: new Address( data.dest.addr ),
			loc_id: data.dest.loc_id
		};
	}
	else {
		this.dest = null;
	}
                                                            // lib/disp-core.js:1690
	var orderFields = [
		'order_id',
		'order_uid',
		'owner_id',
		'taxi_id',
		'time_created',
		'exp_arrival_time',
		'reminder_time',
		'status',
		'comments',
		'customer_name',
		'customer_phone',
		'opt_vip',
		'opt_terminal',
		'opt_car_class'
	];
                                                            // lib/disp-core.js:1707
	for( var i = 0; i < orderFields.length; i++ )
	{
		var k = orderFields[i];
		this[k] = data[k];
	}
	this.id = this.order_uid;
}
                                                            // lib/disp-core.js:1715
Order.prototype.POSTPONED = 'postponed';
Order.prototype.DROPPED = 'dropped';
Order.prototype.WAITING = 'waiting';
Order.prototype.ASSIGNED = 'assigned';
Order.prototype.ARRIVED = 'arrived';
Order.prototype.STARTED = 'started';
Order.prototype.FINISHED = 'finished';
Order.prototype.CANCELLED = 'cancelled';
                                                            // lib/disp-core.js:1724
Order.prototype.statusName = function()
{
	var statusNames = {
		'postponed': 'отложен',
		'waiting': 'ожидание ответа',
		'dropped': 'не принят',
		'assigned': 'принят',
		'arrived': 'на месте',
		'started': 'выполняется',
		'finished': 'завершён',
		'cancelled': 'отменён'
	};
                                                            // lib/disp-core.js:1737
	var s = this.status;
	if( s == this.POSTPONED && !this.exp_arrival_time ) {
		s = 'waiting';
	}
	return statusNames[s] || this.status;
};
                                                            // lib/disp-core.js:1744
/*
 * Returns true if the order is closed.
 */
Order.prototype.closed = function()
{
	var s = this.status;
	return s == this.DROPPED || s == this.FINISHED || s == this.CANCELLED;
};
                                                            // lib/disp-core.js:1753
/*
 * Returns true if the order is postponed.
 */
Order.prototype.postponed = function()
{
	/*
	 * Status checking is not enough because all orders start with
	 * the "postponed" state. Those that are really postponed have
	 * the arrival time defined.
	 */
	return this.status == this.POSTPONED && this.exp_arrival_time;
};
                                                            // lib/disp-core.js:1766
/*
 * Returns true if the order's status allows changing the address and
 * options.
 */
Order.prototype.canEdit = function()
{
	return (this.status == this.POSTPONED
		|| this.status == this.DROPPED);
};
                                                            // lib/disp-core.js:1776
Order.prototype.formatOptions = function()
{
	var carTypes = {
		"ordinary": "седан или хэтчбек",
		"hatchback": "хетчбек",
		"sedan": "седан",
		"estate": "универсал",
		"bus": "автобус",
		"minivan": "минивен"
	};
                                                            // lib/disp-core.js:1787
	var parts = [];
	if( this.opt_terminal == '1' ) {
		parts.push( 'терминал' );
	}
	if( this.opt_car_class != '' ) {
		parts.push( carTypes[this.opt_car_class] || this.opt_car_class );
	}
	if( this.opt_vip == '1' ) {
		parts.push( 'VIP' );
	}
	return parts.join( ', ' );
};
                                                            // lib/disp-core.js:1800
Order.prototype.formatAddress = function()
{
	return this.src.addr.format();
};
                                                            // lib/disp-core.js:1805
Order.prototype.formatDestination = function()
{
	return this.dest.addr.format();
};
                                                            // lib/disp-core.js:1810
window.Order = Order;
                                                            // lib/disp-core.js:1812
                                                            // lib/disp-core.js:1813
// src/obj/queue.js
function Queue( data )
{
	var spec = {
		"queue_id": "int",
		"parent_id": "int?",
		"name": "str",
		"order": "int",
		"priority": "int",
		"min": "int",
		"latitude": "flt",
		"longitude": "flt",
		"loc_id": "int?"
	};
	assertObj( data, spec );
                                                            // lib/disp-core.js:1829
	for( var k in spec ) {
		this[k] = data[k];
	}
                                                            // lib/disp-core.js:1833
	this.id = data.queue_id;
}
                                                            // lib/disp-core.js:1836
Queue.prototype.coords = function() {
	return [this.latitude, this.longitude];
};
                                                            // lib/disp-core.js:1840
                                                            // lib/disp-core.js:1841
// src/obj/session.js
function Session( data )
{
	var spec = {
		"session_id": "int",
		"driver_id": "int",
		"car_id": "int",
		"time_started": "int"
	};
	assertObj( data, spec );
                                                            // lib/disp-core.js:1852
	for( var k in spec ) {
		this[k] = data[k];
	}
                                                            // lib/disp-core.js:1856
	this.id = this.session_id;
}
                                                            // lib/disp-core.js:1859
                                                            // lib/disp-core.js:1860
// src/orders.js
function initOrders( conn, listeners, data )
{
	var _this = this;
	var orders = {};
	var orderPromises = {};
	var MAX_AGE = 12 * 3600 * 1000;
                                                            // lib/disp-core.js:1868
	initLists();
	setInterval( cleanOrders, 10000 );
	//setInterval( checkReminders, 1000 );
                                                            // lib/disp-core.js:1872
	//--
                                                            // lib/disp-core.js:1874
	function initLists()
	{
		var now = time.utc();
                                                            // lib/disp-core.js:1878
		data.recent_orders.forEach( function( d )
		{
			assertObj( d, {
				"order_uid": "str",
				"owner_id": "int",
				"taxi_id": "int?",
				"time_created": "int",
				"exp_arrival_time": "int?",
				"reminder_time": "int?",
				"status": "str",
				"src": "",
				"dest": "",
				"comments": "str",
				"customer_name": "str",
				"customer_phone": "str",
				"opt_car_class": "str",
				"opt_vip": "int",
				"opt_terminal": "int"
			});
			var o = new Order( d );
			/*
			 * If the order is closed and is too old, don't even add
			 * it.
			 */
			if( o.closed() && now - o.time_created >= MAX_AGE ) {
				return;
			}
			orders[o.id] = o;
		});
	}
                                                            // lib/disp-core.js:1909
	/*
	 * Remove all closed orders that are older than MAX_AGE.
	 */
	function cleanOrders()
	{
		var keys = [];
		var now = time.utc();
		for( var id in orders )
		{
			var order = orders[id];
			if( !order.closed() ) continue;
			if( now - order.time_created < MAX_AGE ) continue;
			keys.push( id );
		}
		if( !keys.length ) return;
                                                            // lib/disp-core.js:1925
		keys.forEach( function( id ) {
			var order = orders[id];
			listeners.call( "order-removed", {order: order} );
			delete orders[id];
		});
	}
                                                            // lib/disp-core.js:1932
	//--
                                                            // lib/disp-core.js:1934
	/*
	 * Save order in the "postponed" state.
	 */
	this.saveOrder = function( order )
	{
		var data = obj.subset( order, [
			'order_uid',
			'exp_arrival_time',
			'reminder_time',
			'src',
			'dest',
			'comments',
			'customer_name',
			'customer_phone',
			'opt_car_class',
			'opt_vip',
			'opt_terminal'
		]);
		return conn.send( 'save-order', data );
	};
                                                            // lib/disp-core.js:1955
	/*
	 * Tells the server to dispatch the order to drivers.
	 */
	this.sendOrder = function( order, driver_id )
	{
		var order_uid = order.order_uid;
		if( typeof driver_id == "undefined" ) {
			driver_id = null;
		}
                                                            // lib/disp-core.js:1965
		var p = conn.send( "send-order", {
			order_uid: order_uid,
			driver_id: driver_id
		});
		/*
		 * If the command succeeds, create a new promise that will be
		 * resolved later and return it.
		 */
		p = p.then( function( val )
		{
			var h = {};
			h.promise = new Promise( function( ok, fail ) {
				h.ok = ok;
				h.fail = fail;
			});
			orderPromises[order_uid] = h;
			return h.promise;
		});
                                                            // lib/disp-core.js:1984
		return p;
	};
                                                            // lib/disp-core.js:1987
	this.cancelOrder = function( uid, reason ) {
		return conn.send( "cancel-order", {
			order_uid: uid,
			reason: reason
		});
	};
                                                            // lib/disp-core.js:1994
	conn.onMessage( "order-created", function( msg )
	{
		var data = msg.data;
		var uid = data.order_uid;
		var o = new Order( data );
                                                            // lib/disp-core.js:2000
		if( uid in orders )
		{
			/*
			 * Copy data to the existing order.
			 */
			for( var k in o ) {
				orders[uid][k] = o[k];
			}
			listeners.call( "order-changed", {order: orders[uid]} );
		}
		else
		{
			orders[uid] = o;
			listeners.call( "order-added", {order: o} );
		}
	});
                                                            // lib/disp-core.js:2017
	var statuses = {
		"taxi-arrived": Order.prototype.ARRIVED,
		"order-started": Order.prototype.STARTED,
		"order-finished": Order.prototype.FINISHED,
		"order-cancelled": Order.prototype.CANCELLED,
		"order-accepted": Order.prototype.ASSIGNED,
		"order-dropped": Order.prototype.DROPPED
	};
                                                            // lib/disp-core.js:2026
	for( var msgname in statuses ) {
		conn.onMessage( msgname, updateOrder );
	}
                                                            // lib/disp-core.js:2030
	function updateOrder( msg )
	{
		var uid = msg.data.order_uid;
		var order = orders[uid];
		if( !order ) {
			error( "Unknown order uid: " + uid );
			return;
		}
                                                            // lib/disp-core.js:2039
		var status = statuses[msg.name];
                                                            // lib/disp-core.js:2041
		order.status = status;
		switch( status )
		{
			case order.CANCELLED:
				order.cancel_reason = msg.data.cancel_reason;
				failOrderPromise( uid, "cancelled" );
				break;
			case order.DROPPED:
				failOrderPromise( uid, "dropped" );
				break;
			case order.ASSIGNED:
				order.exp_arrival_time = msg.data.est_arrival_time;
				var driver = _this.getDriver( msg.data.driver_id );
				order.taxi_id = driver.id;
				fulfilOrderPromise( uid, driver );
				break;
		}
		listeners.call( "order-changed", {order: order} );
	}
                                                            // lib/disp-core.js:2061
	function failOrderPromise( uid, reason )
	{
		if( !(uid in orderPromises) ) {
			return;
		}
		orderPromises[uid].fail( reason );
		delete orderPromises[uid];
	}
                                                            // lib/disp-core.js:2070
	function fulfilOrderPromise( uid, driver )
	{
		if( !(uid in orderPromises) ) {
			return;
		}
		orderPromises[uid].ok( driver );
		delete orderPromises[uid];
	}
                                                            // lib/disp-core.js:2079
	this.getDriverOrders = function( driverId )
	{
		var list = [];
		for( var uid in orders ) {
			var order = orders[uid];
			if( order.taxi_id == driverId ) {
				list.push( order );
			}
		}
		return list;
	};
                                                            // lib/disp-core.js:2091
	/*
	 * Returns list of all current and some recent orders.
	 */
	this.orders = function() {
		return obj.toArray( orders );
	};
                                                            // lib/disp-core.js:2098
	/*
	 * Returns order with given id, if it is current or recent.
	 */
	this.getOrder = function( uid ) {
		return orders[uid];
	};
}
                                                            // lib/disp-core.js:2106
                                                            // lib/disp-core.js:2107
// src/queues.js
function initQueues( conn, listeners, data )
{
	var queues = {};
	var queueDrivers = {}; // qid => [driver_id, ...]
	var disp = this;
                                                            // lib/disp-core.js:2114
	/*
	 * Group id => group object.
	 */
	var groups = {};
                                                            // lib/disp-core.js:2119
	data.queues.forEach( function( d ) {
		var q = new Queue( d );
		q.subqueues = [];
		queues[q.id] = q;
	});
                                                            // lib/disp-core.js:2125
	var tree = createTree();
	function createTree()
	{
		var Q = {};
		obj.keys( queues ).forEach( function( qid )
		{
			var q = queues[qid];
			var pid = q.parent_id;
                                                            // lib/disp-core.js:2134
			if( pid ) {
				if( !(pid in Q) ) {
					Q[pid] = queues[pid];
				}
				Q[pid].subqueues.push( q );
			}
			else {
				Q[qid] = q;
			}
		});
                                                            // lib/disp-core.js:2145
		var list = [];
		for( var qid in Q ) {
			Q[qid].subqueues = Q[qid].subqueues.sort( function( q1, q2 ) {
				return q1.priority - q2.priority;
			});
			list.push( Q[qid] );
		}
		return list.sort( function( a, b ) { return a.order - b.order } );
	}
                                                            // lib/disp-core.js:2155
	saveAssignments( data.queues_snapshot );
                                                            // lib/disp-core.js:2157
	data.groups.forEach( function( g ) {
		groups[g.group_id] = g;
	});
                                                            // lib/disp-core.js:2161
	var prevSnapshot = [];
                                                            // lib/disp-core.js:2163
	conn.onMessage( "-queues-snapshot", function( msg )
	{
		var data = msg.data;
		/*
		 * If the snapshot hasn't changed, ignore the update.
		 */
		if( same( prevSnapshot, data ) ) {
			return;
		}
		prevSnapshot = data;
                                                            // lib/disp-core.js:2174
		queueDrivers = {};
		saveAssignments( data );
		listeners.call( "queue-assignments-changed" );
	});
                                                            // lib/disp-core.js:2179
	function saveAssignments( data )
	{
		data.forEach( function( o ) {
			/*
			 * Make sure the identifiers are not strings.
			 */
			var list = [];
			o.drivers.forEach( function( id ) {
				list.push( parseInt( id, 10 ) );
			});
			var qid = o.queue_id;
			queueDrivers[qid] = list;
		});
	}
                                                            // lib/disp-core.js:2194
	/*
	 * Returns array of drivers in the given queue.
	 */
	this.getQueueDrivers = function( qid ) {
		var a = [];
		queueDrivers[qid].forEach( function( id ) {
			a.push( disp.getDriver( id ) );
		});
		return a;
	};
                                                            // lib/disp-core.js:2205
	/*
	 * Returns queue the driver is in.
	 */
	this.getDriverQueue = function( driverId )
	{
		var loc = driverPosition( driverId );
		if( !loc ) return null;
		return queues[loc.qid];
	};
                                                            // lib/disp-core.js:2215
	this.queues = function() {
		var list = [];
		tree.forEach( function( q ) {
			list.push( q );
			q.subqueues.forEach( function( q ) {
				list.push( q );
			});
		});
		return list;
	};
                                                            // lib/disp-core.js:2226
	this.getQueue = function( queueId ) {
		return queues[queueId];
	};
                                                            // lib/disp-core.js:2230
	function driverPosition( driverId )
	{
		for( var qid in queueDrivers )
		{
			var list = queueDrivers[qid];
			var pos = list.indexOf( driverId );
			if( pos != -1 ) {
				return {qid: qid, pos: pos};
			}
		}
		return null;
	}
                                                            // lib/disp-core.js:2243
	this.restoreDriverQueue = function( driver_id )
	{
		return conn.send( 'restore-queue', {
			driver_id: driver_id
		});
	};
                                                            // lib/disp-core.js:2250
	this.assignDriverQueue = function( driver_id, qid, pos )
	{
		if( qid <= 0 ) {
			return this.removeDriverQueue( driver_id );
		}
                                                            // lib/disp-core.js:2256
		return conn.send( 'put-into-queue', {
			driver_id: driver_id,
			queue_id: qid,
			pos: pos
		});
	};
                                                            // lib/disp-core.js:2263
	this.removeDriverQueue = function( driver_id )
	{
		return conn.send( 'remove-from-queue', {
			driver_id: driver_id
		});
	};
                                                            // lib/disp-core.js:2270
	this.suggestQueue = function( driver_id, qid, pos )
	{
		return conn.send( 'suggest-queue', {
			driver_id: driver_id,
			queue_id: qid,
			pos: pos
		});
	};
                                                            // lib/disp-core.js:2279
	this.changeQueue = function( qid, min, priority )
	{
		return conn.send( 'change-queue', {
			queue_id: qid,
			min: min,
			priority: priority
		});
	};
                                                            // lib/disp-core.js:2288
	conn.onMessage( 'queue-changed', function( msg )
	{
		var data = msg.data;
		var q = queues[data.queue_id];
		q.min = data.min;
		q.priority = data.priority;
                                                            // lib/disp-core.js:2295
		/*
		 * Resort the queues list since the order has changed.
		 */
		if( q.parent_id ) {
			resortQueueChildren( q );
		}
		listeners.call( "queues-changed" );
	});
                                                            // lib/disp-core.js:2304
	function resortQueueChildren( q )
	{
		var p = queues[q.parent_id];
		var list = p.subqueues;
                                                            // lib/disp-core.js:2309
		for( var i = 0; i < list.length; i++ )
		{
			if( list[i].queue_id == q.id ) {
				break;
			}
		}
		list.splice( i, 1 );
		list.splice( q.priority, 0, q );
		for( i = 0; i < list.length; i++ ) {
			list[i].priority = i;
		}
	}
                                                            // lib/disp-core.js:2322
	this.allowedQueues = function( driverId )
	{
		var driver = this.getDriver( driverId );
		var available = groups[driver.group_id].queues.slice();
		return available;
	};
                                                            // lib/disp-core.js:2329
	this.getQueueGroups = function( qid )
	{
		var list = [];
		for( var gid in groups ) {
			if( groups[gid].queues.indexOf( qid ) >= 0 ) {
				list.push( groups[gid] );
			}
		}
		return list;
	};
                                                            // lib/disp-core.js:2340
	this.haveNonQueueGroups = function()
	{
		for( var gid in groups )
		{
			var g = groups[gid];
			if( g.queues.length == 0 ) {
				return true;
			}
		}
		return false;
	};
}
                                                            // lib/disp-core.js:2353
                                                            // lib/disp-core.js:2354
// src/sessions.js
function initSessions( conn, listeners, data )
{
	var sessions = {};
	var disp = this;
                                                            // lib/disp-core.js:2360
	data.sessions.forEach( function( s ) {
		var id = s.session_id;
		sessions[id] = s;
	});
                                                            // lib/disp-core.js:2365
	conn.onMessage( 'session-opened', function( msg )
	{
		var id = msg.data.session_id;
		var driver_id = msg.data.driver_id;
		var driver = disp.getDriver( driver_id );
		if( !driver ) {
			console.warn( "Unknown driver in session-opened: " + driver_id );
			return;
		}
		var s = new Session( msg.data );
		sessions[s.id] = s;
		listeners.call( 'sessions-changed' );
		listeners.call( 'session-opened', {session: s} );
	});
                                                            // lib/disp-core.js:2380
	conn.onMessage( 'session-closed', function( msg )
	{
		var id = msg.data.session_id;
		if( !(id in sessions) ) {
			console.warn( "Unknown session_id in session-closed: " + id );
			return;
		}
		listeners.call( 'session-closed', {session: sessions[id]} );
		delete sessions[id];
		listeners.call( 'sessions-changed' );
	});
                                                            // lib/disp-core.js:2392
	conn.onMessage( 'session-requested', function( msg )
	{
		var req = {
			driver_id: msg.data.driver_id,
			odometer: msg.data.odometer
		};
		listeners.call( 'session-requested', req );
	});
                                                            // lib/disp-core.js:2401
	this.sessionsEnabled = function() {
		return data.service_options.sessions == '1';
	};
                                                            // lib/disp-core.js:2405
	this.sessions = function()
	{
		var list = [];
		for( var k in sessions ) {
			list.push( sessions[k] );
		}
		return list;
	};
                                                            // lib/disp-core.js:2414
	this.sessionRequired = function( driverId )
	{
		if( data.service_options.sessions != '1' ) return false;
		return getDriverSession( driverId ) == null;
	};
                                                            // lib/disp-core.js:2420
	function getDriverSession( driverId )
	{
		for( var id in sessions ) {
			if( sessions[id].driver_id == driverId ) {
				return sessions[id];
			}
		}
		return null;
	};
                                                            // lib/disp-core.js:2430
	this.openSession = function( driver_id, odometer ) {
		return conn.send( 'open-session', {
			driver_id: driver_id,
			odometer: odometer
		});
	};
                                                            // lib/disp-core.js:2437
	this.closeSession = function( driver_id, odometer ) {
		return conn.send( 'close-session', {
			driver_id: driver_id,
			odometer: odometer
		});
	};
}
                                                            // lib/disp-core.js:2445
                                                            // lib/disp-core.js:2446
// src/settings.js
function initSettings( conn, listeners, data )
{
	var settings = {};
                                                            // lib/disp-core.js:2451
	try {
		var s = JSON.parse( data.who.settings );
		settings = obj.merge( settings, s );
	} catch( e ) {
		console.warn( "Could not parse saved settings:", e );
	}
                                                            // lib/disp-core.js:2458
	this.getSetting = function( name, def ) {
		if( name in settings ) return settings[name];
		return def;
	};
                                                            // lib/disp-core.js:2463
	this.changeSetting = function( name, val ) {
		if( settings[name] == val ) return;
		settings[name] = val;
	};
                                                            // lib/disp-core.js:2468
	this.saveSettings = function() {
		return conn.dx().post( 'prefs', {prefs: JSON.stringify( settings )} );
	};
}
                                                            // lib/disp-core.js:2473
})();


// lib/drag.js
function initDrag( container, settings )
{
	var $container = $( container );
	var defaults = {
		itemsSelector: "*",
		landsSelector: "*",
		onDragStart: null,
		onDragEnd: null,
		onDragCancel: null
	};
                                                            // lib/drag.js:11
	if( !settings ) settings = {};
	for( var k in defaults ) {
		if( !(k in settings) ) {
			settings[k] = defaults[k];
		}
	}
                                                            // lib/drag.js:18
	/*
	 * There are three states that we work with: (1) no dragging,
	 * (2) preparing to drag, and (3) dragging.
	 */
	var NONE = 0, PREPARING = 1, DRAGGING = 2;
	var state = NONE;
                                                            // lib/drag.js:25
	var $window = $( window );
                                                            // lib/drag.js:27
	/*
	 * Pushing the button down will trigger the transition from 'none'
	 * to 'preparing'.
	 */
	$container.on( "mousedown", settings.itemsSelector, function( event )
	{
		event.preventDefault();
		state = PREPARING;
		init( event );
	});
                                                            // lib/drag.js:38
	/*
	 * Dragging the mouse far enough from the initial position will
	 * trigger the transition to 'dragging' state.
	 */
	$window.on( "mousemove", function( event )
	{
		if( state != PREPARING ) return;
		/*
		 * Wait untile the dragstart is decided.
		 */
		var r = prepared( event );
		if( typeof r == "undefined" ) {
			return;
		}
		/*
		 * When 'prepare' returns the result, proceed to dragging or
		 * discard.
		 */
		if( r ) {
			state = DRAGGING;
			start( event );
		}
		else {
			state = NONE;
		}
	});
                                                            // lib/drag.js:65
	/*
	 * Dragging the mouse in the 'dragging' state will do the actual
	 * moving.
	 */
	$window.on( "mousemove", function( event )
	{
		if( state != DRAGGING ) return;
		drag( event );
	});
                                                            // lib/drag.js:75
	/*
	 * Releasing the mouse outside the container will trigger the
	 * transition to 'none' state.
	 */
	$window.on( "mouseup", function( event )
	{
		if( state == NONE ) return;
		cancel( event );
		state = NONE;
	});
                                                            // lib/drag.js:86
	/*
	 * Releasing the mouse on one of the specified land targets will
	 * trigger the successful transition to 'none' state.
	 */
	$container.on( "mouseup", settings.landsSelector, function( event )
	{
		if( state != DRAGGING ) return;
		event.stopPropagation();
		finish( event );
		state = NONE;
	});
                                                            // lib/drag.js:98
	//--
                                                            // lib/drag.js:100
	var $dragElement = null;
	var startVec = [0, 0];
                                                            // lib/drag.js:103
	function init( event )
	{
		var $t = $( event.target );
		$dragElement = $t;
		startVec = [event.pageX, event.pageY];
	}
                                                            // lib/drag.js:110
	function prepared( event )
	{
		var x = event.pageX;
		var y = event.pageY;
		/*
		 * If the mouse has not moved far enough, wait.
		 */
		if( dist2( [x, y], startVec ) < 25 ) {
			return undefined;
		}
		/*
		 * If we have a dragStart listener and it says we
		 * shouldn't do dragging, abort the dragging.
		 */
		if( settings.onDragStart && !settings.onDragStart( $dragElement.get(0) ) ) {
			return false;
		}
                                                            // lib/drag.js:128
		return true;
	}
                                                            // lib/drag.js:131
	/*
	 * Returns square of the distance between points 'vec' and 'pos'.
	 */
	function dist2( vec, pos ) {
		var dx = vec[0] - pos[0];
		var dy = vec[1] - pos[1];
		return dx * dx + dy * dy;
	}
                                                            // lib/drag.js:140
	/*
	 * Let 'mousevec' be coordinates of the mouse relative to the
	 * entire document during dragging (these correspond to
	 * event.pageX and event.pageY).
     *
	 * Let 'parentvec' be coordinates of the draggable item's
	 * positioned ancestor. In the simplest case that is the HTML
	 * element with coordinates [0, 0], but generally it may be any
	 * other element.
	 *
	 * Let 'vec' be the offset assigned to the element that is being
	 * dragged. To perform the dragging we will maintain the equality:
     *
	 * 	parentvec + vec = mousevec.
	 */
                                                            // lib/drag.js:156
	var parentVec = [0, 0];
                                                            // lib/drag.js:158
	/*
	 * Start the dragging.
	 */
	function start( event )
	{
		var $parent = $dragElement.offsetParent();
		var pos = $parent.offset();
		parentVec = [pos.left, pos.top];
                                                            // lib/drag.js:167
		$dragElement.css( "position", "absolute" );
		$container.addClass( "dragging" );
		$dragElement.addClass( "dragged" );
	}
                                                            // lib/drag.js:172
	function drag( event )
	{
		var mouseVec = [event.pageX, event.pageY];
		/*
		 * Maintain that parentVec + vec = mouseVec.
		 */
		var vec = [
			mouseVec[0] - parentVec[0],
			mouseVec[1] - parentVec[1]
		];
                                                            // lib/drag.js:183
		/*
		 * If the item is under the pointer when the mouse is released,
		 * the 'mouseup' event is passed to the item and propagated to
		 * its original tree instead of the drop target.
		 *
		 * We could use hacks like document.elementsFromPoint or self-
		 * implemented variant, but it's safer to just keep the item
		 * away from the pointer.
		 */
		vec[0] += 5;
                                                            // lib/drag.js:194
		$dragElement.css({
			"left": vec[0] + "px",
			"top": vec[1] + "px"
		});
	}
                                                            // lib/drag.js:200
	function cancel( event )
	{
		$dragElement.css( "position", "static" );
		$dragElement.removeClass( "dragged" );
		$container.removeClass( "dragging" );
		if( settings.onDragCancel ) {
			settings.onDragCancel( $dragElement.get(0) );
		}
		$dragElement = null;
	}
                                                            // lib/drag.js:211
	function finish( event )
	{
		var $t = $( event.target );
		if( $t.get(0) == $dragElement.parent().get(0) ) {
			cancel( event );
			return;
		}
                                                            // lib/drag.js:219
		if( !$t.is( settings.landsSelector ) ) {
			$t = $t.parents( settings.landsSelector ).eq(0);
		}
                                                            // lib/drag.js:223
		var ok = true;
		if( settings.onDragEnd ) {
			ok = settings.onDragEnd( $dragElement.get(0), $t.get(0) );
		}
                                                            // lib/drag.js:228
		if( ok ) {
			$t.append( $dragElement );
		}
                                                            // lib/drag.js:232
		$dragElement.css( "position", "static" );
		$dragElement.removeClass( "dragged" );
		$container.removeClass( 'dragging' );
		$dragElement = null;
	}
}


// lib/fmt.js
var fmt = (function()
{
	function fmt( template, _args_ )
	{
		var out = '';
		var argpos = 1;
		var n = template.length;
                                                            // lib/fmt.js:8
		for( var i = 0; i < n; i++ )
		{
			var ch = template.charAt(i);
                                                            // lib/fmt.js:12
			/*
			 * Try to read a conversion specification.
			 */
			var m = getMarker( template, i );
			if( !m ) {
				out += ch;
				continue;
			}
                                                            // lib/fmt.js:21
			/*
			 * Try to format the argument.
			 */
			var s = expand( m, arguments[argpos] );
			if( s === null ) {
				out += ch;
				continue;
			}
			argpos++;
                                                            // lib/fmt.js:31
			out += s;
			i += m.length - 1;
		}
		return out;
	}
                                                            // lib/fmt.js:37
	function getMarker( template, pos )
	{
		var n = template.length;
		if( template.charAt( pos ) != '%' ) {
			return null;
		}
		var _pos = pos;
		pos++;
                                                            // lib/fmt.js:46
		var m = {
			flags: '',
			width: '',
			type: '',
			precision: '',
			length: 0
		};
                                                            // lib/fmt.js:54
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
                                                            // lib/fmt.js:66
		// Width
		while( pos < n && isDigit( template.charAt( pos ) ) ) {
			m.width += template.charAt( pos++ );
		}
                                                            // lib/fmt.js:71
		// Optional precision
		if( pos < n && template.charAt( pos ) == '.' )
		{
			pos++;
			while( pos < n && isDigit( template.charAt(pos) ) ) {
				precision += template.charAt(pos++);
			}
		}
                                                            // lib/fmt.js:80
		if( pos < n )
		{
			var ch = template.charAt( pos );
			if( ch == 's' || ch == 'd' ) {
				m.type = ch;
				pos++;
			}
		}
                                                            // lib/fmt.js:89
		if( !m.type ) {
			return null;
		}
		m.width = (m.width === '')? -1 : parseInt(m.width, 10);
		m.precision = (m.precision === '')? -1 : parseInt(m.precision, 10);
		m.length = pos - _pos;
		return m;
	}
                                                            // lib/fmt.js:98
	function expand( marker, arg )
	{
		if( marker.type == 's' )
		{
			if( marker.width >= 0 || marker.flags || marker.precision >= 0 ) {
				throw "Format %" + marker.type + " is not fully supported";
			}
			return arg;
		}
                                                            // lib/fmt.js:108
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
                                                            // lib/fmt.js:125
		return null;
	}
                                                            // lib/fmt.js:128
	function isDigit( ch ) {
		return ch.length == 1 && "0123456789".indexOf( ch ) >= 0;
	}
	return fmt;
})();
                                                            // lib/fmt.js:134
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


// lib/format.js
/*
 * Takes raw phone number string and formats it nicely.
 * The format is "+375 <code> <3d>-<2d>-<2d>".
 */
function formatPhone( str )
{
	if( !str ) return str;
	var original = str;
	if( str.indexOf( "+375" ) == 0 ) {
		str = str.substr( 4 );
	}
                                                            // lib/format.js:12
	str = str.replace( /[^\d]/g, '' );
                                                            // lib/format.js:14
	var parts = [
		str.substr( 0, 2 ),
		str.substr( 2, 3 ),
		str.substr( 5, 2 ),
		str.substr( 7 )
	];
                                                            // lib/format.js:21
	if( parts[3] == '' || parts[3].length > 2 ) return original;
                                                            // lib/format.js:23
	var s = '+375 ' + parts.shift();
	if( parts.length > 0 ) {
		s += ' ' + parts.join( '-' );
	}
                                                            // lib/format.js:28
	return s;
}
                                                            // lib/format.js:31
/*
 * Formats time as hour:minute. The argument is UTC seconds.
 */
function formatTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );
	return fmt( "%02d:%02d", d.getHours(), d.getMinutes() );
}
                                                            // lib/format.js:41
/*
 * Formats unixtime as "day.month.year hours:minutes".
 */
function formatDateTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );
                                                            // lib/format.js:49
	return fmt( "%02d.%02d.%d %02d:%02d",
		d.getDate(),
		d.getMonth() + 1,
		d.getFullYear(),
		d.getHours(),
		d.getMinutes()
	);
}


// lib/geo.js
var geo = ( function() {
                                                            // lib/geo.js:2
	/*
	 * Earth approximate radius in meters (WGS-84).
	 */
	var RADIUS = 6378137;
                                                            // lib/geo.js:7
	var geo = {};
                                                            // lib/geo.js:9
	/*
	 * Returns distance between two points.
	 * Uses Haversine formula.
	 */
	geo.distance = function( from, to )
	{
		var lat1 = from[0];
		var lon1 = from[1];
		var lat2 = to[0];
		var lon2 = to[1];
                                                            // lib/geo.js:20
		var d2r = Math.PI / 180;
		var dLat = (lat2 - lat1) * d2r;
		var dLon = (lon2 - lon1) * d2r;
                                                            // lib/geo.js:24
		lat1 *= d2r;
		lat2 *= d2r;
		var sin1 = Math.sin(dLat / 2);
		var sin2 = Math.sin(dLon / 2);
                                                            // lib/geo.js:29
		var a = sin1*sin1 + sin2*sin2*Math.cos(lat1)*Math.cos(lat2);
		var d = RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return d;
	};
                                                            // lib/geo.js:34
	return geo;
                                                            // lib/geo.js:36
})();


// lib/hotkeys.js
var hotkeys = (function()
{
	/*
	 * Hotkey spec => array of listeners.
	 */
	var listeners = {};
                                                            // lib/hotkeys.js:7
	$(window).on( 'keydown', dispatch );
                                                            // lib/hotkeys.js:9
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
                                                            // lib/hotkeys.js:35
	function getSpec( event )
	{
		var key = keyName( event.keyCode );
		if( !key ) {
			return null;
		}
                                                            // lib/hotkeys.js:42
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
                                                            // lib/hotkeys.js:53
	function keyName( code )
	{
		var specialKeys = {
			45: "ins",
			27: "esc"
		};
		if( code in specialKeys ) {
			return specialKeys[code];
		}
                                                            // lib/hotkeys.js:63
		var code_a = 65;
		var code_z = code_a + 25;
                                                            // lib/hotkeys.js:66
		if( code < code_a || code > code_z ) {
			return null;
		}
                                                            // lib/hotkeys.js:70
		return String.fromCharCode( 'z'.charCodeAt(0) - (code_z - code) );
	}
                                                            // lib/hotkeys.js:73
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
                                                            // lib/hotkeys.js:87
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
                                                            // lib/hotkeys.js:98
	return {
		bind: bind,
		unbind: unbind
	};
})();


// lib/html.js
var html = (function(){
                                                            // lib/html.js:2
	var html = {};
                                                            // lib/html.js:4
	html.escape = function( s ) {
		return s.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );
	};
                                                            // lib/html.js:10
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
                                                            // lib/html.js:22
	html.select = function( label, options, value, name )
	{
		var id = genId();
		var html = '<label for="'+id+'">'+label+'</label>';
		html += '<select';
		html += ' id="'+id+'"';
		if( name ) html += ' name="'+name+'"';
		if( value ) html += ' value="'+value+'"';
		html += '>';
                                                            // lib/html.js:32
		for( var value in options ) {
			var title = options[value];
			html += '<option value="'+value+'">' + title + '</option>';
		}
		html += '</select>';
		return html;
	};
                                                            // lib/html.js:40
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
                                                            // lib/html.js:53
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
                                                            // lib/html.js:65
	var ids = 0;
	function genId() {
		return "--id-" + (++ids);
	}
                                                            // lib/html.js:70
	return html;
})();


// lib/html5.js
/*
	Compilation date: 2015-12-07
	Number of files: 3
*/
(function() {
"use strict";
                                                            // lib/html5.js:7
// src/html5.js
window.html5 = {};
                                                            // lib/html5.js:10
var emulations = {};
                                                            // lib/html5.js:12
function addEmulation( type, func ) {
	emulations[type] = func;
}
                                                            // lib/html5.js:16
$(document).ready( init );
                                                            // lib/html5.js:18
function init()
{
	for( var type in emulations )
	{
		if( inputTypeSupported( type ) ) {
			continue;
		}
                                                            // lib/html5.js:26
		var $inputs = $( 'input[type="'+type+'"]' );
		$inputs.each( function()
		{
			var $t = $(this);
			if( $t.hasClass( 'dont-emulate' ) || $t.hasClass( 'emulated' ) ) {
				return;
			}
			emulations[type]( this );
			$( this ).addClass( 'emulated' );
		});
	}
}
                                                            // lib/html5.js:39
/*
 * Tells whether given input type is supported by the browser.
 */
function inputTypeSupported( type )
{
	var i = document.createElement( 'input' );
	i.setAttribute( 'type', type );
	return i.type == type;
}
                                                            // lib/html5.js:49
html5.fix = function( element )
{
	if( element.tagName.toLowerCase() != "input" ) {
		throw "Can't fix " + element.tagName;
	}
                                                            // lib/html5.js:55
	var type = element.getAttribute( "type" );
	if( !type ) {
		throw "The input doesn't have a type";
	}
                                                            // lib/html5.js:60
	/*
	 * If this input type is supported, return.
	 */
	if( element.type == type ) {
		return;
	}
                                                            // lib/html5.js:67
	var f = emulations[type];
	if( !f ) {
		throw "No fix for input type " + type;
	}
                                                            // lib/html5.js:72
	f( element );
	$( element ).addClass( 'emulated' );
};
                                                            // lib/html5.js:76
                                                            // lib/html5.js:77
// src/misc.js
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;
                                                            // lib/html5.js:83
/*
 * For some reason parts.map(parseInt) doesn't work,
 * but parts.map(intval) does.
 */
function intval( s ) {
	return parseInt( s, 10 );
}
                                                            // lib/html5.js:91
/*
 * Parses a string like "2000-01-01T00:00[:00]" and returns a Date
 * object.
 */
function parseDateTime( dt )
{
	var re = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)$/;
	var match = dt.match( re );
	if( !match ) {
		re = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d)$/;
		match = dt.match( re );
	}
                                                            // lib/html5.js:104
	if( !match ) return null;
                                                            // lib/html5.js:106
	var Y = match[1];
	var M = match[2] - 1; /* 0-based, surprise! */
	var D = match[3];
	var h = match[4];
	var m = match[5];
	var s = (match.length > 6)? match[6] : 0;
	var d = new Date( Y, M, D, h, m, s );
	return d;
}
                                                            // lib/html5.js:116
function composeDateTime( d )
{
	return d.getFullYear() + '-' + twoDigits( d.getMonth() + 1 )
		+ '-' + twoDigits( d.getDate() )
		+ 'T' + twoDigits( d.getHours() )
		+ ':' + twoDigits( d.getMinutes() )
		+ ':' + twoDigits( d.getSeconds() );
}
                                                            // lib/html5.js:125
/*
 * Adds leading zero to numbers less than 10.
 */
function twoDigits( number )
{
	if( typeof number == "string" ) {
		number = parseInt( number, 10 );
	}
	number = number.toString();
	if( number.length < 2 ) {
		number = "0" + number;
	}
	return number;
}
                                                            // lib/html5.js:140
function selectInputContents() {
	this.select();
}
                                                            // lib/html5.js:144
function onValueChange( input, f ) {
	$( input ).on( 'change', f );
}
                                                            // lib/html5.js:148
                                                            // lib/html5.js:149
// src/types/datetime-local.js
addEmulation( 'datetime-local', function( input )
{
	var $input = $( input );
	var em = new DateTimeLocal( $input.get(0) );
                                                            // lib/html5.js:155
	/*
	 * When original is changed, update the emulation.
	 */
	onValueChange( $input.get(0), function() {
		em.val( $input.val() );
	});
                                                            // lib/html5.js:162
	/*
	 * When emulation is changed, update the original.
	 */
	em.onChange( function() {
		$input.val( em.val() );
	});
});
                                                            // lib/html5.js:170
function DateTimeLocal( input )
{
	var $input = $( input );
	$input.hide();
                                                            // lib/html5.js:175
	var $c = $( '<div class="emulation-datetime-local"></div>' );
	var $date = $( '<input size="2" class="date">' );
	var $mon = $( '<input size="2" class="month">' );
	var $year = $( '<input size="4" class="year">' );
	var $hour = $( '<input size="2" class="hour">' );
	var $min = $( '<input size="2" class="minute">' );
	var $sec = $( '<input size="2" class="second">' );
                                                            // lib/html5.js:183
	$c.append( $date );
	$c.append( $mon );
	$c.append( $year );
	$c.append( $hour );
	$c.append( $min );
	$c.append( $sec );
	$c.insertAfter( $input );
                                                            // lib/html5.js:191
	$( '<span>&nbsp;</span>' ).insertAfter( $year );
	$( '<span>:</span>' ).insertAfter( $hour );
	$( '<span>:</span>' ).insertAfter( $min );
	$( '<span>.</span>' ).insertAfter( $date );
	$( '<span>.</span>' ).insertAfter( $mon );
                                                            // lib/html5.js:197
	set( $input.val() );
	if( typeof( get() ) == "undefined" ) {
		$input.val( composeDateTime( new Date() ) );
		set( $input.val() );
	}
                                                            // lib/html5.js:203
	var $all = $c.find( 'input' );
                                                            // lib/html5.js:205
	$all.on( 'keypress', function( event )
	{
		var k = event.keyCode;
		if( k != KEY_UP && k != KEY_DOWN ) return;
                                                            // lib/html5.js:210
		var n = parseInt( this.value );
                                                            // lib/html5.js:212
		if( k == KEY_DOWN ) n--;
		else n++;
                                                            // lib/html5.js:215
		this.value = twoDigits( n );
		$( this ).trigger( 'change' );
	});
                                                            // lib/html5.js:219
	$all.on( 'change', function() {
		set( get() );
	});
                                                            // lib/html5.js:223
	$all.on( 'focus', function() {
		this.select();
	});
                                                            // lib/html5.js:227
	this.root = function() {
		return $c.get(0);
	};
                                                            // lib/html5.js:231
	this.onChange = function( f ) {
		$all.on( 'change', f );
	};
                                                            // lib/html5.js:235
	this.val = function( newval )
	{
		if( typeof newval == "undefined" ) {
			return get();
		}
		set( newval );
	};
                                                            // lib/html5.js:243
	function set( str )
	{
		var date = parseDateTime( str );
		if( !date ) return;
                                                            // lib/html5.js:248
		$year.val( date.getFullYear() );
		$mon.val( twoDigits( date.getMonth() + 1 ) );
		$date.val( twoDigits( date.getDate() ) );
		$hour.val( twoDigits( date.getHours() ) );
		$min.val( twoDigits( date.getMinutes() ) );
		$sec.val( twoDigits( date.getSeconds() ) );
	}
                                                            // lib/html5.js:256
	function get()
	{
		var year = intval( $year.val() );
		var mon = intval( $mon.val() );
		var day = intval( $date.val() );
		var hour = intval( $hour.val() );
		var min = intval( $min.val() );
		var sec = intval( $sec.val() );
                                                            // lib/html5.js:265
		var d = new Date( year, mon - 1, day, hour, min, sec );
		if( isNaN( d.getTime() ) ) {
			return undefined;
		}
                                                            // lib/html5.js:270
		var str = composeDateTime( d );
		return str;
	}
}
                                                            // lib/html5.js:275
})();


// lib/layers.js
var Layers = (function() {
	var Layers = {};
                                                            // lib/layers.js:3
	var CLASS = 'w-layer';
	var $win = $( window );
                                                            // lib/layers.js:6
	var layers = [];
                                                            // lib/layers.js:8
	Layers.create = function( contentNode, coords )
	{
		var $l = $( '<div class="'+CLASS+'"></div>' );
		$l.css({
			"position": "absolute"
		});
		$(document.body).append( $l );
                                                            // lib/layers.js:16
		if( contentNode ) {
			$l.append( contentNode );
		}
                                                            // lib/layers.js:20
		/*
		 * Fix the layer's width to avoid reflowing at screen edges.
		 */
		var w = $l.width();
		if( w ) {
			$l.width( w );
		}
                                                            // lib/layers.js:28
		/*
		 * Position the layer. If no coords given, choose them by
		 * ourselves.
		 */
		if( !coords ) {
			coords = defaultCoords( $l );
		}
		$l.css({
			"left": coords[0] + "px",
			"top": coords[1] + "px"
		});
		/*
		 * Register the layer.
		 */
		layers.push( $l );
		$l._index = layers.length - 1;
		/*
		 * Move focus to the new layer.
		 */
		moveFocus( $l );
                                                            // lib/layers.js:49
		/*
		 * Return a handle for controlling from outside.
		 */
		return {
			remove: removeLayer.bind( undefined, $l ),
			focus: moveFocus.bind( undefined, $l ),
			blur: $l.removeClass.bind( $l, 'focus' ),
			hasFocus: $l.hasClass.bind( $l, 'focus' ),
			onBlur: $l.on.bind( $l, '-layer-blur' ),
			onFocus: $l.on.bind( $l, '-layer-focus' )
		};
	};
                                                            // lib/layers.js:62
	function defaultCoords( $l )
	{
		var w = $l.outerWidth();
		var h = $l.outerHeight();
		var x = $win.scrollLeft() + ($win.width() - w) / 2;
		var y = $win.scrollTop() + ($win.height() - h) / 2;
		/*
		 * Shift the layer if there are others.
		 */
		var delta = 20 * layers.length;
		x += delta;
		y += delta;
		return [x, y];
	}
                                                            // lib/layers.js:77
	function removeLayer( $l ) {
		$l.remove();
		var i = $l._index;
		layers.splice( i, 1 );
		/*
		 * Move focus to previous layer, if there is one.
		 */
		if( layers.length == 0 ) {
			return;
		}
		i--;
		if( i < 0 ) i = layers.length - 1;
		layers[i].addClass( 'focus' ).trigger( '-layer-focus' );
	}
                                                            // lib/layers.js:92
	/*
	 * When a layer is clicked, move the focus to it.
	 */
	$win.on( 'mousedown', function( event )
	{
		var $l = targetLayer( event );
		if( !$l ) return;
		moveFocus( $l );
	});
                                                            // lib/layers.js:102
	function moveFocus( $layer )
	{
		/*
		 * If this layer already has the focus, don't do anything.
		 */
		if( $layer.hasClass( 'focus' ) ) {
			return;
		}
		/*
		 * Find the layer with the focus.
		 */
		var $l = focusedLayer();
		if( $l ) {
			$l.removeClass( 'focus' ).trigger( '-layer-blur' );
		}
		$layer.addClass( 'focus' ).trigger( '-layer-focus' );
	}
                                                            // lib/layers.js:120
	/*
	 * Returns layer which is the subject of the given event.
	 */
	function targetLayer( event )
	{
		var $t = $(event.target);
		if( !$t.is( '.' + CLASS ) ) {
			$t = $t.parents( '.' + CLASS );
		}
		return $t.length ? $t : null;
	}
                                                            // lib/layers.js:132
	/*
	 * Returns layer which currently has focus.
	 */
	function focusedLayer()
	{
		var n = layers.length;
		while( n-- > 0 ) {
			var $l = layers[n];
			if( $l.hasClass( 'focus' ) ) {
				return $l;
			}
		}
		return null;
	}
                                                            // lib/layers.js:147
	/*
	 * Dragging.
	 */
	var $drag = null;
	var dragOffset = [0, 0];
                                                            // lib/layers.js:153
	$win.on( 'mousedown', function( event )
	{
		/*
		 * Ignore events on inputs and controls.
		 */
		if( $(event.target).is( 'button, input, select, textarea' ) ) {
			return;
		}
		var $t = targetLayer( event );
		if( !$t ) return;
                                                            // lib/layers.js:164
		event.preventDefault();
		var off = $t.offset();
                                                            // lib/layers.js:167
		dragOffset = [
			event.pageX - off.left,
			event.pageY - off.top
		];
		$drag = $t;
		$drag.addClass( "dragging" );
	});
                                                            // lib/layers.js:175
	$win.on( 'mousemove', function( event )
	{
		if( !$drag ) {
			return;
		}
		var x = event.pageX - dragOffset[0];
		var y = event.pageY - dragOffset[1];
		$drag.css({
			left: x,
			top: y
		});
	});
                                                            // lib/layers.js:188
	$win.on( 'mouseup', function() {
		if( !$drag ) return;
		$drag.removeClass( "dragging" );
		$drag = null;
	});
                                                            // lib/layers.js:194
	return Layers;
})();


// lib/listeners.js
function Listeners( events, statefulEvents )
{
	if( typeof statefulEvents == "undefined" ) {
		statefulEvents = [];
	}
                                                            // lib/listeners.js:6
	var listeners = {};
	var eventStates = {};
                                                            // lib/listeners.js:9
	for( var i = 0; i < events.length; i++ )
	{
		var k = events[i];
		if( k.charAt(0) == "*" ) {
			k = k.substr( 1 );
			statefulEvents.push( k );
			continue;
		}
		listeners[k] = [];
	}
                                                            // lib/listeners.js:20
	for( var i = 0; i < statefulEvents.length; i++ ) {
		var k = statefulEvents[i];
		listeners[k] = [];
		eventStates[k] = null;
	}
                                                            // lib/listeners.js:26
	function event( type, context, data )
	{
		var stopped = false;
                                                            // lib/listeners.js:30
		this.type = type;
		this.data = data;
                                                            // lib/listeners.js:33
		this.getContext = function() {
			return context;
		};
                                                            // lib/listeners.js:37
		this.stop = function() {
			stopped = true;
		};
                                                            // lib/listeners.js:41
		this.isStopped = function() {
			return stopped;
		};
	}
                                                            // lib/listeners.js:46
	/*
	 * Adds a listener of the given type. If 'first' is true, the
	 * function is added at the beginning of the list.
	 */
	this.add = function( type, func, first )
	{
		if( !(type in listeners) ) {
			throw "Unknown event type: " + type;
		}
		/*
		 * If this is a "stateful" event that has been already fired,
		 * and not cancelled, call the given listener.
		 */
		if( statefulEvents.indexOf( type ) >= 0 )
		{
			var e = eventStates[type];
			if( e && !e.isStopped() ) {
				func.call( e.getContext(), e );
			}
			// and add to the list anyway
		}
                                                            // lib/listeners.js:68
		if( first ) {
			listeners[type].unshift( func );
		} else {
			listeners[type].push( func );
		}
	};
                                                            // lib/listeners.js:75
	this.call = function( type, data, context )
	{
		if( !(type in listeners) ) {
			throw "Unknown event type: " + type;
		}
                                                            // lib/listeners.js:81
		if( typeof data == "undefined" ) {
			data = {};
		}
                                                            // lib/listeners.js:85
		var e = new event(type, context, data);
                                                            // lib/listeners.js:87
		if( statefulEvents.indexOf( type ) >= 0 ) {
			eventStates[type] = e;
		}
                                                            // lib/listeners.js:91
		var n = listeners[type].length;
		var r;
		for( var i = 0; i < n; i++ )
		{
			r = listeners[type][i].call( context, e );
			if( r === false ) return false;
			if( e.isStopped() ) {
				return r;
			}
		}
		return true;
	};
}


// lib/mapdata.js
/*
 * A set of calls for mapdata JSON.
 */
(function()
{
	var base = '/json/mapdata/';
                                                            // lib/mapdata.js:7
	var mapdata = {};
                                                            // lib/mapdata.js:9
	mapdata.setPrefix = function( p ) {
		base = p;
	};
                                                            // lib/mapdata.js:13
	/*
	 * Get address for the given point and call the callback with it.
	 */
	mapdata.getPointAddress = function( lat, lon, callback )
	{
		var url = base + "point_address/" + lat + "/" + lon + "/";
		http.get( url ).then( callback );
	};
                                                            // lib/mapdata.js:22
	/*
	 * Get bounds for the given address. The bounds is an object with
	 * min_lat, max_lat, min_lon, max_lon, lat and lon parameters.
	 */
	mapdata.getAddressBounds = function( address, callback )
	{
		var url = base + "address_bounds/";
		var params = [
			address.place,
			address.street,
			address.house,
			address.building
		];
		var i = 0;
		while( params[i] && params[i] != "" ) {
			url += encodeURIComponent( params[i] ) + "/";
			i++;
		}
		http.get( url ).then( function( bounds )
		{
			if( bounds )
			{
				var K = ["lat", "lon", "min_lat", "min_lon", "max_lat", "max_lon"];
				for( var i = 0; i < K.length; i++ ) {
					var k = K[i];
					bounds[k] = parseFloat( bounds[k] );
				}
			}
			callback( bounds );
		});
	};
                                                            // lib/mapdata.js:54
	/*
	 * Get list of place names having the given term in them.
	 */
	mapdata.getPlaceSuggestions = function( term, callback )
	{
		var url = base + "place_suggestions/"
			+ encodeURIComponent( term ) + "/";
		http.get( url ).then( function( data ) {
			extractList( callback, data );
		});
	};
                                                            // lib/mapdata.js:66
	/*
	 * Get list of street names in the given place having the given term
	 * in them.
	 */
	mapdata.getStreetSuggestions = function( term, place, callback )
	{
		var url = base + "street_suggestions/"
			+ encodeURIComponent( place ) + "/"
			+ encodeURIComponent( term ) + "/";
		http.get( url ).then( function( data ) {
			extractList( callback, data );
		});
	};
                                                            // lib/mapdata.js:80
	/*
	 * Get list of establishment names in the given place with the given
	 * term in them.
	 */
	mapdata.getEstablishmentSuggestions = function( term, place, callback )
	{
		var url = base + "establishment_suggestions/"
			+ encodeURIComponent( place ) + "/"
			+ encodeURIComponent( term ) + "/";
		http.get( url ).then( function( data ) {
			extractList( callback, data );
		});
	};
                                                            // lib/mapdata.js:94
	/*
	 * For clients expecting array output we need to extract the array
	 * (which is under the "list" property) before passing it along.
	 * This concerns all suggestion queries.
	 */
	function extractList( callback, data )
	{
		var list;
		if( !data || data.error != 0 || !data.list ) {
			list = [];
		}
		else {
			list = data.list;
		}
		callback( list );
	}
                                                            // lib/mapdata.js:111
	window.mapdata = mapdata;
})();


// lib/natcmp.js
/*
 * Comparison function for natural sort.
 */
function natcmp( a, b )
{
	var ok1 = a && typeof( a.match ) != "undefined";
	var ok2 = b && typeof( b.match ) != "undefined";
                                                            // lib/natcmp.js:8
	if( !ok1 && !ok2 ) return 0;
	if( !ok1 ) return -1;
	if( !ok2 ) return 1;
                                                            // lib/natcmp.js:12
	var p = /^(\d*)(.*?)$/;
	var ns1 = a.match( p );
	var ns2 = b.match( p );
                                                            // lib/natcmp.js:16
	var isNum1 = ns1[1] != "";
	var isNum2 = ns2[1] != "";
                                                            // lib/natcmp.js:19
	if( isNum1 && isNum2 ) {
		return parseInt( ns1[1] ) - parseInt( ns2[1] );
	}
                                                            // lib/natcmp.js:23
	if( isNum1 ) return -1;
	if( isNum2 ) return 1;
                                                            // lib/natcmp.js:26
	return ns1[2] > ns2[2];
}
                                                            // lib/natcmp.js:29
function colsort( list, key ) {
	return list.sort( function( a, b ) {
		return a[key] - b[key];
	});
}
                                                            // lib/natcmp.js:35
function natcolsort( list, key ) {
	return list.sort( function( a, b ) {
		return natcmp( a[key], b[key] );
	});
}


// lib/obj.js
/*
 * Some operations on objects.
 */
var obj = (function()
{
	var obj = {};
                                                            // lib/obj.js:7
	obj.merge = function( _args_ )
	{
		var o = {};
		for( var i = 0; i < arguments.length; i++ )
		{
			var add = arguments[i];
			for( var k in add ) {
				o[k] = add[k];
			}
		}
		return o;
	};
                                                            // lib/obj.js:20
	obj.subset = function( o, fields )
	{
		var s = {};
		var n = fields.length;
		var k;
		for( var i = 0; i < n; i++ ) {
			k = fields[i];
			s[k] = o[k];
		}
		return s;
	};
                                                            // lib/obj.js:32
	obj.copy = function( o ) {
		return JSON.parse( JSON.stringify( o ) );
	};
                                                            // lib/obj.js:36
	obj.toArray = function( o ) {
		var a = [];
		for( var k in o ) {
			a.push( o[k] );
		}
		return a;
	};
                                                            // lib/obj.js:44
	obj.keys = function( o ) {
		var keys = [];
		for( var k in o ) keys.push( k );
		return keys;
	};
                                                            // lib/obj.js:50
	/*
	 * Returns a map of array indexed by values of
	 * their keyname field.
	 */
	obj.index = function( array, keyname )
	{
		var index = {};
		var n = array.length;
		for( var i = 0; i < n; i++ )
		{
			var item = array[i];
			var key = item[keyname];
			if( !key ) continue;
			index[key] = item;
		}
		return index;
	};
                                                            // lib/obj.js:68
	/*
	 * Returns first element matching to the filter, from the array.
	 */
	obj.find = function( array, filter )
	{
		var r = [];
		var n = array.length;
		for( var i = 0; i < n; i++ ) {
			if( this.match( array[i], filter ) ) {
				r.push( array[i] );
			}
		}
		return r;
	};
                                                            // lib/obj.js:83
	/*
	 * Returns first element matching to the filter, from the array.
	 */
	obj.findOne = function( array, filter )
	{
		var n = array.length;
		for( var i = 0; i < n; i++ ) {
			if( this.match( array[i], filter ) ) {
				return array[i];
			}
		}
		return null;
	};
                                                            // lib/obj.js:97
	/*
	 * Returns true if filter is a matching subset of item.
	 */
	obj.match = function( item, filter )
	{
		for( var k in filter )
		{
			if( !(k in item) || (item[k] != filter[k]) ) {
				return false;
			}
		}
		return true;
	};
                                                            // lib/obj.js:111
	obj.column = function( items, key )
	{
		var list = [];
		for( var i = 0; i < items.length; i++ ) {
			var item = items[i];
			list.push( item[key] );
		}
		return list;
	};
                                                            // lib/obj.js:121
	/*
	 * Returns true if the given object is empty.
	 */
	obj.isEmpty = function( item )
	{
		for( var k in item ) return false;
		return true;
	};
                                                            // lib/obj.js:130
	obj.unique = function( array )
	{
		var set = {};
		var vals = [];
                                                            // lib/obj.js:135
		for( var i = 0; i < items.length; i++ ) {
			var i = array[i];
			if( i in set ) continue;
			set[i] = true;
			vals.push( i );
		}
                                                            // lib/obj.js:142
		return vals;
	};
                                                            // lib/obj.js:145
	return obj;
})();


// lib/roman.js
function romanNumeral( n )
{
	if( n == 0 || n >= 5000 ) {
		return n;
	}
                                                            // lib/roman.js:6
	var positions = ["IVX", "XLC", "CDM", "M??"];
	var parts = [];
	for( var i = 0; i < positions.length; i++ )
	{
		parts.unshift( pos( n % 10, positions[i] ) );
		n = Math.floor( n / 10 );
		if( !n ) break;
	}
                                                            // lib/roman.js:15
	function pos( num, digits )
	{
		if( !num ) return '';
		var one = digits.charAt(0),
			five = digits.charAt(1),
			ten = digits.charAt(2);
                                                            // lib/roman.js:22
		if( num < 4 ) {
			return one.repeat( num );
		}
		if( num == 4 ) {
			return one + five;
		}
		if( num < 9 ) {
			return five + one.repeat( num - 5 );
		}
		if( num == 9 ) return one + ten;
		return "?";
	}
                                                            // lib/roman.js:35
	return parts.join('');
}


// lib/sound.js
window.sound = (function()
{
	var s = new Audio();
	s.preload = 'auto';
	s.src = '/content/phone.ogg';
                                                            // lib/sound.js:6
	var sound = {};
                                                            // lib/sound.js:8
	sound.play = function() {
		s.play();
	};
                                                            // lib/sound.js:12
	sound.stop = function() {
		s.pause();
		s.currentTime = 0;
	};
                                                            // lib/sound.js:17
	sound.vol = function( newVol ) {
		if( typeof newVol == "undefined" ) {
			return s.volume;
		}
		s.volume = newVol;
	};
                                                            // lib/sound.js:24
	return sound;
})();


// lib/toast.js
function toast( text )
{
	var $t = $( '<div class="w-toast">' + text + '</div>' );
	$t.css({
		"position": "fixed",
		"bottom": "10%"
	});
	$t.hide();
	$t.appendTo( "body" );
	$t.fadeIn( "fast" );
                                                            // lib/toast.js:11
	var w = ($( window ).width() - $t.outerWidth())/2;
	$t.css( "left", w + "px" );
                                                            // lib/toast.js:14
	setTimeout( function() {
		$t.fadeOut();
	}, 2000 );
                                                            // lib/toast.js:18
	setTimeout( function() {
		$t.remove();
	}, 3000 );
}


// src/dialogs/cancel-dialog.js
/*
 * Dialog for order cancelling.
 */
function showCancelDialog( order )
{
	var html = '<p>Отменить заказ?</p>'
		+ '<textarea placeholder="Причина отмены"></textarea>';
	if( order.taxi_id ) {
		html += '<div><label><input type="checkbox"> Восстановить в очереди</label></div>';
	}
	var $content = $( '<div>' + html + '</div>' );
	var $reason = $content.find( 'textarea' );
	var $restore = $content.find( 'input[type="checkbox"]' );
                                                            // src/dialogs/cancel-dialog.js:14
	var d = new Dialog( $content.get(0) );
	d.addButton( 'Отменить заказ', cancel, 'yes' );
	d.addButton( 'Закрыть окно', null, 'no' );
	d.show();
                                                            // src/dialogs/cancel-dialog.js:19
	function cancel()
	{
		var reason = $reason.val();
		var restore = $restore.is( ':checked' );
                                                            // src/dialogs/cancel-dialog.js:24
		var p = disp.cancelOrder( order.order_uid, reason );
		if( restore && order.taxi_id ) {
			p.then( function() {
				disp.restoreDriverQueue( order.taxi_id )
			});
		}
		this.close();
	}
}


// src/dialogs/order-form.js
var orderForms = (function() {
                                                            // src/dialogs/order-form.js:2
	var currentForms = [];
                                                            // src/dialogs/order-form.js:4
	/*
	 * Order form display function and related events.
	 */
	function show( order )
	{
		/*
		 * If form for this order is already shown, focus on it.
		 */
		var form = findOrderForm( order );
		if( form ) {
			form.layer.focus();
			return;
		}
                                                            // src/dialogs/order-form.js:18
		/*
		 * Create the form and put it on a draggable layer.
		 */
		var form = new OrderForm( order );
		if( order && !order.canEdit() ) {
			form.lock();
		}
		var layer = Layers.create( form.root() );
		form.layer = layer;
		currentForms.push( form );
                                                            // src/dialogs/order-form.js:29
		function closeForm()
		{
			var index = -1;
			for( var i = 0; i < currentForms.length; i++ ) {
				if( currentForms[i] == form ) {
					index = i;
					break;
				}
			}
			delete form.layer;
			layer.remove();
			currentForms.splice( index, 1 );
		}
                                                            // src/dialogs/order-form.js:43
		/*
		 * When the form's "cancel" button is clicked, remove the layer.
		 */
		form.on( "cancel", function() {
			closeForm();
		});
                                                            // src/dialogs/order-form.js:50
		/*
		 * When the form is submitted, save the order.
		 */
		form.on( "submit", function( event )
		{
			order = event.data.order;
			var driverId = event.data.driverId;
			var driver = disp.getDriver( driverId );
                                                            // src/dialogs/order-form.js:59
			if( driver && !driver.online() ) {
				(new Dialog( "Выбранный водитель сейчас не на связи" )).show();
				return;
			}
                                                            // src/dialogs/order-form.js:64
			if( driver && disp.sessionRequired( driverId ) ) {
				(new Dialog( "Выбранный водитель не вышел на смену" )).show();
				return;
			}
                                                            // src/dialogs/order-form.js:69
			form.lock( "Отправка заказа" );
			var p;
			if( order.postponed() ) {
				p = disp.saveOrder( order )
				.then( function() {
					toast( "Заказ сохранён" );
				});
			}
			else {
				p = disp.saveOrder( order )
				.then( function( val ) {
					if( driver ) {
						form.lock( "Ждём ответа от водителя" );
					} else {
						form.lock( "Идёт поиск водителя" );
					}
					return disp.sendOrder( order, driverId );
				})
				.then( function( assignedDriver ) {
					var car = disp.getDriverCar( assignedDriver.id );
					var text = orderDesc( order, assignedDriver, car );
					(new Dialog( text )).show();
				});
			}
                                                            // src/dialogs/order-form.js:94
			/*
			 * On success close the form.
			 */
			p.then( function() {
				closeForm();
			});
			/*
			 * On error show error message and leave the form open and
			 * unlocked.
			 */
			p.catch( function( error )
			{
				var msg;
				switch( error )
				{
					case 'dropped':
						if( driver ) {
							msg = "Водитель не принял заказ";
						} else {
							msg = "Никто не взял заказ";
						}
						break;
					default:
						msg = "Не удалось отправить заказ: " + error;
				}
                                                            // src/dialogs/order-form.js:120
				var d = new Dialog( msg );
				d.addButton( "OK", function() {
					d.close();
					form.unlock();
					layer.focus();
				}, "yes" );
				d.show();
			});
		});
                                                            // src/dialogs/order-form.js:130
		return form;
	}
                                                            // src/dialogs/order-form.js:133
	/*
	 * Returns a string describing an assigned order.
	 */
	function orderDesc( order, driver, car )
	{
		var info = [];
                                                            // src/dialogs/order-form.js:140
		var loc = disp.getLocation( order.src_loc_id );
		if( loc ) {
			info.push( '&laquo;' + loc.name + '&raquo;' );
		}
		info.push( order.formatAddress() );
		info.push( 'Водитель &mdash; ' + driver.call_id );
		info.push( car.format() );
                                                            // src/dialogs/order-form.js:148
		var waitTime = order.exp_arrival_time - time.utc();
		if( waitTime > 0 )
		{
			waitTime = Math.ceil( waitTime / 60 );
			if( waitTime > 1 ) {
				waitTime = waitTime + ' мин.';
			} else {
				waitTime = 'минуту';
			}
			info.push( 'Прибудет через ' + waitTime );
		}
		return info.join( '<br>' );
	}
                                                            // src/dialogs/order-form.js:162
	function getFocusForm()
	{
		return currentForms.find( function( f ) {
			return f.layer.hasFocus();
		});
	}
                                                            // src/dialogs/order-form.js:169
	function formIndex( order )
	{
		if( !order ) return -1;
		for( var i = 0; i < currentForms.length; i++ ) {
			if( currentForms[i].orderId() == order.order_uid ) {
				return i;
			}
		}
		return -1;
	}
                                                            // src/dialogs/order-form.js:180
	function findOrderForm( order )
	{
		var i = formIndex( order );
		return (i == -1)? null : currentForms[i];
	}
                                                            // src/dialogs/order-form.js:186
	return {
		show: show,
		getFocusForm: getFocusForm,
		findOrderForm: findOrderForm
	};
})();


// src/main.js
/*
 * Top-level view of the whole program.
 */
                                                            // src/main.js:4
window.disp = new DispatcherClient();
                                                            // src/main.js:6
disp.on( 'ready', function()
{
	$(document).ready( function() {
		main();
	});
});
                                                            // src/main.js:13
function main() {
	createOrderButton( document.getElementById( 'button-container' ) );
	createQueuesWidget( document.getElementById( 'queues-container' ) );
	createOrdersWidget( document.getElementById( 'orders-container' ) );
}
                                                            // src/main.js:19
//--
                                                            // src/main.js:21
function createOrderButton( container ) {
	/*
	 * Draw the button.
	 */
	var $b = $( '<button id="order-button">Заказ (insert)</button>' );
	$b.appendTo( container );
	/*
	 * When the button is clicked, show new order form.
	 */
	$b.on( 'click', function() {
		$b.addClass( 'active' );
		orderForms.show();
		setTimeout( function() {
			$b.removeClass( 'active' );
		}, 100 );
	});
                                                            // src/main.js:38
	hotkeys.bind( "ins", function() {
		$b.click();
	});
}
                                                            // src/main.js:43
function createQueuesWidget( container )
{
	var qw = new QueuesWidget( disp, {
		disableDragging: true,
		disableFakeQueues: true
	});
	container.appendChild( qw.root() );
}
                                                            // src/main.js:52
/*
 * Widget with list of current orders.
 */
function createOrdersWidget( container )
{
	/*
	 * Create orders widget and fill it with current orders.
	 */
	var ow = new OrdersWidget( disp, {hideAddresses: true} );
	container.appendChild( ow.root() );
                                                            // src/main.js:63
	ow.on( 'order-click', function( e ) {
		var order = e.data.order;
		orderForms.show( order );
	});
                                                            // src/main.js:68
	ow.on( 'cancel-click', function( e ) {
		var order = e.data.order;
		showCancelDialog( order );
	});
}


// src/widgets/order-form/address.js
function AddressGroupSection( $container, type )
{
	/*
	 * Subforms for three address types.
	 */
	var fromQueue = new QueueSection( disp, $container );
	var fromObject = new ObjectSection( disp, $container );
	var from = new AddressSection( disp, $container, type );
                                                            // src/widgets/order-form/address.js:9
	from.onChange( function( addr ) {
		fromQueue.set( null );
		fromObject.set( null );
	});
                                                            // src/widgets/order-form/address.js:14
	fromQueue.onChange( function( loc ) {
		fromObject.set( null );
		from.set( loc ? loc.addr : null );
	});
                                                            // src/widgets/order-form/address.js:19
	fromObject.onChange( function( loc ) {
		from.set( loc ? loc.addr : null );
		fromQueue.set( null );
	});
                                                            // src/widgets/order-form/address.js:24
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
                                                            // src/widgets/order-form/address.js:35
	this.set = function( spec )
	{
		from.set( spec.addr );
		fromQueue.set( spec.loc_id );
	};
                                                            // src/widgets/order-form/address.js:41
	this.setQueue = function( qid )
	{
		fromQueue.set( qid );
		var loc = fromQueue.get();
		if( loc ) {
			fromObject.set( loc );
			from.set( loc.addr );
		}
	};
}
                                                            // src/widgets/order-form/address.js:52
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
                                                            // src/widgets/order-form/address.js:64
	var $s = $( s );
	$container.append( $c );
	$c.append( $s );
                                                            // src/widgets/order-form/address.js:68
	var $city = $s.find( '.city' );
	var $street = $s.find( '.street' );
	var $house = $s.find( '.house' );
	var $building = $s.find( '.building' );
	var $entrance = $s.find( '.entrance' );
	var $apartment = $s.find( '.apartment' );
                                                            // src/widgets/order-form/address.js:75
	$city.val( disp.param( "default_city" ) );
	$city.autocomplete( mapdata.getPlaceSuggestions );
	$street.autocomplete( function( term, callback ) {
		mapdata.getStreetSuggestions( term, $city.val(), callback );
	});
                                                            // src/widgets/order-form/address.js:81
	var $all = $s.find( 'input' );
	var callback = null;
                                                            // src/widgets/order-form/address.js:84
	$all.on( "change", function() {
		if( !callback ) return;
		callback( getAddr() );
	});
                                                            // src/widgets/order-form/address.js:89
	this.get = getAddr;
                                                            // src/widgets/order-form/address.js:91
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
                                                            // src/widgets/order-form/address.js:103
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
                                                            // src/widgets/order-form/address.js:123
	this.onChange = function( f ) {
		callback = f;
	};
}
                                                            // src/widgets/order-form/address.js:128
function QueueSection( disp, $container )
{
	var $c = $( '<div><label>Объект (к)</label></div>' );
                                                            // src/widgets/order-form/address.js:132
	var s = '<select class="queue-loc"><option value=""></option>';
	disp.queues().forEach( function( q ) {
		if( !q.loc_id ) return;
		s += '<option value="'+q.id+'">'+q.name+'</option>';
	});
	s += '</select>';
	var $s = $(s);
                                                            // src/widgets/order-form/address.js:140
	$container.append( $c );
	$c.append( $s );
                                                            // src/widgets/order-form/address.js:143
	var callback = null;
                                                            // src/widgets/order-form/address.js:145
	$s.on( "change", function() {
		var loc = disp.getQueueLocation( this.value );
		callback( loc );
	});
                                                            // src/widgets/order-form/address.js:150
	this.onChange = function( f ) {
		callback = f;
	};
                                                            // src/widgets/order-form/address.js:154
	this.get = function() {
		return disp.getQueueLocation( $s.val() );
	};
                                                            // src/widgets/order-form/address.js:158
	this.set = function( id ) {
		$s.val( id );
	};
}
                                                            // src/widgets/order-form/address.js:163
function ObjectSection( disp, $container )
{
	var $c = $( '<div><label>Объект</label></div>' );
	var $s = $( '<input class="loc">' );
                                                            // src/widgets/order-form/address.js:168
	$container.append( $c );
	$c.append( $s );
                                                            // src/widgets/order-form/address.js:171
	var callback = null;
	var location = null;
                                                            // src/widgets/order-form/address.js:174
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
                                                            // src/widgets/order-form/address.js:195
	this.onChange = function( f ) {
		callback = f;
	};
                                                            // src/widgets/order-form/address.js:199
	this.get = function() {
		return location;
	};
                                                            // src/widgets/order-form/address.js:203
	this.set = function( loc ) {
		location = loc;
		$s.val( loc ? loc.name : "" );
	};
}


// src/widgets/order-form/customer.js
function CustomerSection( $container )
{
	var ids = Date.now();
	var s = '<div><label for="id1">Телефон клиента</label>'
		+ '<input type="tel" id="id1"></div>'
		+ '<div><label for="id2">Имя клиента</label><input id="id2"><button class="history" type="button" title="Адреса">Адреса</button>';
	s = s.replace( 'id1', '--id-cust-' + (++ids) );
	s = s.replace( 'id2', '--id-cust-' + (++ids) );
	var $s = $( s );
	$container.append( $s );
                                                            // src/widgets/order-form/customer.js:11
	var $phone = $s.find( "input" ).eq(0);
	var $name = $s.find( "input" ).eq(1);
	var $button = $s.find( "button" ).eq(0);
	$button.prop( "disabled", true );
                                                            // src/widgets/order-form/customer.js:16
	this.get = function() {
		return {
			customer_phone: getPhone(),
			customer_name: $name.val()
		};
	};
                                                            // src/widgets/order-form/customer.js:23
	var addresses = [];
	var onAddress = null;
                                                            // src/widgets/order-form/customer.js:26
	this.onAddress = function( func ) {
		onAddress = func;
	};
                                                            // src/widgets/order-form/customer.js:30
	$button.on( "click", function() {
		var s = '<div class="menu">';
		addresses.forEach( function( addr, i ) {
			s += '<div data-id="'+i+'">'+addr.format()+'</div>';
		});
		s += '</div>';
                                                            // src/widgets/order-form/customer.js:37
		var $c = $( s );
		var d = new Dialog( $c.get(0) );
		d.setTitle( "Адреса клиента" );
		d.addButton( "Закрыть", null, "no" );
		d.show();
                                                            // src/widgets/order-form/customer.js:43
		$c.on( "click", "div", function() {
			var i = $(this).data( "id" );
			if( typeof i == "undefined" ) return;
			if( onAddress ) onAddress( addresses[i] );
			d.close();
		});
	});
                                                            // src/widgets/order-form/customer.js:51
	$phone.on( "change", function() {
		var phone = getPhone();
		$name.addClass( "wait" );
		$button.prop( "disabled", true );
		disp.findCustomer( phone ).then( function( customer ) {
			$name.val( customer.name );
			$name.removeClass( "wait" );
			addresses = customer.addresses;
			if( addresses.length > 0 ) {
				$button.prop( "disabled", false );
			}
		})
		.catch( function() {
			// No such customer
			$name.removeClass( "wait" );
		});
	});
                                                            // src/widgets/order-form/customer.js:69
	function getPhone()
	{
		var n = $phone.val().replace( /[\s]/g, '' );
		/*
		 * If there is not enough digits even for bare number, return
		 * whatever is there.
		 */
		if( n.length < 7 ) return n;
		/*
		 * If it's a bare number, add default area code.
		 * Also add country code if it's not there.
		 */
		if( n.length == 7 ) {
			n = "29" + n;
		}
		if( n.length == 9 ) {
			n = "+375" + n;
		}
		return n;
	}
                                                            // src/widgets/order-form/customer.js:90
	this.set = function( order )
	{
		var phone = order.customer_phone;
		var name = order.customer_name;
		if( phone ) {
			$phone.val( formatPhone( phone ) );
		}
		$name.val( name );
	};
}


// src/widgets/order-form/drivers.js
function DriverSection( $container )
{
	var s = '<select class="driver" disabled><option value="0">Выбрать автоматически</option>';
	disp.drivers().forEach( function( d ) {
		s += tpl( '<option value="?">? - ?</option>',
			d.id, d.call_id, d.surname() );
	});
	s += '</select>';
	var $select = $( s );
                                                            // src/widgets/order-form/drivers.js:10
	$container.append( '<label>Водитель</label>' );
	$container.append( $select );
                                                            // src/widgets/order-form/drivers.js:13
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
                                                            // src/widgets/order-form/drivers.js:26
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
                                                            // src/widgets/order-form/drivers.js:40
	$class = $class.filter( "select" );
                                                            // src/widgets/order-form/drivers.js:42
	this.get = function() {
		return {
			opt_car_class: $class.val(),
			opt_vip: $vip.is( ':checked' )? '1' : '0',
			opt_terminal: $term.is( ':checked' )? '1' : '0'
		};
	};
                                                            // src/widgets/order-form/drivers.js:50
	this.set = function( order ) {
		$class.val( order.opt_car_class );
		$vip.prop( 'checked', order.opt_vip == '1' );
		$term.prop( 'checked', order.opt_terminal == '1' );
	};
                                                            // src/widgets/order-form/drivers.js:56
	this.disable = function() {
		$class.val( "" );
		$vip.add( $term ).prop( "checked", false );
		$s.find( 'input, select' ).prop( "disabled", true );
		$s.slideUp( "fast" );
	};
                                                            // src/widgets/order-form/drivers.js:63
	this.enable = function() {
		$s.find( 'input, select' ).prop( "disabled", false );
		$s.slideDown( "fast" );
	};
}


// src/widgets/order-form/order-form.js
var OrderForm = ( function() {
                                                            // src/widgets/order-form/order-form.js:2
function OrderForm( order )
{
	var listeners = new Listeners([
		"cancel",
		"submit"
	]);
	this.on = listeners.add.bind( listeners );
                                                            // src/widgets/order-form/order-form.js:10
	var $container = $( '<form class="order-form"></form>' );
	/*
	 * Form title, for order number.
	 */
	var $title = $( '<div></div>' );
	$container.append( $title );
                                                            // src/widgets/order-form/order-form.js:17
	var driver = new DriverSection( div() );
	var options = new OptionsSection( div() );
	var customer = new CustomerSection( div() );
	//$container.append( '<b>Место подачи</b>' );
	//var from = new AddressGroupSection( $container );
	$container.append( '<b>Место назначения</b>' );
	var to = new AddressGroupSection( div( 'dest-section' ), 'dest' );
	var postpone = new PostponeSection( div() );
                                                            // src/widgets/order-form/order-form.js:26
	/*
	 * When a driver is specified, turn the options off.
	 */
	driver.onChange( syncOptions );
                                                            // src/widgets/order-form/order-form.js:31
	//customer.onAddress( function( addr ) {
	//	from.set({addr: addr, loc_id: null});
	//});
                                                            // src/widgets/order-form/order-form.js:35
	this.setDriver = function( id ) {
		driver.set( id );
		syncOptions();
	};
                                                            // src/widgets/order-form/order-form.js:40
	function syncOptions() {
		if( driver.get() != '0' ) {
			options.disable();
		} else {
			options.enable();
		}
	}
                                                            // src/widgets/order-form/order-form.js:48
	/*
	 * Comments input.
	 */
	var $comments = $( html.textarea( "Комментарии" ) );
	div().append( $comments );
	$comments = $comments.filter( 'textarea' );
	/*
	 * Status string, for progress reports.
	 */
	var $status = $( '<div class="status"></div>' );
	$container.append( $status );
	/*
	 * Buttons.
	 */
	addButtons();
                                                            // src/widgets/order-form/order-form.js:64
	var $controls = $container.find( "input, select, button:not(.cancel), textarea" );
                                                            // src/widgets/order-form/order-form.js:66
	function div( className ) {
		var $d = $( '<div></div>' );
		if( className ) $d.addClass( className );
		$container.append( $d );
		return $d;
	}
                                                            // src/widgets/order-form/order-form.js:73
	if( order ) {
		$title.html( "Заказ № " + order.order_id );
		options.set( order );
		customer.set( order );
		$comments.val( order.comments );
		postpone.set( order );
		//from.set( order.src );
		to.set( order.dest );
	}
	else {
		$title.html( "Новый заказ" );
	}
                                                            // src/widgets/order-form/order-form.js:86
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/widgets/order-form/order-form.js:90
	this.lock = function( status ) {
		$status.html( status );
		$controls.prop( "disabled", true );
	};
                                                            // src/widgets/order-form/order-form.js:95
	this.unlock = function() {
		$status.html( "" );
		$controls.prop( "disabled", false );
	};
                                                            // src/widgets/order-form/order-form.js:100
	this.locked = function() {
		return $controls.prop( "disabled" );
	};
                                                            // src/widgets/order-form/order-form.js:104
	this.orderId = function() {
		if( !order ) return null;
		return order.order_uid;
	};
                                                            // src/widgets/order-form/order-form.js:109
	this.setQueue = function( qid ) {
		// from.setQueue( qid );
	};
                                                            // src/widgets/order-form/order-form.js:113
	function addButtons()
	{
		var $ok = $( '<button type="button">Отправить</button>' );
		var $no = $( '<button type="button" class="cancel">Закрыть</button>' );
		$container.append( $ok ).append( $no );
		$ok.on( 'click', function() {
			listeners.call( "submit", {
				order: getOrder(),
				driverId: driver.get()
			});
		});
		$no.on( "click", function() {
			listeners.call( "cancel" );
		});
	}
                                                            // src/widgets/order-form/order-form.js:129
	function getOrder()
	{
		var data = obj.merge(
			options.get(),
			customer.get(),
			postpone.get()
		);
		data.comments = $comments.val();
		data.status = Order.prototype.POSTPONED;
		data.src = {
			addr: new Address({place: "", street: "", house: "", building: "", entrance: ""}),
			loc_id: null
		};
		data.dest = to.get();
                                                            // src/widgets/order-form/order-form.js:144
		if( order ) {
			for( var k in data ) {
				order[k] = data[k];
			}
		} else {
			order = new Order( data );
		}
                                                            // src/widgets/order-form/order-form.js:152
		return order;
	}
}
                                                            // src/widgets/order-form/order-form.js:156
return OrderForm;
})();


// src/widgets/order-form/postpone.js
function PostponeSection( $container )
{
	var $top = $( html.checkbox( "Отложить заказ" ) );
	var $sub = $( '<div></div>' );
	$sub.html( html.input( "Время подачи машины", "datetime-local" )
		+ '<label>Напоминание</label><input type="number" min="0" step="5" value="5" size="2"> мин. до подачи' );
	$container.append( $top );
	$container.append( $sub );
                                                            // src/widgets/order-form/postpone.js:9
	var $checkbox = $top.filter( "input" ).eq(0);
	var $time = $sub.find( "input" ).eq(0);
	var $remind = $sub.find( "input" ).eq(1);
                                                            // src/widgets/order-form/postpone.js:13
	html5.fix( $time.get(0) );
                                                            // src/widgets/order-form/postpone.js:15
	/*
	 * Because these elements are not inserted into the document yet,
	 * jQuery's 'slideUp' won't work, so we additionally call 'hide'
	 * at the beginning if necessary.
	 */
	if( !$checkbox.get(0).checked ) {
		$sub.hide();
	}
                                                            // src/widgets/order-form/postpone.js:24
	$checkbox.on( 'change', sync );
	sync();
	function sync()
	{
		/*
		 * When checked, enable inputs and set default time.
		 */
		if( $checkbox.get(0).checked )
		{
			enable();
			setTime( time.utc() );
			$remind.val( 0 );
			$sub.slideDown( "fast" );
		}
		/*
		 * When unchecked, disable the inputs.
		 */
		else {
			disable();
			$sub.slideUp( "fast" );
		}
	}
                                                            // src/widgets/order-form/postpone.js:47
	this.get = function()
	{
		var data = {};
		if( $checkbox.is( ':checked' ) ) {
			var t = getTime();
			data.exp_arrival_time = t;
			data.reminder_time = t - $remind.val() * 60;
		}
		else {
			data.exp_arrival_time = null;
			data.reminder_time = null;
		}
		return data;
	};
                                                            // src/widgets/order-form/postpone.js:62
	this.set = function( order )
	{
		if( order.exp_arrival_time )
		{
			$checkbox.prop( 'checked', true );
			$sub.show();
                                                            // src/widgets/order-form/postpone.js:69
			setTime( order.exp_arrival_time );
                                                            // src/widgets/order-form/postpone.js:71
			var min = Math.round((order.exp_arrival_time - order.reminder_time)/60);
			$remind.val( min )
			enable();
		}
		else {
			$checkbox.prop( 'checked', false );
			disable();
		}
	};
                                                            // src/widgets/order-form/postpone.js:81
	//--
                                                            // src/widgets/order-form/postpone.js:83
	function enable() {
		$time.prop( 'disabled', false );
		$remind.prop( 'disabled', false );
	}
                                                            // src/widgets/order-form/postpone.js:88
	function disable() {
		$time.prop( 'disabled', true );
		$remind.prop( 'disabled', true );
	}
                                                            // src/widgets/order-form/postpone.js:93
	/*
	 * Set postponement time input to the given UTC value.
	 */
	function setTime( utc )
	{
		var d = new Date( time.local( utc ) * 1000 );
		var s = fmt( "%d-%02d-%02dT%02d:%02d",
			d.getFullYear(),
			d.getMonth() + 1,
			d.getDate(),
			d.getHours(),
			d.getMinutes()
		);
		$time.val( s );
		/*
		 * The datetime input is possibly emulated, so we have to
		 * trigger the change event.
		 */
		$time.trigger( "change" );
	}
                                                            // src/widgets/order-form/postpone.js:114
	function getTime()
	{
		var d = parseDateTime( $time.val() );
		if( !d ) return null;
		return time.utc( Math.round( d.getTime() / 1000 ) );
	}
                                                            // src/widgets/order-form/postpone.js:121
	//--
                                                            // src/widgets/order-form/postpone.js:123
	/*
	 * Parses a string like "2000-01-01T00:00[:00]" and returns a Date
	 * object.
	 */
	function parseDateTime( dt )
	{
		var re = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)$/;
		var m = dt.match( re );
                                                            // src/widgets/order-form/postpone.js:132
		if( !m ) {
			re = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d)$/;
			m = dt.match( re );
		}
                                                            // src/widgets/order-form/postpone.js:137
		if( !m ) return null;
                                                            // src/widgets/order-form/postpone.js:139
		var Y = m[1];
		var M = m[2] - 1; /* 0-based, surprise! */
		var D = m[3];
		var h = m[4];
		var m = m[5];
		return new Date( Y, M, D, h, m );
	}
}


// src/widgets/orders-widget.js
function OrdersWidget( disp, options )
{
	options = options || {};
	var $container = createList();
	var listeners = new Listeners( ['order-click', 'cancel-click'] );
                                                            // src/widgets/orders-widget.js:6
	this.on = listeners.add.bind( listeners );
                                                            // src/widgets/orders-widget.js:8
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/widgets/orders-widget.js:12
	/*
	 * order id => array of timeouts.
	 */
	var timeouts = {};
                                                            // src/widgets/orders-widget.js:17
	/*
	 * Fill the widget with orders from the current list.
	 */
	disp.orders().forEach( function( order ) {
		addOrder( order );
	});
                                                            // src/widgets/orders-widget.js:24
	/*
	 * When orders change, update the widget.
	 */
	disp.on( 'order-changed', function( e ) {
		updateOrder( e.data.order );
	});
	disp.on( 'order-added', function( e ) {
		addOrder( e.data.order );
	});
	disp.on( 'order-removed', function( e ) {
		removeOrder( e.data.order );
	});
                                                            // src/widgets/orders-widget.js:37
	//--
                                                            // src/widgets/orders-widget.js:39
	/*
	 * Orders go into separate "sublists" depending on their status,
	 * and they are sorted by different time values depending of which
	 * sublist they are. To unify all that, every list item is assigned
	 * a "stamp" determined by order status and relevant time value.
	 */
                                                            // src/widgets/orders-widget.js:46
	function createList()
	{
		var $list = $( '<div id="orders-widget">\
			<div class="postponed">\
				<div class="list"></div>\
			</div>\
			<div class="current">\
				<div class="list"></div>\
			</div>\
			<div class="closed">\
				<div class="list"></div>\
			</div>\
		</div>' );
                                                            // src/widgets/orders-widget.js:60
		$list.on( 'click', '.order', function( event ) {
			var uid = $(this).data( 'uid' );
			var order = disp.getOrder( uid );
			listeners.call( 'order-click', {order: order} );
		});
                                                            // src/widgets/orders-widget.js:66
		$list.on( 'click', '.cancel', function( event ) {
			event.stopPropagation();
			var $t = $( this ).parents( '.order' );
			var uid = $t.data( 'uid' );
			var order = disp.getOrder( uid );
			listeners.call( 'cancel-click', {order: order} );
		});
                                                            // src/widgets/orders-widget.js:74
		return $list;
	}
                                                            // src/widgets/orders-widget.js:77
	function addOrder( order )
	{
		var $el = $( '<div></div>' );
		$el.data( 'uid', order.order_uid );
		$el.data( 'stamp', orderStamp( order ) );
		updateItem( $el, order );
		insertItem( $el, order );
		addTimers( order, $el );
	};
                                                            // src/widgets/orders-widget.js:87
	function updateOrder( order )
	{
		var $el = findItem( order );
		if( !$el ) {
			console.warn( "updateOrder: no element" );
			addOrder( order );
			return;
		}
                                                            // src/widgets/orders-widget.js:96
		/*
		 * The order changed its class or time, remove its item and
		 * insert where appropriate.
		 */
		var oldStamp = parseInt( $el.data( 'stamp' ), 10 );
		var newStamp = orderStamp( order );
		if( newStamp != oldStamp ) {
			$el.data( 'stamp', newStamp );
			$el.detach();
			insertItem( $el, order );
		}
		updateItem( $el, order );
                                                            // src/widgets/orders-widget.js:109
		removeTimers( order );
		addTimers( order, $el );
	};
                                                            // src/widgets/orders-widget.js:113
	/*
	 * Remove the given order from the list.
	 */
	function removeOrder( order )
	{
		var $el = findItem( order );
		if( !$el ) {
			console.warn( "removeOrder: no element" );
			return;
		}
		$el.remove();
		$el = null;
                                                            // src/widgets/orders-widget.js:126
		/*
		 * If have timers, remove them.
		 */
		removeTimers( order );
	};
                                                            // src/widgets/orders-widget.js:132
	// --
                                                            // src/widgets/orders-widget.js:134
	function orderStamp( order )
	{
		if( order.postponed() ) {
			return order.exp_arrival_time;
		}
		if( order.closed() ) {
			return -order.time_created;
		}
		return order.time_created;
	}
                                                            // src/widgets/orders-widget.js:145
	function insertItem( $el, order )
	{
		var $list = getList( order );
		var $nextItem = findNextItem( $list, $el );
		if( $nextItem ) {
			$el.insertBefore( $nextItem );
		} else {
			$list.append( $el );
		}
	}
                                                            // src/widgets/orders-widget.js:156
	/*
	 * Finds the element in the list before which the $el element must
	 * be inserted. Returns null if $el must be placed at the end of
	 * the list.
	 */
	function findNextItem( $list, $el )
	{
		var $next = null;
		var stamp = parseInt( $el.data( 'stamp' ), 10 );
		$list.find( '.order' ).each( function()
		{
			var $t = $( this );
			if( parseInt( $t.data( 'stamp' ), 10 ) >= stamp ) {
				$next = $t;
				return false;
			}
		});
		return $next;
	}
                                                            // src/widgets/orders-widget.js:176
	/*
	 * Returns element from the lists for the given order.
	 */
	function findItem( order )
	{
		var $item = null;
		$container.find( '.order' ).each( function()
		{
			var $t = $( this );
			if( $t.data( 'uid' ) == order.order_uid ) {
				$item = $t;
				return false;
			}
		});
		return $item;
	}
                                                            // src/widgets/orders-widget.js:193
	/*
	 * Returns the list to put the given order in.
	 * There are several sublists in which order are put depending on
	 * their status.
	 */
	function getList( order )
	{
		if( order.postponed() ) {
			return $container.find( '.postponed .list' );
		}
		if( order.closed() ) {
			return $container.find( '.closed .list' );
		}
		return $container.find( '.current .list' );
	}
                                                            // src/widgets/orders-widget.js:209
	function updateItem( $el, order )
	{
		var el = $el.get(0);
		el.className = 'order ' + getClassName( order );
		var s = '';
		if( order.status != order.CANCELLED ) {
			s += '<div class="cancel">Отменить</div>';
		}
		s += '<div class="number">№ ' + order.order_id + '</div>';
		if( !options.hideAddresses ) {
			s += '<div class="address">' + formatOrderDestination( order ) + '</div>';
		}
		s += '<div class="comments">' + html.escape( order.comments ) + '</div>';
		s += '<div class="customer">' + formatCustomer( order ) + '</div>';
		s += '<div class="status">' + formatStatus( order ) + '</div>';
		s += '<div class="driver">' + formatDriver( order ) + '</div>';
		el.innerHTML = s;
	}
                                                            // src/widgets/orders-widget.js:228
	function addTimers( order, $el )
	{
		if( !order.postponed() ) return;
		var a = [];
                                                            // src/widgets/orders-widget.js:233
		var times = [
			order.reminder_time - time.utc() - 300, // "soon"
			order.exp_arrival_time - time.utc(), // "urgent"
			order.reminder_time - time.utc() // "expired"
		];
                                                            // src/widgets/orders-widget.js:239
		times.forEach( function( t ) {
			if( t <= 0 ) return;
			var tid = setTimeout( updateItem.bind( undefined, $el, order ), t * 1000 );
			a.push( tid );
		});
                                                            // src/widgets/orders-widget.js:245
		if( a.length > 0 ) {
			timeouts[order.id] = a;
		}
	}
                                                            // src/widgets/orders-widget.js:250
	function removeTimers( order )
	{
		if( order.id in timeouts ) {
			var a = timeouts[order.id];
			delete timeouts[order.id];
			while( a.length ) clearTimeout( a.shift() );
		}
	}
                                                            // src/widgets/orders-widget.js:259
	//--
                                                            // src/widgets/orders-widget.js:261
	function getClassName( order )
	{
		if( !order.postponed() ) {
			return order.closed() ? 'closed' : 'current';
		}
                                                            // src/widgets/orders-widget.js:267
		var now = time.utc();
		var t1 = order.reminder_time;
		var t2 = order.exp_arrival_time;
		if( t1 > t2 ) {
			t1 = t2;
		}
                                                            // src/widgets/orders-widget.js:274
		// Enough time - green.
		if( now < t1 ) {
			return 'far';
		}
		// after reminder - yellow
		if( now < t2 ) {
			return 'soon';
		}
		// 10 minutes late - red
		if( now < t2 + 600 ) {
			return 'urgent';
		}
		// expired.
		return 'expired';
	}
                                                            // src/widgets/orders-widget.js:290
	function formatOrderDestination( order )
	{
		var addr;
		var loc = disp.getLocation( order.src_loc_id );
		if( loc ) {
			addr = '<span class="location">' + loc.name + '</span>';
		}
		else {
			addr = order.formatAddress();
		}
		return addr;
	}
                                                            // src/widgets/orders-widget.js:303
	function formatCustomer( order )
	{
		var n = order.customer_phone;
		if( !n || n == '' || n == '+375' ) {
			return '';
		}
		return fmt( '<a href="tel:%s">%s</a>',
			order.customer_phone, formatPhone( order.customer_phone )
		);
	}
                                                            // src/widgets/orders-widget.js:314
	function formatStatus( order )
	{
		var s = order.statusName();
		if( order.postponed() ) {
			s += ", подать в " + formatTime( order.exp_arrival_time );
		}
		else {
			s = formatTime( order.time_created ) + ", " + s;
		}
		return s;
	}
                                                            // src/widgets/orders-widget.js:326
	/*
	 * Write a UTC time as a readable local time string.
	 */
	function formatTime( t )
	{
		/*
		 * As we receive a pure UTC, we have to compensate for the
		 * client's wrong clock.
		 */
		t = time.local( t );
		var d = new Date( t * 1000 );
		var s = fmt( "%02d:%02d", d.getHours(), d.getMinutes() );
                                                            // src/widgets/orders-widget.js:339
		var now = new Date( time.utc() * 1000 );
		if( d.getDate() == now.getDate()
			&& d.getMonth() == now.getMonth()
			&& d.getFullYear() == now.getFullYear() ) {
			return s;
		}
                                                            // src/widgets/orders-widget.js:346
		var diff = (d.getTime() - now.getTime()) / 1000 / 3600 / 24;
                                                            // src/widgets/orders-widget.js:348
		if( diff > 0 && diff < 1 ) {
			s += " завтра";
		}
		else if( diff < 0 && diff > -1 ) {
			s += " вчера";
		}
		else {
			var monthNames = [
				'января', 'февраля', 'марта', 'апреля', 'мая',
				'июня', 'июля', 'августа', 'сентября', 'октября',
				'ноября', 'декабря'
			];
			s += ", " + d.getDate() + " " + monthNames[d.getMonth()];
		}
                                                            // src/widgets/orders-widget.js:363
		return s;
	}
                                                            // src/widgets/orders-widget.js:366
	function formatDriver( order )
	{
		var taxi = disp.getDriver( order.taxi_id );
		var call_id = taxi ? taxi.call_id : null;
		if( call_id ) {
			return call_id;
		}
		return '';
	}
}


// src/widgets/queues-widget/clicking.js
function initQueueClicking( disp, table )
{
	/*
	 * Split the click events into explicit left-click and right-click
	 * types.
	 */
	table.on( "item-click", function( event )
	{
		var driver = disp.getDriver( event.data.id );
		var queue = disp.getQueue( event.data.qid );
		if( event.data.button == 0 ) {
			return driverLeftClick( driver, queue );
		} else {
			return driverRightClick( driver, queue );
		}
	});
                                                            // src/widgets/queues-widget/clicking.js:17
	table.on( "head-click", function( event )
	{
		var queue = disp.getQueue( event.data.qid );
		if( !queue ) return;
		if( event.data.button == 0 ) {
			return queueLeftClick( queue );
		} else {
			return queueRightClick( queue );
		}
	});
                                                            // src/widgets/queues-widget/clicking.js:28
	//--
                                                            // src/widgets/queues-widget/clicking.js:30
	function driverLeftClick( driver, queue )
	{
		/*
		 * If there is an open editable form, update it with the
		 * driver.
		 */
		var form = orderForms.getFocusForm();
		if( form && !form.locked() ) {
			form.setDriver( driver.id );
			return;
		}
                                                            // src/widgets/queues-widget/clicking.js:42
		if( !queue ) {
			return;
		}
                                                            // src/widgets/queues-widget/clicking.js:46
		/*
		 * Create new form and set the driver and the queue in it.
		 */
		var form = orderForms.show();
		form.setQueue( queue.id );
		form.setDriver( driver.id );
	}
                                                            // src/widgets/queues-widget/clicking.js:54
	function driverRightClick( driver, queue )
	{
		if( driver.is_fake != '1' ) {
			return;
		}
                                                            // src/widgets/queues-widget/clicking.js:60
		var d = new Dialog( "Убрать " + driver.call_id + "?" );
		d.addButton( "Да", function() {
			disp.setDriverOnline( driver.id, false ).catch( function( error ) {
				Dialog.show( "Ошибка: " + error );
			});
			d.close();
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}
                                                            // src/widgets/queues-widget/clicking.js:71
	function queueLeftClick( queue )
	{
		/*
		 * If there is an open editable form, update it with the queue.
		 */
		var form = orderForms.getFocusForm();
		if( form && !form.locked() ) {
			form.setQueue( queue.id );
			return;
		}
		/*
		 * Otherwise create a new form and the the queue in it.
		 */
		var form = orderForms.show();
		form.setQueue( queue.id );
	}
                                                            // src/widgets/queues-widget/clicking.js:88
	function queueRightClick( queue )
	{
		/*
		 * If not a subqueue, return.
		 */
		if( !queue.parent_id ) return;
                                                            // src/widgets/queues-widget/clicking.js:95
		var $src = $( '<div><div>'
			+ '<label>Приоритет (0&ndash;9)</label>'
			+ '<input type="number" min="0" max="9" step="1"'
				+ ' name="priority" value="'+queue.priority+'">'
			+ '</div><div>'
			+ '<label>Количество дежурных машин</label>'
			+ '<input type="number" min="0" step="1"'
				+ ' name="min" value="'+queue.min+'">'
			+ '</div></div>' );
                                                            // src/widgets/queues-widget/clicking.js:105
		var d = new Dialog( $src.get(0) );
		d.addButton( "Изменить", function() {
			var min = $src.find( '[name="min"]' ).val();
			var priority = $src.find( '[name="priority"]' ).val();
			if( priority < 0 || priority > 9 ) {
				toast( "Недопустимое значение приоритета: " + priority );
				return;
			}
			if( min < 0 ) {
				toast( "Недопустимое значение количества дежурных: " + min );
				return;
			}
			disp.changeQueue( queue.id, min, priority );
			d.close();
		}, "yes" );
		d.addButton( "Отменить", null, "no" );
		d.setTitle( fmt( "Очередь «%s»", queue.name ) );
		d.show();
	}
}


// src/widgets/queues-widget/dragging.js
function initQueueDragging( disp, table )
{
	table.initDragging( onDragStart, onDragEnd, onDragCancel );
                                                            // src/widgets/queues-widget/dragging.js:4
	/*
	 * Original item's position.
	 */
	var qid1 = null;
	var pos1 = null;
                                                            // src/widgets/queues-widget/dragging.js:10
	function onDragStart( event )
	{
		qid1 = event.qid;
		pos1 = event.pos;
                                                            // src/widgets/queues-widget/dragging.js:15
		/*
		 * Mark queues forbidden for this driver.
		 */
		var allowed = allowedQueues( event.id );
		table.selectQueuesExcept( allowed, 'forbidden' );
		return true;
	}
                                                            // src/widgets/queues-widget/dragging.js:23
	function onDragCancel( event ) {
		table.selectQueues( [], 'forbidden' );
	}
                                                            // src/widgets/queues-widget/dragging.js:27
	function onDragEnd( event )
	{
		table.selectQueues( [], 'forbidden' );
                                                            // src/widgets/queues-widget/dragging.js:31
		var qid2 = event.qid;
		var pos2 = event.pos;
                                                            // src/widgets/queues-widget/dragging.js:34
		if( qid1 == qid2 && pos1 == pos2 ) {
			return false;
		}
                                                            // src/widgets/queues-widget/dragging.js:38
		var id = event.id;
		var from = { qid: qid1, pos: pos1 };
		var to = { qid: qid2, pos: pos2 };
                                                            // src/widgets/queues-widget/dragging.js:42
		/*
		 * Invalid destinations
		 */
		if( qid2 == table.NO_SESSION || qid2 == table.CITY ) {
			return false;
		}
		/*
		 * Invalid horizontal moves
		 */
		if( qid1 == qid2 && (qid1 == table.NONE || qid2 == table.BLOCKED ) ) {
			return false;
		}
                                                            // src/widgets/queues-widget/dragging.js:55
		if( qid2 == table.BLOCKED ) {
			showBanDialog( id );
			return false;
		}
                                                            // src/widgets/queues-widget/dragging.js:60
		if( qid1 == table.BLOCKED ) {
			showUnbanDialog( id );
			return false;
		}
                                                            // src/widgets/queues-widget/dragging.js:65
		if( to.qid == table.NONE ) {
			return confirmKick( id, from, to );
		}
                                                            // src/widgets/queues-widget/dragging.js:69
		if( disp.sessionRequired( id ) ) {
			toast( "Нельзя записывать в очередь не вышедших на смену" );
			return false;
		}
                                                            // src/widgets/queues-widget/dragging.js:74
		return confirmMove( id, from, to );
	}
                                                            // src/widgets/queues-widget/dragging.js:77
	//--
                                                            // src/widgets/queues-widget/dragging.js:79
	function allowedQueues( driverId )
	{
		var driver = disp.getDriver( driverId );
                                                            // src/widgets/queues-widget/dragging.js:83
		if( driver.blocked() ) {
			return [table.BLOCKED, table.NONE];
		}
                                                            // src/widgets/queues-widget/dragging.js:87
		if( disp.sessionRequired( driverId ) ) {
			return [table.BLOCKED];
		}
                                                            // src/widgets/queues-widget/dragging.js:91
		var ids = disp.allowedQueues( driverId );
		ids.push( table.BLOCKED );
		ids.push( table.NONE );
		return ids;
	}
                                                            // src/widgets/queues-widget/dragging.js:97
	function confirmKick( id, from, to )
	{
		var taxi = disp.getDriver( id );
		var message = "Убрать водителя "+taxi.call_id+" из очереди?";
		var d = new Dialog( message );
		d.addButton( "Да", function() {
			disp.removeDriverQueue( id );
			this.close();
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}
                                                            // src/widgets/queues-widget/dragging.js:110
	function confirmMove( id, from, to )
	{
		var pos = to.pos;
		var qid = to.qid;
                                                            // src/widgets/queues-widget/dragging.js:115
		/*
		 * If the destination is forbidden, process group change.
		 */
		var allowed = disp.allowedQueues( id );
		if( allowed.indexOf( qid ) == -1  ) {
			processTransfer( id, from, to );
			return;
		}
                                                            // src/widgets/queues-widget/dragging.js:124
		var taxi = disp.getDriver( id );
                                                            // src/widgets/queues-widget/dragging.js:126
		var doConfirm = from.qid != to.qid;
		if( !doConfirm ) {
			moveDriver( taxi, qid, pos );
			return;
		}
                                                            // src/widgets/queues-widget/dragging.js:132
		var q = disp.getQueue( qid );
		var message = "Переместить водителя " + taxi.call_id
			+ " в очередь &laquo;" + q.name + "&raquo; " + (pos+1) + "-м?";
                                                            // src/widgets/queues-widget/dragging.js:136
		var d = new Dialog( message );
		d.addButton( "Да", function() {
			moveDriver( taxi, qid, pos );
			this.close();
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}
                                                            // src/widgets/queues-widget/dragging.js:145
	//--
                                                            // src/widgets/queues-widget/dragging.js:147
	function processTransfer( id, from, to )
	{
		var qid = to.qid;
                                                            // src/widgets/queues-widget/dragging.js:151
		/*
		 * Find groups that have access to that queue.
		 */
		var groups = disp.getQueueGroups( qid );
                                                            // src/widgets/queues-widget/dragging.js:156
		if( groups.length == 0 ) {
			toast( "В эту очередь нельзя записаться" );
			return;
		}
                                                            // src/widgets/queues-widget/dragging.js:161
		var taxi = disp.getDriver( id );
                                                            // src/widgets/queues-widget/dragging.js:163
		if( groups.length == 1 ) {
			confirmTransfer( taxi, to, groups[0] );
			return;
		}
                                                            // src/widgets/queues-widget/dragging.js:168
		showTransferMenu( taxi, to, groups );
	}
                                                            // src/widgets/queues-widget/dragging.js:171
	function confirmTransfer( taxi, to, group )
	{
		var q = disp.getQueue( to.qid );
                                                            // src/widgets/queues-widget/dragging.js:175
		var msg = 'Чтобы водитель '+taxi.call_id+' мог записаться в очередь «'
			+ q.name + '», его нужно переназначить в группу «' + group.name + '». Переназначить?';
                                                            // src/widgets/queues-widget/dragging.js:178
		var d = new Dialog( msg );
		d.addButton( "Да", function() {
			disp.changeDriverGroup( driver_id, group_id );
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}
                                                            // src/widgets/queues-widget/dragging.js:186
	function showTransferMenu( taxi, to, groups )
	{
		var q = disp.getQueue( to.qid );
		var menu = 'Водитель '+taxi.call_id+' не может записаться в очередь «'+q.name+'» в его текущей группе. В какую группу его переназначить?';
		menu += '<div class="menu">';
		for( var i = 0; i < groups.length; i++ ) {
			menu += '<div data-gid="'+groups[i].group_id+'">' + groups[i].name + '</div>';
		}
		menu += '</div>';
                                                            // src/widgets/queues-widget/dragging.js:196
		var $menu = $( '<div>' + menu + '</div>' );
                                                            // src/widgets/queues-widget/dragging.js:198
		var buttons = [{title: "Отменить"}];
		var d = new Dialog( $menu.get(0) );
		d.addButton( "Отменить", null, "no" );
		d.show();
		$menu.on( 'click', '.menu > div', function( event )
		{
			var gid = $(event.target).data( 'gid' );
			disp.changeDriverGroup( driver_id, group_id );
			d.close();
		});
	}
                                                            // src/widgets/queues-widget/dragging.js:210
	function moveDriver( driver, qid, pos )
	{
		if( disp.param( "queue_dialogs" ) == "1" && driver.is_fake != '1' )
		{
			if( !driver.online() ) {
				toast( "Водитель не на связи" );
			} else {
				disp.suggestQueue( driver.driver_id, qid, pos );
				toast( "Водителю отправлено сообщение" );
			}
			return;
		}
                                                            // src/widgets/queues-widget/dragging.js:223
		disp.assignDriverQueue( driver.id, qid, pos );
	}
}


// src/widgets/queues-widget/items.js
function QueuesWidgetItems( disp )
{
	var items = {};
	var selections = {};
                                                            // src/widgets/queues-widget/items.js:5
	this.select = function( filter, className )
	{
		if( !className ) className = "highlight";
		if( !filter ) {
			unselect( className );
			return;
		}
                                                            // src/widgets/queues-widget/items.js:13
		selections[className] = filter;
		for( var id in items )
		{
			var d = disp.getDriver( id );
			if( obj.match( d, filter ) ) {
				items[id].addClass( className );
			}
			else {
				items[id].removeClass( className );
			}
		}
	};
                                                            // src/widgets/queues-widget/items.js:26
	function unselect( className )
	{
		if( !(className in selections ) ) {
			return;
		}
		delete selections[className];
		for( var id in items ) {
			items[id].removeClass( className );
		}
	}
                                                            // src/widgets/queues-widget/items.js:37
	this.get = function( id )
	{
		/*
		 * If not in cache, create and save.
		 */
		if( !(id in items) ) {
			items[id] = create( id );
			update( id );
		}
		return items[id].get(0);
	};
                                                            // src/widgets/queues-widget/items.js:49
	this.update = update;
                                                            // src/widgets/queues-widget/items.js:51
	//--
                                                            // src/widgets/queues-widget/items.js:53
	function create( id )
	{
		var driver = disp.getDriver( id );
		var $icon = $( '<div class="car" data-id="'+id+'">'+driver.call_id+'</div>' );
		return $icon;
	}
                                                            // src/widgets/queues-widget/items.js:60
	function update( id )
	{
		if( !(id in items) ) {
			return;
		}
		var icon = items[id].get(0);
                                                            // src/widgets/queues-widget/items.js:67
		var className = getClassName( id );
		if( className != icon.className ) {
			icon.className = className;
		}
                                                            // src/widgets/queues-widget/items.js:72
		var title = getTitle( id );
		if( title != icon.title ) {
			icon.title = title;
		}
	}
                                                            // src/widgets/queues-widget/items.js:78
	function getClassName( id )
	{
		var taxi = disp.getDriver( id );
		var car = disp.getDriverCar( id );
                                                            // src/widgets/queues-widget/items.js:83
		var className = 'car';
		if( car.body_type ) className += ' ' + car.body_type;
                                                            // src/widgets/queues-widget/items.js:86
		var currentOrders = disp.getDriverOrders( id ).filter( function( o ) {
			return !o.closed();
		});
		if( currentOrders.length > 0 || taxi.is_busy == 1 ) {
			className += ' busy';
		}
                                                            // src/widgets/queues-widget/items.js:93
		/*
		 * If the driver is in a queue and is too far from its location,
		 * add "away" class.
		 */
		var q = disp.getDriverQueue( id );
		var d = disp.getDriver( id );
		if( q ) {
			var d = geo.distance( d.coords(), q.coords() );
			if( d > 200 ) {
				className += ' away';
			}
		}
                                                            // src/widgets/queues-widget/items.js:106
		if( !taxi.online() ) {
			className += ' offline';
		}
                                                            // src/widgets/queues-widget/items.js:110
		if( taxi["is_fake"] == '1' ) {
			className += ' fake';
		}
                                                            // src/widgets/queues-widget/items.js:114
		/*
		 * If the driver falls into a previously defined selection,
		 * add the corresponding class.
		 */
		for( var selectClass in selections )
		{
			var filter = selections[selectClass];
			if( obj.match( taxi, filter ) ) {
				className += ' ' + selectClass;
			}
		}
                                                            // src/widgets/queues-widget/items.js:126
		return className;
	}
                                                            // src/widgets/queues-widget/items.js:129
	function getTitle( id )
	{
		var driver = disp.getDriver( id );
		var car = disp.getDriverCar( id );
		var parts = [
			car.format(), driver.format(), driver.blockDesc()
		].filter( hasValue );
		return parts.join( ', ' );
	}
}


// src/widgets/queues-widget/queues-widget.js
function QueuesWidget( disp, options )
{
	var defaults = {
		disableDragging: false,
		disableFakeQueues: false
	};
	options = options || {};
	for( var k in defaults ) {
		if( !(k in options) ) {
			options[k] = defaults[k];
		}
	}
                                                            // src/widgets/queues-widget/queues-widget.js:13
	var items = new QueuesWidgetItems( disp );
	var table = new QueuesWidgetTable( disp, items );
                                                            // src/widgets/queues-widget/queues-widget.js:16
	this.root = function() {
		return table.root();
	};
                                                            // src/widgets/queues-widget/queues-widget.js:20
	this.selectDrivers = function( filter ) {
		items.select( filter );
	};
                                                            // src/widgets/queues-widget/queues-widget.js:24
	/*
	 * Conditions for queues are:
	 * - no session: online, !blocked, !session
	 * - blocked: online, blocked
	 * - none: online, !blocked, session
	 * - city: online, !blocked, session, no accessible queues
	 * - normal queue: !blocked, session
	 */
	table.NONE = 0;
	table.BLOCKED = -1;
	table.NO_SESSION = -2;
	table.CITY = -3;
                                                            // src/widgets/queues-widget/queues-widget.js:37
	//--
                                                            // src/widgets/queues-widget/queues-widget.js:39
	addQueues();
	fillDrivers();
	/*
	 * When configuration of queues changes, redraw the widget
	 */
	disp.on( 'queues-changed', function( event ) {
		table.empty();
		addQueues();
		fillDrivers();
	});
                                                            // src/widgets/queues-widget/queues-widget.js:50
	trackDrivers();
                                                            // src/widgets/queues-widget/queues-widget.js:52
	if( !options.disableDragging ) {
		initQueueDragging( disp, table );
	}
	initQueueClicking( disp, table );
                                                            // src/widgets/queues-widget/queues-widget.js:57
	//--
                                                            // src/widgets/queues-widget/queues-widget.js:59
	function addQueues()
	{
		if( !options.disableFakeQueues )
		{
			if( disp.sessionsEnabled() ) {
				table.addQueue({id: table.NO_SESSION, name: "Не вышли на смену"});
			}
                                                            // src/widgets/queues-widget/queues-widget.js:67
			table.addQueue({id: table.BLOCKED, name: "Заблокированы"});
			table.addQueue( {id: table.NONE, name: "Не записаны"});
			/*
			 * If there are drivers who don't have access to any queues,
			 * add a special row for them.
			 */
			if( disp.haveNonQueueGroups() ) {
				table.addRow( {id: table.CITY, name: "Город"} );
			}
			table.addRule( '' );
		}
                                                            // src/widgets/queues-widget/queues-widget.js:79
		disp.queues().forEach( function( q ) {
			table.addQueue( q );
		});
	}
                                                            // src/widgets/queues-widget/queues-widget.js:84
	function fillDrivers()
	{
		var map = {};
		function push( qid, val ) {
			if( !(qid in map) ) map[qid] = [val];
			else map[qid].push( val );
		}
                                                            // src/widgets/queues-widget/queues-widget.js:92
		if( !options.disableFakeQueues )
		{
			disp.drivers().forEach( function( d )
			{
				if( !d.online() ) return;
				if( disp.getDriverQueue( d.id ) ) {
					return;
				}
				if( disp.sessionRequired( d.id ) ) {
					push( table.NO_SESSION, d.id );
					return;
				}
				if( d.blocked() ) {
					push( table.BLOCKED, d.id );
					return;
				}
				if( disp.allowedQueues( d.id ).length == 0 ) {
					push( table.CITY, d.id );
					return;
				}
				push( table.NONE, d.id );
			});
		}
                                                            // src/widgets/queues-widget/queues-widget.js:116
		disp.queues().forEach( function( q ) {
			disp.getQueueDrivers( q.id ).forEach( function( driver, pos ) {
				push( q.id, driver.id );
			});
		});
		table.setDrivers( map );
	}
                                                            // src/widgets/queues-widget/queues-widget.js:124
	function trackDrivers()
	{
		/*
		 * When a driver's property has changed, update the icon.
		 */
		disp.on( 'driver-changed', function( e ) {
			items.update( e.data.driver.id );
		});
		/*
		 * When an order is changed, update the driver associated with
		 * that order.
		 */
		disp.on( 'order-changed', function( e ) {
			var id = e.data.order.taxi_id;
			if( id ) {
				items.update( id );
			}
		});
		/*
		 * When queue assignments have changed, simply recreate the
		 * picture.
		 */
		disp.on( "queue-assignments-changed", fillDrivers );
		disp.on( "driver-online-changed", fillDrivers );
		disp.on( "sessions-changed", fillDrivers );
		disp.on( "driver-block-changed", fillDrivers );
	}
}


// src/widgets/queues-widget/table.js
function QueuesWidgetTable( disp, items )
{
	/*
	 * Construct the table
	 */
	var QUEUE_COLUMNS = 20;
	var s = '<table class="queues-table">';
	s += '<thead><tr><th>&nbsp;</th>';
	for( var i = 0; i < QUEUE_COLUMNS; i++ ) {
		s += '<th>' + (i+1) + '</th>';
	}
	s += '</tr></thead>';
	s += '<tbody></tbody></table>';
                                                            // src/widgets/queues-widget/table.js:14
	var $table = $( s );
	var $tbody = $table.find( "tbody" );
                                                            // src/widgets/queues-widget/table.js:17
	var queues = {};
	var listeners = new Listeners([ "head-click", "item-click" ]);
                                                            // src/widgets/queues-widget/table.js:20
	this.root = function() {
		return $table.get(0);
	};
                                                            // src/widgets/queues-widget/table.js:24
	this.on = listeners.add.bind( listeners );
                                                            // src/widgets/queues-widget/table.js:26
	initEvents();
                                                            // src/widgets/queues-widget/table.js:28
	//--
                                                            // src/widgets/queues-widget/table.js:30
	function initEvents()
	{
		$table.on( 'click', 'td', convert );
		$table.on( 'contextmenu', 'td', convert );
                                                            // src/widgets/queues-widget/table.js:35
		function convert( event )
		{
			event.preventDefault();
			var $t = $( event.target );
			var $tr = $t.parents( "tr" );
                                                            // src/widgets/queues-widget/table.js:41
			var data = {
				qid: $tr.data( "qid" ),
				button: event.which - 1,
				ctrlKey: event.ctrlKey,
				shiftKey: event.shiftKey
			};
                                                            // src/widgets/queues-widget/table.js:48
			if( $t.hasClass( "queue-head" ) ) {
				listeners.call( "head-click", data );
				return;
			}
                                                            // src/widgets/queues-widget/table.js:53
			if( $t.hasClass( "car" ) ) {
				data.id = $t.data( "id" );
				listeners.call( "item-click", data );
				return;
			}
		}
	}
                                                            // src/widgets/queues-widget/table.js:61
	this.initDragging = function( onDragStart, onDragEnd, onDragCancel )
	{
		$table.on( 'selectstart', function( event ) {
			event.preventDefault();
		});
                                                            // src/widgets/queues-widget/table.js:67
		var opt = {};
		opt.onDragStart = function( item )
		{
			var $t = $( item );
			/*
			 * Only driver icons can be dragged.
			 */
			if( !$t.hasClass( "car" ) ) {
				return false;
			}
			var $td = $t.parent();
			var $tr = $td.parent();
                                                            // src/widgets/queues-widget/table.js:80
			var data = {
				id: $t.data( "id" ),
				qid: $tr.data( "qid" ),
				pos: $td.data( "pos" )
			};
                                                            // src/widgets/queues-widget/table.js:86
			return onDragStart( data );
		};
                                                            // src/widgets/queues-widget/table.js:89
		opt.onDragEnd = function( item, dest )
		{
			var $t = $( item );
			var $td = $( dest );
			var $tr = $td.parent();
                                                            // src/widgets/queues-widget/table.js:95
			/*
			 * Filter cells that are not part of queues.
			 */
			var pos = $td.data( "pos" );
			if( typeof pos == "undefined" ) {
				return false;
			}
                                                            // src/widgets/queues-widget/table.js:103
			var data = {
				id: $t.data( "id" ),
				qid: $tr.data( "qid" ),
				pos: pos
			};
			return onDragEnd( data );
		};
                                                            // src/widgets/queues-widget/table.js:111
		opt.onDragCancel = function( item ) {
			onDragCancel( item );
		};
                                                            // src/widgets/queues-widget/table.js:115
		opt.itemsSelector = "td > *";
		opt.landsSelector = "td";
		initDrag( $table.get(0), opt );
	};
                                                            // src/widgets/queues-widget/table.js:120
	this.empty = function() {
		$tbody.empty();
		queues = {};
	};
                                                            // src/widgets/queues-widget/table.js:125
	this.addQueue = function( q, rows )
	{
		if( !rows ) rows = 1;
		var qid = q.id;
                                                            // src/widgets/queues-widget/table.js:130
		var Q = {
			rows: [],
			cells: [],
			items: [],
			number: null
		};
		queues[qid] = Q;
		for( var i = 0; i < rows; i++ ) {
			createRow( Q, q );
		}
                                                            // src/widgets/queues-widget/table.js:141
		for( i = 0; i < q.min; i++ ) {
			Q.cells[i].className = 'req';
		}
	};
                                                            // src/widgets/queues-widget/table.js:146
	this.addRule = function( name )
	{
		name = name || '';
		var s = '<tr><th colspan="'+(QUEUE_COLUMNS + 1)+'">'+name+'</th></tr>';
		$table.append( s );
	};
                                                            // src/widgets/queues-widget/table.js:153
	this.setDrivers = function( map )
	{
		removeDrivers();
		for( var qid in map )
		{
			var list = map[qid];
			var q = queues[qid];
			q.number.innerHTML = list.length;
			var n = list.length;
			for( var i = 0; i < n; i++ )
			{
				var id = list[i];
				if( i >= q.cells.length ) break;
				var item = items.get( id );
				items.update( id );
				q.items[i] = item;
				q.cells[i].appendChild( item );
			}
		}
	};
                                                            // src/widgets/queues-widget/table.js:174
	function removeDrivers()
	{
		for( var qid in queues ) {
			queues[qid].items.forEach( function( item ) {
				item.remove();
			});
		}
	}
                                                            // src/widgets/queues-widget/table.js:183
	this.selectQueues = function( ids, className )
	{
		highlightRows( ids.map( toInt ), className );
	};
                                                            // src/widgets/queues-widget/table.js:188
	this.selectQueuesExcept = function( ids, className )
	{
		var ids = ids.map( toInt );
		var list = [];
		for( var qid in queues ) {
			qid = parseInt( qid, 10 );
			if( ids.indexOf( qid ) == -1 ) {
				list.push( qid );
			}
		}
		highlightRows( list, className );
	};
                                                            // src/widgets/queues-widget/table.js:201
	function highlightRows( ids, className )
	{
		className = className || "highlight";
		for( var qid in queues )
		{
			qid = parseInt( qid, 10 );
			var $r = $( queues[qid].rows );
			if( ids.indexOf( qid ) >= 0 ) {
				$r.addClass( className );
			}
			else {
				$r.removeClass( className );
			}
		}
	}
                                                            // src/widgets/queues-widget/table.js:217
	//--
                                                            // src/widgets/queues-widget/table.js:219
	function createRow( Q, q )
	{
		var qid = q.id;
                                                            // src/widgets/queues-widget/table.js:223
		var row = document.createElement( 'tr' );
		row.setAttribute( 'data-qid', qid );
		Q.rows.push( row );
                                                            // src/widgets/queues-widget/table.js:227
		/*
		 * The leftmost cell, the head.
		 */
		var td = document.createElement( 'td' );
		td.className = 'queue-head';
		td.innerHTML = q.name;
                                                            // src/widgets/queues-widget/table.js:234
		/*
		 * If this is a subqueue, add a class and a priority indicator.
		 */
		if( Q.rows.length == 1 && q.parent_id ) {
			var p = document.createElement( 'span' );
			p.className = 'priority';
			p.innerHTML = romanNumeral( q.priority + 1 );
			td.appendChild( p );
			row.className = 'subqueue';
		}
                                                            // src/widgets/queues-widget/table.js:245
		/*
		 * Cars number indicator.
		 */
		var number = document.createElement( 'span' );
		number.className = 'number';
		Q.number = number;
		number.innerHTML = '0';
		td.appendChild( number );
		row.appendChild( td );
                                                            // src/widgets/queues-widget/table.js:255
		for( var i = 0; i < QUEUE_COLUMNS; i++ )
		{
			td = document.createElement( 'td' );
			td.setAttribute( 'data-pos', Q.cells.length );
			Q.cells.push( td );
			row.appendChild( td );
		}
		$table.append( row );
	}
}

})();
