/*
	Compilation date: 2016-07-08
	Number of files: 62
*/
(function() {
"use strict";

// lib/assert.js
function assert( val, msg, obj )
{
	if( val ) return;
	if( !msg ) msg = "assertion failed";
	console.error( msg, obj );
	throw msg;
}
                                                            // lib/assert.js:8
function assertObj( obj, fields )
{
	assert( obj, "assertObj: given object is " + obj, obj );
                                                            // lib/assert.js:12
	for( var k in fields )
	{
		assert( k in obj, "no field '" + k + "'", obj );
		var type = fields[k];
		assert( typeMatch( obj[k], type ),
			"field '"+k+"' has wrong type ("+(typeof obj[k])+")" );
	}
}
                                                            // lib/assert.js:21
function typeMatch( val, type )
{
	if( type == '' ) return true;
                                                            // lib/assert.js:25
	var nullOk;
	if( type.substr( -1 ) == "?" ) {
		nullOk = true;
		type = type.substring( 0, type.length - 1 );
	}
	else {
		nullOk = false;
	}
                                                            // lib/assert.js:34
	if( val === null && nullOk ) {
		return true;
	}
                                                            // lib/assert.js:38
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
	/*
	 * Keydown listeners.
	 */
	var windowListeners = [];
                                                            // lib/dialog.js:14
	var $container = $( '<div class="w-dialog"></div>' );
	var $title = $( '<div class="title"></div>' );
	var $content = $( '<div class="content"></div>' );
	if( content ) {
		$content.append( content );
	}
	var $buttons = $( '<div class="buttons"></div>' );
	var $yesButton = null;
	var $noButton = null;
                                                            // lib/dialog.js:24
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
                                                            // lib/dialog.js:44
		$b.on( 'click', onclick.bind( this ) );
		$buttons.append( $b );
                                                            // lib/dialog.js:47
		switch( keytype ) {
			case 'yes':
				$yesButton = $b;
				break;
			case 'no':
				$noButton = $b;
				break;
		}
                                                            // lib/dialog.js:56
		return $b.get(0);
	};
                                                            // lib/dialog.js:59
	this.setTitle = function( title ) {
		$title.html( title );
	};
                                                            // lib/dialog.js:63
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
                                                            // lib/dialog.js:80
		if( $yesButton ) listenKeys( this, 13, $yesButton ); // enter
		if( $noButton ) listenKeys( this, 27, $noButton ); // escape
                                                            // lib/dialog.js:83
		layer.onBlur( function() {
			callListeners( 'blur' );
		});
		layer.onFocus( function() {
			callListeners( 'focus' );
		});
	};
                                                            // lib/dialog.js:91
	function listenKeys( _this, code, $b )
	{
		var f = function( event ) {
			if( event.keyCode != code ) {
				return;
			}
			if( !layer.hasFocus() ) {
				return;
			}
			$b.click();
			event.stopPropagation();
		};
		windowListeners.push( f );
		$(window).on( 'keydown', f );
	}
                                                            // lib/dialog.js:107
	this.close = function()
	{
		var t = this;
		listeners.close.forEach( function( f ) {
			f.call( t );
		});
		$container.remove();
		$container = null;
		layer.remove();
		layer = null;
		while( windowListeners.length > 0 ) {
			$(window).off( 'keydown', windowListeners.pop() );
		}
	};
                                                            // lib/dialog.js:122
	this.isOpen = function() {
		return layer != null;
	};
                                                            // lib/dialog.js:126
	this.focus = function() {
		layer.focus();
	};
                                                            // lib/dialog.js:130
	var listeners = {
		"focus": [],
		"blur": [],
		"close": []
	};
                                                            // lib/dialog.js:136
	function callListeners( type ) {
		for( var i = 0; i < listeners[type].length; i++ ) {
			listeners[type][i]();
		}
	}
                                                            // lib/dialog.js:142
	this.on = function( type, func ) {
		if( !(type in listeners) ) {
			throw "Unknown event type: " + type;
		}
		listeners[type].push( func );
	};
}
                                                            // lib/dialog.js:150
Dialog.show = function( msg ) {
	(new Dialog( msg )).show();
};


// lib/disp-core.js
/*
	Compilation date: 2016-07-08
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
		var p = dx.post( 'cmd', {
			cmd: cmd,
			data: JSON.stringify( data )
		});
                                                            // lib/disp-core.js:954
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
                                                            // lib/disp-core.js:965
		return p;
	};
                                                            // lib/disp-core.js:968
	//--
                                                            // lib/disp-core.js:970
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
                                                            // lib/disp-core.js:984
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
                                                            // lib/disp-core.js:1019
	function processMessages( messages )
	{
		messages.forEach( function( m ) {
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
                                                            // lib/disp-core.js:1033
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
                                                            // lib/disp-core.js:1054
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
                                                            // lib/disp-core.js:1066
                                                            // lib/disp-core.js:1067
                                                            // lib/disp-core.js:1068
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
                                                            // lib/disp-core.js:1080
	this.dx = function() {
		return dx;
	};
}
                                                            // lib/disp-core.js:1085
                                                            // lib/disp-core.js:1086
// src/disp.js
                                                            // lib/disp-core.js:1088
function DispatcherClient()
{
	var url = "/dx/dispatcher";
                                                            // lib/disp-core.js:1092
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
		"sync",
		"call-accepted",
		"call-ended",
		"line-connected",
		"line-disconnected"
	] );
                                                            // lib/disp-core.js:1124
	this.on = listeners.add.bind( listeners );
                                                            // lib/disp-core.js:1126
	var _this = this;
	var data = null;
                                                            // lib/disp-core.js:1129
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
                                                            // lib/disp-core.js:1142
	function init( msg )
	{
		data = msg.data;
		time.set( data.now );
                                                            // lib/disp-core.js:1147
		for( var i = 0; i < data.fares.length; i++ ) {
			data.fares[i] = new Fare( data.fares[i] );
		}
                                                            // lib/disp-core.js:1151
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
                                                            // lib/disp-core.js:1164
		listeners.call( 'ready' );
	}
                                                            // lib/disp-core.js:1167
	conn.onMessage( "service-log", function( msg ) {
		listeners.call( "service-log", msg.data );
	});
                                                            // lib/disp-core.js:1171
	conn.onMessage( "call-accepted", function( msg ) {
		listeners.call( "call-accepted", msg.data );
	});
                                                            // lib/disp-core.js:1175
	conn.onMessage( "call-ended", function( msg ) {
		listeners.call( "call-ended", msg.data );
	});
                                                            // lib/disp-core.js:1179
	conn.onMessage( "line-connected", function( msg ) {
		listeners.call( "line-connected", msg.data );
	});
                                                            // lib/disp-core.js:1183
	conn.onMessage( "line-disconnected", function( msg ) {
		listeners.call( "line-disconnected", msg.data );
	});
                                                            // lib/disp-core.js:1187
	this.id = function() { return data.who.id; };
	this.login = function() { return data.who.login; };
	this.RTT = function() { return conn.RTT(); };
                                                            // lib/disp-core.js:1191
	this.param = function( name ) {
		return data.service_options[name];
	};
                                                            // lib/disp-core.js:1195
	this.fares = function() {
		return data.fares;
	};
                                                            // lib/disp-core.js:1199
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
                                                            // lib/disp-core.js:1217
                                                            // lib/disp-core.js:1218
// src/driver-alarms.js
function initDriverAlarms( conn, listeners, data )
{
	var alarms = {};
                                                            // lib/disp-core.js:1223
	data.driver_alarms.forEach( function( alarm ) {
		alarms[alarm.driver_id] = alarm;
	});
                                                            // lib/disp-core.js:1227
	this.driverAlarms = function() {
		var list = [];
		for( var driverId in alarms ) {
			list.push( {driverId: driverId} );
		}
		return list;
	};
                                                            // lib/disp-core.js:1235
	conn.onMessage( 'driver-alarm-on', function( msg )
	{
		var driver = disp.getDriver( msg.data.driver_id );
		if( !driver ) return;
                                                            // lib/disp-core.js:1240
		alarms[driver.id] = msg.data;
		listeners.call( 'driver-alarm-on', {driver: driver} );
	});
                                                            // lib/disp-core.js:1244
	conn.onMessage( 'driver-alarm-off', function( msg )
	{
		var driver = disp.getDriver( msg.data.driver_id );
		if( !driver ) return;
                                                            // lib/disp-core.js:1249
		if( !(driver.id in alarms) ) {
			console.error( "There is no alarm for", driver.id );
			return;
		}
		listeners.call( 'driver-alarm-off', {driver: driver} );
	});
}
                                                            // lib/disp-core.js:1257
                                                            // lib/disp-core.js:1258
// src/drivers.js
function initDrivers( conn, listeners, data )
{
	var drivers = {};
	var cars = {};
                                                            // lib/disp-core.js:1264
	/*
	 * Group id => group object.
	 */
	var groups = {};
                                                            // lib/disp-core.js:1269
	data.drivers.forEach( function( d ) {
		var d = new Driver( d );
		drivers[d.id] = d;
	});
                                                            // lib/disp-core.js:1274
	data.cars.forEach( function( d ) {
		var c = new Car( d );
		cars[c.id] = c;
	});
                                                            // lib/disp-core.js:1279
	data.groups.forEach( function( g ) {
		groups[g.group_id] = g;
	});
                                                            // lib/disp-core.js:1283
	this.drivers = function() {
		return obj.toArray( drivers ).sort( function( a, b ) {
			return natcmp( a.call_id, b.call_id );
		});
	};
                                                            // lib/disp-core.js:1289
	this.driverGroups = function() {
		return obj.toArray( groups );
	};
                                                            // lib/disp-core.js:1293
	this.getDriver = function( driverId ) {
		return drivers[driverId];
	};
                                                            // lib/disp-core.js:1297
	this.getCar = function( carId ) {
		return cars[carId];
	};
                                                            // lib/disp-core.js:1301
	this.getDriverCar = function( driverId ) {
		var d = drivers[driverId];
		return cars[d.car_id];
	};
                                                            // lib/disp-core.js:1306
	this.driverTypes = function() {
		return data.driver_types;
	};
                                                            // lib/disp-core.js:1310
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
                                                            // lib/disp-core.js:1322
	this.unblockDriver = function( driverId ) {
		return conn.send( 'unban-taxi', {
			driver_id: driverId
		});
	};
                                                            // lib/disp-core.js:1328
	this.changeDriverGroup = function( driverId, groupId ) {
		return conn.send( 'change-driver-group', {
			driver_id: driverId,
			group_id: groupId
		});
	};
                                                            // lib/disp-core.js:1335
	conn.onMessage( 'driver-changed', function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1340
		var prevOnline = driver.is_online == '1';
                                                            // lib/disp-core.js:1342
		var diff = msg.data.diff;
		for( var k in diff ) {
			driver[k] = diff[k];
		}
                                                            // lib/disp-core.js:1347
		var online = driver.is_online == '1';
		if( online != prevOnline ) {
			listeners.call( "driver-online-changed", {driver: driver} );
		}
		listeners.call( 'driver-changed', {driver: driver} );
	});
                                                            // lib/disp-core.js:1354
	conn.onMessage( "driver-blocked", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1359
		driver.block_until = msg.data.until;
		driver.block_reason = msg.data.reason;
		listeners.call( "driver-block-changed", {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});
                                                            // lib/disp-core.js:1365
	conn.onMessage( "driver-unblocked", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1370
		driver.block_until = 0;
		driver.block_reason = "";
		listeners.call( "driver-block-changed", {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});
                                                            // lib/disp-core.js:1376
	conn.onMessage( 'driver-position', function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1381
		driver.latitude = msg.data.latitude;
		driver.longitude = msg.data.longitude;
		listeners.call( 'driver-moved', {driver: driver} );
		listeners.call( 'driver-changed', {driver: driver} );
	});
                                                            // lib/disp-core.js:1387
	conn.onMessage( "driver-busy", function( msg )
	{
		var driver = msgDriver( msg );
		if( !driver ) return;
                                                            // lib/disp-core.js:1392
		driver.is_busy = msg.data.busy;
		listeners.call( "driver-changed", {driver: driver} );
	});
                                                            // lib/disp-core.js:1396
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
                                                            // lib/disp-core.js:1407
                                                            // lib/disp-core.js:1408
// src/imitations.js
function initImitations( conn, listeners, data )
{
	this.setDriverOnline = function( driver_id, online ) {
		return conn.send( 'set-imitation-online', {
			taxi_id: driver_id,
			online: online? 1 : 0
		})
	};
                                                            // lib/disp-core.js:1418
	this.imitationsEnabled = function() {
		return data.service_options.imitations == "1";
	};
}
                                                            // lib/disp-core.js:1423
                                                            // lib/disp-core.js:1424
// src/locations.js
function initLocations( conn, listeners, data )
{
	var locations = {};
                                                            // lib/disp-core.js:1429
	data.queue_locations.forEach( function( d ) {
		var loc = new Location( d );
		locations[loc.id] = loc;
	});
                                                            // lib/disp-core.js:1434
	this.locations = function() {
		return obj.toArray( locations );
	};
                                                            // lib/disp-core.js:1438
	this.getLocation = function( locId ) {
		return locations[locId];
	};
                                                            // lib/disp-core.js:1442
	this.getQueueLocation = function( qid ) {
		for( var locid in locations ) {
			if( locations[locid].queue_id == qid ) {
				return locations[locid];
			}
		}
		return null;
	};
                                                            // lib/disp-core.js:1451
	this.suggestLocations = function( term ) {
		return conn.dx().get( "locations", {term: term} );
	};
}
                                                            // lib/disp-core.js:1456
                                                            // lib/disp-core.js:1457
// src/obj/address.js
function Address( data )
{
	this.place = '';
	this.street = '';
	this.house = '';
	this.building = '';
	this.entrance = '';
	this.apartment = '';
                                                            // lib/disp-core.js:1467
	for( var k in data ) {
		this[k] = data[k];
	}
}
                                                            // lib/disp-core.js:1472
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
                                                            // lib/disp-core.js:1491
Address.prototype.isEmpty = function()
{
	return this.place == "" || this.street == "";
};
                                                            // lib/disp-core.js:1496
window.Address = Address;
                                                            // lib/disp-core.js:1498
                                                            // lib/disp-core.js:1499
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
                                                            // lib/disp-core.js:1511
	for( var k in spec ) {
		this[k] = data[k];
	}
                                                            // lib/disp-core.js:1515
	this.id = this.car_id;
}
                                                            // lib/disp-core.js:1518
Car.prototype.bodyName = function()
{
	var bodies = {
		"sedan": "седан",
		"estate": "универсал",
		"hatchback": "хетчбек",
		"minivan": "минивен",
		"bus": "автобус"
	};
                                                            // lib/disp-core.js:1528
	if( this.body_type in bodies ) return bodies[this.body_type];
	return this.body_type;
};
                                                            // lib/disp-core.js:1532
Car.prototype.format = function()
{
	var parts = [
		this.name, this.color, this.bodyName(), this.plate
	].filter( hasValue );
	return parts.join( ', ' );
};
                                                            // lib/disp-core.js:1540
                                                            // lib/disp-core.js:1541
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
                                                            // lib/disp-core.js:1553
	assertObj( data, spec );
                                                            // lib/disp-core.js:1555
	for( var k in spec ) this[k] = data[k];
}
                                                            // lib/disp-core.js:1558
                                                            // lib/disp-core.js:1559
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
                                                            // lib/disp-core.js:1586
Driver.prototype.surname = function()
{
	var pos = this.name.indexOf( ' ' );
	if( pos == -1 ) return this.name;
	return this.name.substr( 0, pos );
};
                                                            // lib/disp-core.js:1593
Driver.prototype.coords = function() {
	return [this.latitude, this.longitude];
};
                                                            // lib/disp-core.js:1597
Driver.prototype.online = function() {
	return this.is_online == 1;
};
                                                            // lib/disp-core.js:1601
Driver.prototype.blocked = function()
{
	return this.block_until > time.utc();
};
                                                            // lib/disp-core.js:1606
Driver.prototype.blockDesc = function()
{
	if( !this.blocked() ) {
		return '';
	}
                                                            // lib/disp-core.js:1612
	var msg = 'Заблокирован до ';
                                                            // lib/disp-core.js:1614
	var now = new Date();
	var release = new Date( time.local( this.block_until ) * 1000 );
                                                            // lib/disp-core.js:1617
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
                                                            // lib/disp-core.js:1628
Driver.prototype.format = function()
{
	if( !this.name ) return this.call_id;
                                                            // lib/disp-core.js:1632
	var s = this.name;
	if( this.phone ) {
		s += ', тел. ' + formatPhone( this.phone );
	}
	return s;
};
                                                            // lib/disp-core.js:1639
                                                            // lib/disp-core.js:1640
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
                                                            // lib/disp-core.js:1651
	assertObj( data, spec );
                                                            // lib/disp-core.js:1653
	for( var k in spec ) this[k] = data[k];
}
                                                            // lib/disp-core.js:1656
Fare.prototype.price = function( distance )
{
	var price = this.start_price + distance / 1000 * this.kilometer_price;
	if( price < this.minimal_price ) {
		price = this.minimal_price;
	}
	return price;
};
                                                            // lib/disp-core.js:1665
                                                            // lib/disp-core.js:1666
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
                                                            // lib/disp-core.js:1680
	for( var k in spec ) this[k] = data[k];
                                                            // lib/disp-core.js:1682
	this.id = data.loc_id;
                                                            // lib/disp-core.js:1684
	this.coords = function() {
		return [this.latitude, this.longitude];
	};
}
                                                            // lib/disp-core.js:1689
                                                            // lib/disp-core.js:1690
// src/obj/order.js
function Order( data )
{
	if( !data ) data = {};
                                                            // lib/disp-core.js:1695
	if( !data.status ) {
		data.status = this.POSTPONED;
	}
                                                            // lib/disp-core.js:1699
	if( !data.order_uid ) {
		data.order_uid = fmt( "%d-%d", disp.id(), Date.now() );
	}
                                                            // lib/disp-core.js:1703
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
                                                            // lib/disp-core.js:1716
	if( data.dest && ("addr" in data.dest) ) {
		this.dest = {
			addr: new Address( data.dest.addr ),
			loc_id: data.dest.loc_id
		};
	}
	else {
		this.dest = null;
	}
                                                            // lib/disp-core.js:1726
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
                                                            // lib/disp-core.js:1743
	for( var i = 0; i < orderFields.length; i++ )
	{
		var k = orderFields[i];
		this[k] = data[k];
	}
	this.id = this.order_uid;
}
                                                            // lib/disp-core.js:1751
Order.prototype.POSTPONED = 'postponed';
Order.prototype.DROPPED = 'dropped';
Order.prototype.WAITING = 'waiting';
Order.prototype.ASSIGNED = 'assigned';
Order.prototype.ARRIVED = 'arrived';
Order.prototype.STARTED = 'started';
Order.prototype.FINISHED = 'finished';
Order.prototype.CANCELLED = 'cancelled';
                                                            // lib/disp-core.js:1760
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
                                                            // lib/disp-core.js:1773
	var s = this.status;
	if( s == this.POSTPONED && !this.exp_arrival_time ) {
		s = 'waiting';
	}
	return statusNames[s] || this.status;
};
                                                            // lib/disp-core.js:1780
/*
 * Returns true if the order is closed.
 */
Order.prototype.closed = function()
{
	var s = this.status;
	return s == this.DROPPED || s == this.FINISHED || s == this.CANCELLED;
};
                                                            // lib/disp-core.js:1789
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
                                                            // lib/disp-core.js:1802
/*
 * Returns true if the order's status allows changing the address and
 * options.
 */
Order.prototype.canEdit = function()
{
	return (this.status == this.POSTPONED
		|| this.status == this.DROPPED);
};
                                                            // lib/disp-core.js:1812
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
                                                            // lib/disp-core.js:1823
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
                                                            // lib/disp-core.js:1836
Order.prototype.formatAddress = function()
{
	return this.src.addr.format();
};
                                                            // lib/disp-core.js:1841
Order.prototype.formatDestination = function()
{
	return this.dest.addr.format();
};
                                                            // lib/disp-core.js:1846
window.Order = Order;
                                                            // lib/disp-core.js:1848
                                                            // lib/disp-core.js:1849
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
                                                            // lib/disp-core.js:1865
	for( var k in spec ) {
		this[k] = data[k];
	}
                                                            // lib/disp-core.js:1869
	this.id = data.queue_id;
}
                                                            // lib/disp-core.js:1872
Queue.prototype.coords = function() {
	return [this.latitude, this.longitude];
};
                                                            // lib/disp-core.js:1876
                                                            // lib/disp-core.js:1877
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
                                                            // lib/disp-core.js:1888
	for( var k in spec ) {
		this[k] = data[k];
	}
                                                            // lib/disp-core.js:1892
	this.id = this.session_id;
}
                                                            // lib/disp-core.js:1895
                                                            // lib/disp-core.js:1896
// src/orders.js
function initOrders( conn, listeners, data )
{
	var _this = this;
	var orders = {};
	var orderPromises = {};
	var MAX_AGE = 12 * 3600 * 1000;
                                                            // lib/disp-core.js:1904
	initLists();
	setInterval( cleanOrders, 10000 );
	//setInterval( checkReminders, 1000 );
                                                            // lib/disp-core.js:1908
	//--
                                                            // lib/disp-core.js:1910
	function initLists()
	{
		var now = time.utc();
                                                            // lib/disp-core.js:1914
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
                                                            // lib/disp-core.js:1945
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
                                                            // lib/disp-core.js:1961
		keys.forEach( function( id ) {
			var order = orders[id];
			listeners.call( "order-removed", {order: order} );
			delete orders[id];
		});
	}
                                                            // lib/disp-core.js:1968
	//--
                                                            // lib/disp-core.js:1970
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
			'opt_terminal',
			'call_id'
		]);
		return conn.send( 'save-order', data );
	};
                                                            // lib/disp-core.js:1992
	/*
	 * Tells the server to dispatch the order to drivers.
	 */
	this.sendOrder = function( order, driver_id )
	{
		var order_uid = order.order_uid;
		if( typeof driver_id == "undefined" ) {
			driver_id = null;
		}
                                                            // lib/disp-core.js:2002
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
                                                            // lib/disp-core.js:2021
		return p;
	};
                                                            // lib/disp-core.js:2024
	this.cancelOrder = function( uid, reason ) {
		return conn.send( "cancel-order", {
			order_uid: uid,
			reason: reason
		});
	};
                                                            // lib/disp-core.js:2031
	conn.onMessage( "order-created", function( msg )
	{
		var data = msg.data;
		var uid = data.order_uid;
		var o = new Order( data );
                                                            // lib/disp-core.js:2037
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
                                                            // lib/disp-core.js:2054
	var statuses = {
		"taxi-arrived": Order.prototype.ARRIVED,
		"order-started": Order.prototype.STARTED,
		"order-finished": Order.prototype.FINISHED,
		"order-cancelled": Order.prototype.CANCELLED,
		"order-accepted": Order.prototype.ASSIGNED,
		"order-dropped": Order.prototype.DROPPED
	};
                                                            // lib/disp-core.js:2063
	for( var msgname in statuses ) {
		conn.onMessage( msgname, updateOrder );
	}
                                                            // lib/disp-core.js:2067
	function updateOrder( msg )
	{
		var uid = msg.data.order_uid;
		var order = orders[uid];
		if( !order ) {
			console.warn( "Unknown order uid: " + uid );
			return;
		}
                                                            // lib/disp-core.js:2076
		var status = statuses[msg.name];
                                                            // lib/disp-core.js:2078
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
                                                            // lib/disp-core.js:2098
	function failOrderPromise( uid, reason )
	{
		if( !(uid in orderPromises) ) {
			return;
		}
		orderPromises[uid].fail( reason );
		delete orderPromises[uid];
	}
                                                            // lib/disp-core.js:2107
	function fulfilOrderPromise( uid, driver )
	{
		if( !(uid in orderPromises) ) {
			return;
		}
		orderPromises[uid].ok( driver );
		delete orderPromises[uid];
	}
                                                            // lib/disp-core.js:2116
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
                                                            // lib/disp-core.js:2128
	/*
	 * Returns list of all current and some recent orders.
	 */
	this.orders = function() {
		return obj.toArray( orders );
	};
                                                            // lib/disp-core.js:2135
	/*
	 * Returns order with given id, if it is current or recent.
	 */
	this.getOrder = function( uid ) {
		return orders[uid];
	};
}
                                                            // lib/disp-core.js:2143
                                                            // lib/disp-core.js:2144
// src/queues.js
function initQueues( conn, listeners, data )
{
	var queues = {};
	var queueDrivers = {}; // qid => [driver_id, ...]
	var disp = this;
                                                            // lib/disp-core.js:2151
	/*
	 * Group id => group object.
	 */
	var groups = {};
                                                            // lib/disp-core.js:2156
	data.queues.forEach( function( d ) {
		var q = new Queue( d );
		q.subqueues = [];
		queues[q.id] = q;
	});
                                                            // lib/disp-core.js:2162
	var tree = createTree();
	function createTree()
	{
		var Q = {};
		obj.keys( queues ).forEach( function( qid )
		{
			var q = queues[qid];
			var pid = q.parent_id;
                                                            // lib/disp-core.js:2171
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
                                                            // lib/disp-core.js:2182
		var list = [];
		for( var qid in Q ) {
			Q[qid].subqueues = Q[qid].subqueues.sort( function( q1, q2 ) {
				return q1.priority - q2.priority;
			});
			list.push( Q[qid] );
		}
		return list.sort( function( a, b ) { return a.order - b.order } );
	}
                                                            // lib/disp-core.js:2192
	saveAssignments( data.queues_snapshot );
                                                            // lib/disp-core.js:2194
	data.groups.forEach( function( g ) {
		groups[g.group_id] = g;
	});
                                                            // lib/disp-core.js:2198
	var prevSnapshot = [];
                                                            // lib/disp-core.js:2200
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
                                                            // lib/disp-core.js:2211
		queueDrivers = {};
		saveAssignments( data );
		listeners.call( "queue-assignments-changed" );
	});
                                                            // lib/disp-core.js:2216
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
                                                            // lib/disp-core.js:2231
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
                                                            // lib/disp-core.js:2242
	/*
	 * Returns queue the driver is in.
	 */
	this.getDriverQueue = function( driverId )
	{
		var loc = driverPosition( driverId );
		if( !loc ) return null;
		return queues[loc.qid];
	};
                                                            // lib/disp-core.js:2252
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
                                                            // lib/disp-core.js:2263
	this.getQueue = function( queueId ) {
		return queues[queueId];
	};
                                                            // lib/disp-core.js:2267
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
                                                            // lib/disp-core.js:2280
	this.restoreDriverQueue = function( driver_id )
	{
		return conn.send( 'restore-queue', {
			driver_id: driver_id
		});
	};
                                                            // lib/disp-core.js:2287
	this.assignDriverQueue = function( driver_id, qid, pos )
	{
		if( qid <= 0 ) {
			return this.removeDriverQueue( driver_id );
		}
                                                            // lib/disp-core.js:2293
		return conn.send( 'put-into-queue', {
			driver_id: driver_id,
			queue_id: qid,
			pos: pos
		});
	};
                                                            // lib/disp-core.js:2300
	this.removeDriverQueue = function( driver_id )
	{
		return conn.send( 'remove-from-queue', {
			driver_id: driver_id
		});
	};
                                                            // lib/disp-core.js:2307
	this.suggestQueue = function( driver_id, qid, pos )
	{
		return conn.send( 'suggest-queue', {
			driver_id: driver_id,
			queue_id: qid,
			pos: pos
		});
	};
                                                            // lib/disp-core.js:2316
	this.changeQueue = function( qid, min, priority )
	{
		return conn.send( 'change-queue', {
			queue_id: qid,
			min: min,
			priority: priority
		});
	};
                                                            // lib/disp-core.js:2325
	conn.onMessage( 'queue-changed', function( msg )
	{
		var data = msg.data;
		var q = queues[data.queue_id];
		q.min = data.min;
		q.priority = data.priority;
                                                            // lib/disp-core.js:2332
		/*
		 * Resort the queues list since the order has changed.
		 */
		if( q.parent_id ) {
			resortQueueChildren( q );
		}
		listeners.call( "queues-changed" );
	});
                                                            // lib/disp-core.js:2341
	function resortQueueChildren( q )
	{
		var p = queues[q.parent_id];
		var list = p.subqueues;
                                                            // lib/disp-core.js:2346
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
                                                            // lib/disp-core.js:2359
	this.allowedQueues = function( driverId )
	{
		var driver = this.getDriver( driverId );
		var available = groups[driver.group_id].queues.slice();
		return available;
	};
                                                            // lib/disp-core.js:2366
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
                                                            // lib/disp-core.js:2377
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
                                                            // lib/disp-core.js:2390
                                                            // lib/disp-core.js:2391
// src/sessions.js
function initSessions( conn, listeners, data )
{
	var sessions = {};
	var disp = this;
                                                            // lib/disp-core.js:2397
	data.sessions.forEach( function( s ) {
		var id = s.session_id;
		sessions[id] = s;
	});
                                                            // lib/disp-core.js:2402
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
                                                            // lib/disp-core.js:2417
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
                                                            // lib/disp-core.js:2429
	conn.onMessage( 'session-requested', function( msg )
	{
		var req = {
			driver_id: msg.data.driver_id,
			odometer: msg.data.odometer
		};
		listeners.call( 'session-requested', req );
	});
                                                            // lib/disp-core.js:2438
	this.sessionsEnabled = function() {
		return data.service_options.sessions == '1';
	};
                                                            // lib/disp-core.js:2442
	this.sessions = function()
	{
		var list = [];
		for( var k in sessions ) {
			list.push( sessions[k] );
		}
		return list;
	};
                                                            // lib/disp-core.js:2451
	this.sessionRequired = function( driverId )
	{
		if( data.service_options.sessions != '1' ) return false;
		return getDriverSession( driverId ) == null;
	};
                                                            // lib/disp-core.js:2457
	function getDriverSession( driverId )
	{
		for( var id in sessions ) {
			if( sessions[id].driver_id == driverId ) {
				return sessions[id];
			}
		}
		return null;
	};
                                                            // lib/disp-core.js:2467
	this.openSession = function( driver_id, odometer ) {
		return conn.send( 'open-session', {
			driver_id: driver_id,
			odometer: odometer
		});
	};
                                                            // lib/disp-core.js:2474
	this.closeSession = function( driver_id, odometer ) {
		return conn.send( 'close-session', {
			driver_id: driver_id,
			odometer: odometer
		});
	};
}
                                                            // lib/disp-core.js:2482
                                                            // lib/disp-core.js:2483
// src/settings.js
function initSettings( conn, listeners, data )
{
	var settings = {};
                                                            // lib/disp-core.js:2488
	try {
		var s = JSON.parse( data.who.settings );
		settings = obj.merge( settings, s );
	} catch( e ) {
		console.warn( "Could not parse saved settings:", e );
	}
                                                            // lib/disp-core.js:2495
	this.getSetting = function( name, def ) {
		if( name in settings ) return settings[name];
		return def;
	};
                                                            // lib/disp-core.js:2500
	this.changeSetting = function( name, val ) {
		if( settings[name] == val ) return;
		settings[name] = val;
	};
                                                            // lib/disp-core.js:2505
	this.saveSettings = function() {
		return conn.dx().post( 'prefs', {prefs: JSON.stringify( settings )} );
	};
}
                                                            // lib/disp-core.js:2510
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
	var originalPos = "static";
	var originalLeft = "auto";
	var originalTop = "auto";
                                                            // lib/drag.js:106
	function init( event )
	{
		var $t = $( event.target );
		$dragElement = $t;
		originalPos = $dragElement.css( "position" );
		originalLeft = $dragElement.css( "left" );
		originalTop = $dragElement.css( "top" );
		startVec = [event.pageX, event.pageY];
	}
                                                            // lib/drag.js:116
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
                                                            // lib/drag.js:134
		return true;
	}
                                                            // lib/drag.js:137
	/*
	 * Returns square of the distance between points 'vec' and 'pos'.
	 */
	function dist2( vec, pos ) {
		var dx = vec[0] - pos[0];
		var dy = vec[1] - pos[1];
		return dx * dx + dy * dy;
	}
                                                            // lib/drag.js:146
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
                                                            // lib/drag.js:162
	var parentVec = [0, 0];
                                                            // lib/drag.js:164
	/*
	 * Start the dragging.
	 */
	function start( event )
	{
		var $parent = $dragElement.offsetParent();
		var pos = $parent.offset();
		parentVec = [pos.left, pos.top];
                                                            // lib/drag.js:173
		$dragElement.css( "position", "absolute" );
		$container.addClass( "dragging" );
		$dragElement.addClass( "dragged" );
	}
                                                            // lib/drag.js:178
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
                                                            // lib/drag.js:189
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
                                                            // lib/drag.js:200
		$dragElement.css({
			"left": vec[0] + "px",
			"top": vec[1] + "px"
		});
	}
                                                            // lib/drag.js:206
	function cancel( event )
	{
		$dragElement.css({
			"position": originalPos,
			"left": originalLeft,
			"top": originalTop
		});
		$dragElement.removeClass( "dragged" );
		$container.removeClass( "dragging" );
		if( settings.onDragCancel ) {
			settings.onDragCancel( $dragElement.get(0) );
		}
		$dragElement = null;
	}
                                                            // lib/drag.js:221
	function finish( event )
	{
		var $t = $( event.target );
		if( $t.get(0) == $dragElement.parent().get(0) ) {
			cancel( event );
			return;
		}
                                                            // lib/drag.js:229
		if( !$t.is( settings.landsSelector ) ) {
			$t = $t.parents( settings.landsSelector ).eq(0);
		}
                                                            // lib/drag.js:233
		var ok = true;
		if( settings.onDragEnd ) {
			ok = settings.onDragEnd( $dragElement.get(0), $t.get(0) );
		}
                                                            // lib/drag.js:238
		if( ok ) {
			$t.append( $dragElement );
		}
                                                            // lib/drag.js:242
		$dragElement.css({
			"position": originalPos,
			"left": originalLeft,
			"top": originalTop
		});
		$dragElement.removeClass( "dragged" );
		$container.removeClass( 'dragging' );
		$dragElement = null;
	}
}


// lib/dx.js
function DX( baseUrl )
{
	this.get = function( path, args )
	{
		var url = baseUrl + '/' + path;
		if( args ) {
			url += argString( args );
		}
		return http.get( url ).then( check );
	};
                                                            // lib/dx.js:11
	this.post = function( path, data )
	{
		var url = baseUrl + '/' + path;
		return http.post( url, data ).then( check );
	};
                                                            // lib/dx.js:17
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
                                                            // lib/dx.js:29
	function check( data )
	{
		if( data.errno ) {
			throw data.errstr;
		}
		return data.data;
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
				m.precision += template.charAt(pos++);
			}
		}
                                                            // lib/fmt.js:80
		if( pos < n )
		{
			var ch = template.charAt( pos );
			if( ch == 's' || ch == 'd' || ch == 'f' ) {
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
		if( marker.type == 'f' )
		{
			if( typeof arg == "string" ) {
				arg = parseFloat( arg );
			}
			if( typeof arg != "number" ) {
				throw "A number is expected for %f format";
			}
                                                            // lib/fmt.js:134
			if( marker.width >= 0 || marker.flags ) {
				throw "Format %f is not fully supported";
			}
			if( marker.precision >= 0 ) {
				return arg.toFixed( marker.precision );
			}
			return arg;
		}
                                                            // lib/fmt.js:143
		return null;
	}
                                                            // lib/fmt.js:146
	function isDigit( ch ) {
		return ch.length == 1 && "0123456789".indexOf( ch ) >= 0;
	}
	return fmt;
})();
                                                            // lib/fmt.js:152
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
 * Replaces decimal point with locale equivalent.
 */
function formatNumber( n )
{
	return n.toString().replace( '.', ',' );
}
                                                            // lib/format.js:49
/*
 * Formats unixtime as "day.month.year hours:minutes".
 */
function formatDateTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );
                                                            // lib/format.js:57
	return fmt( "%02d.%02d.%d %02d:%02d",
		d.getDate(),
		d.getMonth() + 1,
		d.getFullYear(),
		d.getHours(),
		d.getMinutes()
	);
}
                                                            // lib/format.js:66
/*
 * Format a number of seconds as a time period.
 */
function formatSeconds( sec )
{
	var min = Math.floor( sec / 60 );
	sec %= 60;
                                                            // lib/format.js:74
	var hour = Math.floor( min / 60 );
	min %= 60;
                                                            // lib/format.js:77
	var values = [ hour, min, sec ];
	var units = [ "ч", "мин.", "с" ];
                                                            // lib/format.js:80
	if( !values[0] ) {
		values.shift();
		units.shift();
	}
                                                            // lib/format.js:85
	var s = [];
	for( var i = 0; i < values.length; i++ ) {
		s.push( values[i] + ' ' + units[i] );
	}
	return s.join( ' ' );
}
                                                            // lib/format.js:92
function formatNumber( n, thousandsSep )
{
	if( n == 0 ) return '0';
	if( typeof thousandsSep == "undefined" ) {
		thousandsSep = " ";
	}
                                                            // lib/format.js:99
	var minus = n < 0;
	if( minus ) n *= -1;
                                                            // lib/format.js:102
	var groups = [];
	while( n > 0 )
	{
		var lastThree = (n % 1000).toString();
		n = Math.floor( n / 1000 );
                                                            // lib/format.js:108
		if( n > 0 ) {
			while( lastThree.length < 3 ) {
				lastThree = '0' + lastThree;
			}
		}
		groups.unshift( lastThree );
	}
	var s = minus ? '-' : '';
	return s + groups.join( thousandsSep );
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
			27: "esc",
			33: "pgup",
			34: "pgdn",
			36: "home",
			37: "left",
			38: "up",
			39: "right",
			40: "down",
			45: "ins",
			46: "del"
		};
		if( code in specialKeys ) {
			return specialKeys[code];
		}
                                                            // lib/hotkeys.js:71
		var code_a = 65;
		var code_z = code_a + 25;
                                                            // lib/hotkeys.js:74
		if( code < code_a || code > code_z ) {
			return null;
		}
                                                            // lib/hotkeys.js:78
		return String.fromCharCode( 'z'.charCodeAt(0) - (code_z - code) );
	}
                                                            // lib/hotkeys.js:81
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
                                                            // lib/hotkeys.js:95
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
                                                            // lib/hotkeys.js:106
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
	html.escape = function( s )
	{
		if( s === null ) return s;
		return s.toString().replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );
	};
                                                            // lib/html.js:12
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
                                                            // lib/html.js:24
	html.select = function( label, options, value, name )
	{
		var id = genId();
		var html = '<label for="'+id+'">'+label+'</label>';
		html += '<select';
		html += ' id="'+id+'"';
		if( name ) html += ' name="'+name+'"';
		if( value ) html += ' value="'+value+'"';
		html += '>';
                                                            // lib/html.js:34
		for( var value in options ) {
			var title = options[value];
			html += '<option value="'+value+'">' + title + '</option>';
		}
		html += '</select>';
		return html;
	};
                                                            // lib/html.js:42
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
                                                            // lib/html.js:55
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
                                                            // lib/html.js:67
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
                                                            // lib/html.js:93
	var ids = 0;
	function genId() {
		return "--id-" + (++ids);
	}
                                                            // lib/html.js:98
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


// lib/http.js
"use strict";
                                                            // lib/http.js:2
var http = (function()
{
	var http = {};
                                                            // lib/http.js:6
	/*
	 * Creates urls. "vars" is a dict with query vars. "base" can have
	 * variables in it too.
	 * Example: createURL( '/?v=json&b=mapdata', {p: bounds, lat: ...} )
	 */
	http.createURL = function( base, vars )
	{
		var url = base;
		var haveQ = url.indexOf( '?' ) != -1;
                                                            // lib/http.js:16
		for( var i in vars )
		{
			if( typeof vars[i] == "undefined" ) continue;
                                                            // lib/http.js:20
			if( !haveQ ) {
				url += '?';
				haveQ = true;
			} else {
				url += '&';
			}
                                                            // lib/http.js:27
			url += i + "=" + encodeURIComponent( vars[i] );
		}
		return url;
	};
                                                            // lib/http.js:32
	http.get = function( url ) {
		return promise( $.get( url ) );
	};
                                                            // lib/http.js:36
	http.post = function( url, data ) {
		return promise( $.post( url, data ) );
	};
                                                            // lib/http.js:40
	/*
	 * Converts jQuery deferred/jqXHR/whatever-it's-called-now to a
	 * Promise object with additional 'abort' function.
	 */
	function promise( jp )
	{
		var p = new Promise( function( ok, fail )
		{
			jp.done( ok )
			.fail( function( jqr, status, error ) {
				if( error == "" ) error = status;
				fail( error );
			});
		});
		p.abort = function() {
			jp.abort();
		};
		return p;
	}
                                                            // lib/http.js:60
	return http;
})();


// lib/jobs.js
window.jobs = ( function()
{
	var jobs = [];
                                                            // lib/jobs.js:4
	function addJob( func, period )
	{
		period = period || 5000;
		var alarmPeriod = Math.max( period * 2, 10000 );
                                                            // lib/jobs.js:9
		var running = false;
		var id = null;
		var alarm = null;
                                                            // lib/jobs.js:13
		function tick() {
			running = true;
			func(done);
			alarm = setTimeout( warn, alarmPeriod );
		}
                                                            // lib/jobs.js:19
		function done( value )
		{
			running = false;
			clearTimeout( alarm );
			setTimeout( tick, period );
			/*
			 * We don't need the value given to us, but we have to pass
			 * it to the next "promise".
			 */
			return value;
		}
                                                            // lib/jobs.js:31
		function warn() {
			console.error( "The function", func, "is taking too long" );
		}
                                                            // lib/jobs.js:35
		function hurry()
		{
			if( running ) return;
			clearTimeout(id);
			tick();
		}
                                                            // lib/jobs.js:42
		function cancel() {
			clearTimeout( id );
			clearTimeout( alarm );
			running = false;
		}
                                                            // lib/jobs.js:48
		tick();
		var job = {
			hurry: hurry,
			cancel: cancel
		};
		jobs.push(job);
		return job;
	}
                                                            // lib/jobs.js:57
	return {
		/*
		 * Functions added using the "add" function must call back the
		 * "done" function given to them as the first argument. This is
		 * needed for functions doing network request.
		 */
		add: function( func, interval ) {
			return addJob( func, interval );
		},
                                                            // lib/jobs.js:67
		/*
		 * For other functions there is no need in synchronisation, thus
		 * this function which adds the wrapper that calls the done
		 * function allosing the func itself be clean from that.
		 */
		addfunc: function( func, interval ) {
			return addJob( function( done ) {
				done(); func();
			}, interval );
		},
                                                            // lib/jobs.js:78
		get: function() {
			return jobs;
		},
                                                            // lib/jobs.js:82
		clear: function()
		{
			var job;
			while( job = jobs.pop() ) {
				job.cancel();
			}
		}
	};
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
                                                            // lib/layers.js:40
		/*
		 * Register the layer.
		 */
		layers.push( $l );
                                                            // lib/layers.js:45
		/*
		 * Move focus to the new layer.
		 */
		moveFocus( $l );
                                                            // lib/layers.js:50
		var removeListeners = [];
		function remove() {
			removeListeners.forEach( function( f ) {
				f();
			});
			removeListeners = null;
			removeLayer( $l );
		}
                                                            // lib/layers.js:59
		/*
		 * Return a handle for controlling from outside.
		 */
		return {
			remove: remove,
			focus: moveFocus.bind( undefined, $l ),
			blur: $l.removeClass.bind( $l, 'focus' ),
			hasFocus: $l.hasClass.bind( $l, 'focus' ),
			onBlur: $l.on.bind( $l, '-layer-blur' ),
			onFocus: $l.on.bind( $l, '-layer-focus' ),
			onRemove: removeListeners.push.bind( removeListeners )
		};
	};
                                                            // lib/layers.js:73
	function defaultCoords( $l )
	{
		var w = $l.outerWidth();
		var h = $l.outerHeight();
		var W = $win.width();
		var H = $win.height();
                                                            // lib/layers.js:80
		var x = $win.scrollLeft() + (W - w) / 2;
		var y = $win.scrollTop() + (H - h) / 2;
                                                            // lib/layers.js:83
		/*
		 * Shift the layer if there are others.
		 */
		var delta = 20 * layers.length;
		x += delta;
		y += delta;
                                                            // lib/layers.js:90
		/*
		 * Fold the coordinates around the window border.
		 */
		while( x + w > W + $win.scrollLeft() ) {
			x -= W;
		}
		while( y + h > H + $win.scrollTop() ) {
			y -= H;
		}
		if( x < 0 ) x = 0;
		if( y < 0 ) y = 0;
                                                            // lib/layers.js:102
		return [x, y];
	}
                                                            // lib/layers.js:105
	function removeLayer( $l )
	{
		$l.remove();
		var i = layers.indexOf( $l );
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
                                                            // lib/layers.js:121
	/*
	 * When a layer is clicked, move the focus to it.
	 */
	$win.on( 'mousedown', function( event )
	{
		var $l = targetLayer( event );
		if( !$l ) return;
		moveFocus( $l );
	});
                                                            // lib/layers.js:131
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
                                                            // lib/layers.js:149
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
                                                            // lib/layers.js:161
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
                                                            // lib/layers.js:176
	/*
	 * Dragging.
	 */
	var $drag = null;
	var dragOffset = [0, 0];
                                                            // lib/layers.js:182
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
                                                            // lib/layers.js:193
		event.preventDefault();
		var off = $t.offset();
                                                            // lib/layers.js:196
		dragOffset = [
			event.pageX - off.left,
			event.pageY - off.top
		];
		$drag = $t;
		$drag.addClass( "dragging" );
	});
                                                            // lib/layers.js:204
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
                                                            // lib/layers.js:217
	$win.on( 'mouseup', function() {
		if( !$drag ) return;
		$drag.removeClass( "dragging" );
		$drag = null;
	});
                                                            // lib/layers.js:223
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


// lib/map.js
"use strict";
//
// Map widget.
// mapContainer should be a link to DOMElement
//
function Map( mapContainer )
{
	this.container = mapContainer;
                                                            // lib/map.js:9
	var minskCenter = new L.LatLng( 53.88937, 27.56401 );
                                                            // lib/map.js:11
	// Create the Leaflet instance.
	this.leaflet = L.map( mapContainer, {
		center: minskCenter,
		zoom: 11,
		zoomControl: false,
		attributionControl: false // hide credits
	});
                                                            // lib/map.js:19
	// Add a map layer to the Leaflet.
	var proto = location.protocol;
	if( proto == 'file:' ) {
		proto = 'https:';
	}
	var osm = new L.TileLayer(
		proto + "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			minZoom: 7, maxZoom: 18,
			attribution: "Map data © OpenStreetMap contributors"
		}
	);
	this.leaflet.addLayer(osm);
                                                            // lib/map.js:32
	this.markers = {};
}
                                                            // lib/map.js:35
Map.prototype.addZoomControl = function( pos ) {
	var settings = pos ? {position: pos} : {}
	L.control.zoom(settings).addTo( this.leaflet );
};
                                                            // lib/map.js:40
Map.prototype.panTo = function( latitude, longitude ){
	this.leaflet.panTo( [latitude, longitude] );
};
                                                            // lib/map.js:44
Map.prototype.moveMarker = function( markerName, lat, lon ){
	this.markers[markerName].setLatLng( [ lat, lon ] );
};
                                                            // lib/map.js:48
Map.prototype.setMarker = function( markerName, lat, lon, options )
{
	if( typeof this.markers[markerName] != "undefined" ){
		this.removeMarker( markerName );
	}
                                                            // lib/map.js:54
	if( typeof( options ) == "string" ){
		options = {
			"title": options
		};
	} else {
		options = options || {};
	}
                                                            // lib/map.js:62
	var leafletOptions = {};
                                                            // lib/map.js:64
	var leafletOptionNames = [ "title" ];
	for( var i = 0; i < leafletOptionNames.length; i++ )
	{
		var k = leafletOptionNames[i];
		if( options[k] ){
			leafletOptions[k] = options[k];
		}
	}
                                                            // lib/map.js:73
	if( options.icon ) {
		leafletOptions.icon = options.icon;
	}
                                                            // lib/map.js:77
	var pos = new L.LatLng( lat, lon );
	var marker = new L.Marker( pos, leafletOptions );
	marker.addTo( this.leaflet );
                                                            // lib/map.js:81
	if( options.tooltip ){
		marker.bindPopup( options.tooltip ).openPopup();
	}
                                                            // lib/map.js:85
	if( options.onclick ){
		marker.on( "click", options.onclick );
	}
                                                            // lib/map.js:89
	if( options.events ){
		for( var name in options.events ){
			marker.on( name, options.events[name] );
		}
	}
                                                            // lib/map.js:95
	this.markers[markerName] = marker;
	return marker;
};
                                                            // lib/map.js:99
Map.prototype.removeMarker = function( markerName )
{
	if( typeof this.markers[markerName] == "undefined" ){
		return;
	}
	this.leaflet.removeLayer( this.markers[markerName] );
	delete this.markers[markerName];
};
                                                            // lib/map.js:108
Map.prototype.removeMarkersByPrefix = function( prefix )
{
	for( var markerName in this.markers ) {
		if( markerName.indexOf( prefix ) == 0 ) {
			this.removeMarker( markerName );
		}
	}
};
                                                            // lib/map.js:117
Map.prototype.removeAllMarkers = function()
{
	for( var markerName in this.markers ){
		this.removeMarker( markerName );
	}
};
                                                            // lib/map.js:124
Map.prototype.getMarkersList = function()
{
	var list = [];
	for( var name in this.markers ){
		list.push( name );
	}
	return list;
};
                                                            // lib/map.js:133
Map.prototype.getMarkerCoordinates = function( name )
{
	if( !name in this.markers ){
		return null;
	}
                                                            // lib/map.js:139
	var m = this.markers[name];
	var c = m.getLatLng();
	return [ c.lat, c.lng ];
};
                                                            // lib/map.js:144
Map.prototype.setPath = function( points )
{
	if( typeof( this.path ) == "undefined" ){
		this.path = new L.polyline( points, { color: "blue" } );
		this.path.addTo( this.leaflet );
	}
	else {
		this.path.setLatLngs( points );
	}
};
Map.prototype.fitPath = function()
{
	this.leaflet.fitBounds( this.path.getBounds() );
};
                                                            // lib/map.js:159
Map.prototype.fitBounds = function( minLat, maxLat, minLon, maxLon )
{
	this.leaflet.fitBounds([
		[minLat, minLon],
		[maxLat, maxLon]
	]);
};
                                                            // lib/map.js:167
/*
 * Returns object {minLat, maxLat, minLon, maxLon}.
 */
Map.prototype.getBounds = function()
{
	var b = this.leaflet.getBounds();
	var nw = b.getNorthWest();
	var se = b.getSouthEast();
                                                            // lib/map.js:176
	return {
		minLat: se.lat,
		maxLat: nw.lat,
		minLon: nw.lng,
		maxLon: se.lng
	};
};
                                                            // lib/map.js:184
Map.prototype.addEventListener = function( type, listener )
{
	this.leaflet.on( type, listener );
};
                                                            // lib/map.js:189
Map.prototype.getZoom = function(){
	return this.leaflet.getZoom();
};
                                                            // lib/map.js:193
Map.prototype.setZoom = function( zoom ){
	this.leaflet.setZoom( zoom );
};


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
			if( bounds.error ) {
				bounds = null;
			}
                                                            // lib/mapdata.js:46
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
                                                            // lib/mapdata.js:58
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
                                                            // lib/mapdata.js:70
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
                                                            // lib/mapdata.js:84
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
                                                            // lib/mapdata.js:98
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
                                                            // lib/mapdata.js:115
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


// lib/sounds.js
window.sounds = (function()
{
	var sounds = {};
                                                            // lib/sounds.js:4
	/*
	 * Overall volume.
	 */
	var generalVolume = 0.5;
	/*
	 * List of allocated sounds.
	 */
	var tracks = [];
                                                            // lib/sounds.js:13
	sounds.vol = function( newVolume )
	{
		if( typeof newVolume == "undefined" ) {
			return generalVolume;
		}
		generalVolume = clip( newVolume );
                                                            // lib/sounds.js:20
		tracks.forEach( function( t ) {
			t.sound.volume = t.volume * generalVolume;
		});
	};
                                                            // lib/sounds.js:25
	/*
	 * Created and returns a "sound track".
	 */
	sounds.track = function( url, volume )
	{
		if( typeof volume == "undefined" ) {
			volume = 1.0;
		} else {
			volume = clip( volume );
		}
                                                            // lib/sounds.js:36
		var s = new Audio();
		s.preload = "auto";
		s.src = url;
		s.volume = volume * generalVolume;
                                                            // lib/sounds.js:41
		var track = {
			sound: s,
			volume: volume
		};
                                                            // lib/sounds.js:46
		tracks.push( track );
		return new SoundTrack( track );
	};
                                                            // lib/sounds.js:50
	function SoundTrack( track )
	{
		var s = track.sound;
                                                            // lib/sounds.js:54
		this.play = s.play.bind( s );
		this.stop = function() {
			s.pause();
			s.currentTime = 0;
		};
		this.vol = function( newVol )
		{
			if( typeof newVol == "undefined" ) {
				return track.volume;
			}
			newVol = clip( newVol );
			track.volume = newVol;
			track.sound.volume = track.volume * generalVolume;
		};
	};
                                                            // lib/sounds.js:70
	function clip( volume ) {
		if( volume < 0.0 || volume > 1.0 ) {
			console.warn( "The volume must be between 0.0 and 1.0,", volume, "given" );
			if( volume < 0.0 ) volume = 0.0;
			else if( volume > 1.0 ) volume = 1.0;
		}
		return volume;
	}
                                                            // lib/sounds.js:79
	return sounds;
})();


// lib/table.js
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
                                                            // lib/table.js:13
	var $tbody = $( '<tbody></tbody>' );
	$table.append( $tbody );
                                                            // lib/table.js:16
	var s = '';
                                                            // lib/table.js:18
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
                                                            // lib/table.js:30
	function escapeHTML( s )
	{
		if( s === null ) {
			return s;
		}
		return s.toString().replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );
	}
                                                            // lib/table.js:40
	this.show = function()
	{
		$tbody.html( s );
		s = '';
	};
                                                            // lib/table.js:46
	this.empty = function()
	{
		$tbody.empty();
		s = '';
	};
                                                            // lib/table.js:52
	this.appendTo = function( parent ) {
		$table.appendTo( parent );
	};
}


// lib/tabs.js
/*
 * Tabbed widget constructor. 'container' is a reference to the DOM
 * element which will be converted to the widget.
 */
function Tabs( container )
{
	var _this = this;
                                                            // lib/tabs.js:8
	/*
	 * Page "bundles".
	 * Each bundle has fields "$body", "$head" and "obj".
	 */
	var pages = [];
                                                            // lib/tabs.js:14
	/* Index of currently visible page. */
	var currentPageIndex = undefined;
                                                            // lib/tabs.js:17
	/* Array of "change" callbacks. */
	var changeListeners = [];
                                                            // lib/tabs.js:20
	var $container = $( container );
	$container.addClass( 'w-tabs' );
                                                            // lib/tabs.js:23
	var $headsContainer = $( '<div class="w-tabs-heads"></div>' );
	var $bodiesContainer = $( '<div class="w-tabs-bodies"></div>' );
                                                            // lib/tabs.js:26
	init( $container );
                                                            // lib/tabs.js:28
	/*
	 * Construct the widget.
	 */
	function init( $container )
	{
		parseContents( $container );
		$container.append( $headsContainer ).append( $bodiesContainer );
		initEvents();
		setCurrentPage( 0 );
	}
                                                            // lib/tabs.js:39
	/*
	 * Parse the existing markup into pages and tabs.
	 * Assumed: each page is a 'section' element, with an 'h1' element
	 * inside.
	 */
	function parseContents( $container )
	{
		var $sections = $container.children( 'section' );
		$sections.each( function()
		{
			var $header = $(this).children( 'h1' ).eq(0);
			addPage( $header.html(), this );
		});
	}
                                                            // lib/tabs.js:54
	function initEvents()
	{
		$headsContainer.on( 'click', '.w-tabs-head', function()
		{
			var index = getTabIndex( this );
			if( index < 0 ) {
				return;
			}
			setCurrentPage( index );
			triggerChange( index );
		});
	}
                                                            // lib/tabs.js:67
	function triggerChange( index )
	{
		var n = changeListeners.length;
		for( var i = 0; i < n; i++ ) {
			changeListeners[i].call( _this, index );
		}
	}
                                                            // lib/tabs.js:75
	function setCurrentPage( index )
	{
		if( index < 0 || index >= pages.length ) {
			return;
		}
                                                            // lib/tabs.js:81
		if( pages[index].disabled ) {
			return;
		}
                                                            // lib/tabs.js:85
		if( currentPageIndex >= 0 )
		{
			var page = pages[currentPageIndex];
			page.$head.removeClass( 'current' );
			page.$body.hide();
		}
                                                            // lib/tabs.js:92
		currentPageIndex = index;
		var page = pages[currentPageIndex];
		page.$head.addClass( 'current' );
		page.$body.show();
	}
                                                            // lib/tabs.js:98
	/*
	 * Creates a page, adds and returns it.
	 * 'title' is a string, 'container' is a DOM element reference
	 * (optional). 'index' is the position at which the page has to be
	 * created (if omitted, the page will be appended to the end).
	 */
	function addPage( title, container, index )
	{
		if( typeof index == "undefined" ) {
			index = pages.length;
		}
                                                            // lib/tabs.js:110
		/*
		 * Create head and body
		 */
		var $head = $( '<span class="w-tabs-head"></span>' );
		$head.html( title );
		var $body = $( '<div class="w-tabs-body"></div>' );
		if( container ) {
			$body.append( container );
		}
                                                            // lib/tabs.js:120
		var page = {
			$head: $head,
			$body: $body,
			obj: new Page( $head, $body ),
			disabled: false
		}
                                                            // lib/tabs.js:127
		if( index == pages.length )
		{
			$headsContainer.append( $head );
			$bodiesContainer.append( $body );
			pages.push( page );
		}
		else {
			$head.insertBefore( $heads[index] );
			$body.insertBefore( $bodies[index] );
			pages.splice( index, 0, [page] );
		}
                                                            // lib/tabs.js:139
		$body.hide();
		if( typeof currentPageIndex == "undefined" ) {
			setCurrentPage( 0 );
		}
		return page.obj;
	};
                                                            // lib/tabs.js:146
	/*
	 * Finds page index by its tab element reference.
	 */
	function getTabIndex( tabElement )
	{
		var n = pages.length;
		for( var i = 0; i < n; i++ ) {
			if( pages[i].$head.get(0) == tabElement ) {
				return i;
			}
		}
		return -1;
	}
                                                            // lib/tabs.js:160
	/*
	 * Returns number of currently selected page.
	 */
	function getCurrentPage() {
		return currentPageIndex;
	}
                                                            // lib/tabs.js:167
	/*
	 * Returns page object at given index.
	 */
	function getPageAt( index )
	{
		if( index < 0 || index >= pages.length ) {
			return null;
		}
		return pages[index];
	}
                                                            // lib/tabs.js:178
	function disablePage( index )
	{
		if( index < 0 || index >= pages.length ) {
			return;
		}
                                                            // lib/tabs.js:184
		/*
		 * If we are disabling the current page, we have to switch to
		 * any other page which is not disabled.
		 */
		if( currentPageIndex == index )
		{
			/*
			 * If there is no more enabled pages, don't disable this
			 * one.
			 */
			var newIndex = findEnabledPage( index );
			if( newIndex < 0 ) {
				return;
			}
			setCurrentPage( newIndex );
		}
                                                            // lib/tabs.js:201
		var page = pages[index];
		page.disabled = true;
		page.$head.addClass( 'disabled' );
		page.$body.addClass( 'disabled' );
	}
                                                            // lib/tabs.js:207
	function enablePage( index )
	{
		if( index < 0 || index >= pages.length ) {
			return;
		}
                                                            // lib/tabs.js:213
		var page = pages[index];
		page.$head.removeClass( 'disabled' );
		page.$body.removeClass( 'disabled' );
		page.disabled = false;
	}
                                                            // lib/tabs.js:219
	/*
	 * Finds first enabled page index except the given one.
	 */
	function findEnabledPage( except )
	{
		var n = pages.length;
		for( var i = 0; i < n; i++ )
		{
			if( i != except && !pages[i].disabled ) {
				return i;
			}
		}
		return -1;
	}
                                                            // lib/tabs.js:234
	function Page( $head, $body )
	{
		this.setContent = function( html ) {
			$body.html( html );
		};
	}
                                                            // lib/tabs.js:241
	this.onChange = function( func ) {
		changeListeners.push( func );
	};
                                                            // lib/tabs.js:245
	this.addPage = addPage;
	this.setCurrentPage = setCurrentPage;
	this.getCurrentPage = getCurrentPage;
	this.count = function() {
		return pages.length;
	};
                                                            // lib/tabs.js:252
	this.getPageAt = getPageAt;
	this.disablePage = disablePage;
	this.enablePage = enablePage;
}


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


// src/alarm.js
function initAlerts( disp, tabs, mapWidget )
{
	/*
	 * Display alarms that are currently on.
	 */
	disp.driverAlarms().forEach( function( alarm ) {
		/*
		 * Add a highlight to the driver's marker on the map.
		 */
		mapWidget.setClass( alarm.driverId, "alarm" );
	});
                                                            // src/alarm.js:12
	/*
	 * When a driver sends an alarm command, highlight their
	 * icon on the map and show a dialog.
	 */
	disp.on( "driver-alarm-on", function( event )
	{
		var driver = event.data.driver;
		/*
		 * Add a highlight to the driver's marker on the map.
		 */
		mapWidget.setClass( driver.id, "alarm" );
                                                            // src/alarm.js:24
		showDialog( driver );
	});
                                                            // src/alarm.js:27
	disp.on( "driver-alarm-off", function( event )
	{
		var driver = event.data.driver;
		/*
		 * Restore the driver's normal marker.
		 */
		mapWidget.removeClass( driver.id, "alarm" );
	});
                                                            // src/alarm.js:36
	function showDialog( driver )
	{
		var d = new Dialog( "Водитель " + driver.call_id +
			" отправил сигнал тревоги" );
		d.addButton( "Принять", function()
		{
			/*
			 * Switch to the map tab.
			 */
			tabs.setPage( tabs.PAGE_MAP );
                                                            // src/alarm.js:47
			/*
			 * Center the map on the driver.
			 */
			mapWidget.setPosition( driver.coords() );
			mapWidget.setZoom( 13 );
			d.close();
		} );
		d.show();
	}
}


// src/base.js
window.disp = new DispatcherClient();
$( document ).ready( function()
{
	disp.on( "ready", function() {
		initWidgets();
		initReminderScript( disp );
		initCalls( disp );
	});
	disp.on( "connection-error", function( event ) {
		if( event.data.error == "Unauthorised" ) {
			alert( "Ваша сессия была закрыта сервером, перезагрузите страницу." );
			return;
		}
		alert( "Ошибка соединения: " + event.data.error );
	});
	disp.on( "sync", function( event ) {
		alert( "Ваша сессия была закрыта сервером, перезагрузите страницу." );
		return;
	});
});
                                                            // src/base.js:21
function initWidgets()
{
	/*
	 * Status bar and the settings button.
	 */
	var sb = addWidget( StatusBarWidget, "status-bar-container" );
	initSettings( disp, sb );
                                                            // src/base.js:29
	/*
	 * Order button
	 */
	var $b = $( '<button type="button" id="order-button">Создать заказ (insert)</button>' );
	$b.appendTo( $( "#order-button-container" ) );
	$b.on( "click", function() {
		$b.addClass( "active" );
		orderForms.show();
		setTimeout( function() {
			$b.removeClass( "active" );
		}, 100 );
	});
	hotkeys.bind( "ins", function() {
		$b.click();
	});
                                                            // src/base.js:45
	/*
	 * Orders list
	 */
	var orders = addWidget( OrdersWidget, "orders-container" );
	orders.on( "order-click", function( event ) {
		orderForms.show( event.data.order );
	});
	orders.on( "cancel-click", function( event ) {
		showCancelDialog( event.data.order );
	});
                                                            // src/base.js:56
	/*
	 * Tabs
	 */
	initTabs();
}
                                                            // src/base.js:62
function initTabs()
{
	var tabs = addWidget( TabsWidget, "tabs-container" );
	hotkeys.bind( 'alt+m', tabs.next );
                                                            // src/base.js:67
	var monitor = initMonitorWidget( disp, tabs );
	initChat( disp, monitor.qw );
                                                            // src/base.js:70
	var map = new MapWidget( disp );
	tabs.addTab( 'Карта', map.root() );
	tabs.PAGE_MAP = tabs.count() - 1;
                                                            // src/base.js:74
	initAlerts( disp, tabs, map );
                                                            // src/base.js:76
	var dw = new DriversTableWidget( disp );
	tabs.addTab( 'Водители', dw.root() );
                                                            // src/base.js:79
	var orders = new OrdersTableWidget( disp );
	tabs.addTab( 'Заказы', orders.root() );
                                                            // src/base.js:82
	var calc = new CalculatorWidget( disp );
	tabs.addTab( "Калькулятор", calc.root() );
                                                            // src/base.js:85
	if( disp.sessionsEnabled() ) {
		initSessions( disp, tabs );
	}
                                                            // src/base.js:89
	var log = new ServiceLogWidget( disp );
	tabs.addTab( 'Журнал', log.root() );
}
                                                            // src/base.js:93
function addWidget( func, parentId )
{
	var w = new func( disp );
	document.getElementById( parentId ).appendChild( w.root() );
	return w;
}


// src/bookings-reminder.js
function initReminderScript( disp )
{
	var dialog = null;
	var sound = sounds.track( "/res/dispatcher/phone.ogg" );
                                                            // src/bookings-reminder.js:5
	setInterval( check, 5000 );
	/*
	 * Checks if there are postponed orders that have to be processed
	 * now.
	 */
	function check()
	{
		/*
		 * If a dialog is already shown, don't check.
		 */
		if( dialog ) {
			return;
		}
                                                            // src/bookings-reminder.js:19
		var now = time.utc();
		disp.orders().some( function( order )
		{
			if( !order.postponed() ) return false;
                                                            // src/bookings-reminder.js:24
			if( now < order.reminder_time ) {
				return false;
			}
                                                            // src/bookings-reminder.js:28
			return showReminder( order );
		});
	}
                                                            // src/bookings-reminder.js:32
	function showReminder( order )
	{
		/*
		 * If we are editing this order now, don't pop up.
		 */
		if( orderForms.findOrderForm( order ) ) {
			return false;
		}
                                                            // src/bookings-reminder.js:41
		var now = time.utc();
                                                            // src/bookings-reminder.js:43
		dialog = new Dialog( formatOrderDescription( order ) );
		dialog.addButton( "Отправить заказ...", function()
		{
			order.exp_arrival_time = null;
			orderForms.show( order );
			sound.stop();
			dialog.close();
			dialog = null;
		}, "yes" );
                                                            // src/bookings-reminder.js:53
		dialog.addButton( "Напомнить через минуту", function()
		{
			order.reminder_time = now + 60;
			dialog.close();
			dialog = null;
			sound.stop();
			check();
		}, "no" );
                                                            // src/bookings-reminder.js:62
		dialog.show();
		sound.play();
		return true;
	}
                                                            // src/bookings-reminder.js:67
	function formatOrderDescription( order )
	{
		var parts = [];
		parts.push( order.formatAddress() );
                                                            // src/bookings-reminder.js:72
		var loc = disp.getLocation( order.src_loc_id );
		if( loc ) {
			parts.push( '&laquo;' + loc.name + '&raquo;' );
		}
                                                            // src/bookings-reminder.js:77
		if( order.exp_arrival_time ) {
			parts.push( orderPostponeDescription( order ) );
		}
		parts.push( order.formatOptions() );
                                                            // src/bookings-reminder.js:82
		return parts.join( '<br>' );
	}
                                                            // src/bookings-reminder.js:85
	function orderPostponeDescription( order )
	{
		var dt = order.exp_arrival_time - time.utc();
		if( dt >= 0 ) {
			return 'Подать машину в '
				+ formatTime( time.local( order.exp_arrival_time ) )
				+ ' (через ' + formatSeconds( dt ) + ')';
		}
		else {
			return 'Машина должна была быть подана в '
				+ formatTime( time.local( order.exp_arrival_time ) )
				+ ' (' + formatSeconds( -dt ) + ' назад)';
		}
	}
}


// src/calls.js
function initCalls( disp )
{
	// call_id => {form, deviceName, sent}
	var calls = {};
                                                            // src/calls.js:5
	disp.on( 'line-connected', function( event ) {
		toast( "Подсоединена линия: " + event.data.line_id );
	});
                                                            // src/calls.js:9
	disp.on( 'line-disconnected', function( event ) {
		toast( "Линия &laquo;" + event.data.line_id + "&raquo; отключилась" );
	});
                                                            // src/calls.js:13
	disp.on( 'call-accepted', function( event )
	{
		var phone = event.data.caller_id;
		var lineId = event.data.line_id;
		var callId = event.data.call_id;
		var city = event.data.city || disp.param( "default_city" );
		var t = time.local( event.data.time );
                                                            // src/calls.js:21
		/*
		 * Open a new order form and put the client's number in.
		 */
		var order = new Order({
			src: {
				addr: { place: city },
				loc_id: null
			}
		});
		order.call_id = callId;
                                                            // src/calls.js:32
		var form = orderForms.show( order );
		form.setCustomerPhone( phone, true );
		var title = fmt( "%s, поступил в %s, разговор",
			lineId, formatTime( t ) );
		form.setTitle( title, 'speaking' );
                                                            // src/calls.js:38
		calls[callId] = {
			form: form,
			lineId: lineId,
			sent: false,
			time: t
		};
                                                            // src/calls.js:45
		form.on( 'submit', function() {
			calls[callId].sent = true;
		});
                                                            // src/calls.js:49
		form.layer.onRemove( function() {
			delete calls[callId];
		});
	});
                                                            // src/calls.js:54
	disp.on( 'call-ended', function( event )
	{
		var callId = event.data.call_id;
		var call = calls[callId];
		if( !call ) {
			return;
		}
                                                            // src/calls.js:62
		var lineId = call.lineId;
		var form = call.form;
		var t = call.time;
                                                            // src/calls.js:66
		var title = fmt( "%s, поступил в %s, разговор окончен",
			lineId, formatTime( t ) );
		form.setTitle( title, 'hangup' );
                                                            // src/calls.js:70
		/*
		 * If the order hasn't been sent, ask why.
		 */
		if( !call.sent )
		{
			var $c = $( '<div><label>Причина</label><textarea></textarea></div>' );
			var d = new Dialog( $c );
			d.setTitle( "Заказ не отправлен" );
			d.addButton( 'Закрыть', function() {
				var reason = $c.find( 'textarea' ).val();
				d.close();
			});
			d.show();
		}
	});
}


// src/chat/announce-dialog.js
var AnnounceDialog = ( function() {
                                                            // src/chat/announce-dialog.js:2
function AnnounceDialog( disp, drivers )
{
	/*
	 * Put the chat inside a dialog.
	 */
	var $container = $( '<div class="chat-dialog"></div>' );
	var d = new Dialog( $container );
	d.addButton( "Закрыть", function() {
		this.close();
	}, "no" );
	this.show = d.show.bind( d );
                                                            // src/chat/announce-dialog.js:14
	/*
	 * Form elements.
	 */
	initHeader( drivers, $container );
	var output = new Output( disp, $container );
	var input = new Input( disp, $container );
	var phrases = new Phrases( disp, $container );
	/*
	 * Buttons
	 */
	var $reset = $( '<button type="button" class="reset">Очистить</button>' );
	var $phrases = $( '<button type="button" class="phrases">Заготовка</button>' );
	var $send = $( '<button type="button" class="send">Отправить (Ctrl-Enter)</button>' );
	var $buttons = $reset.add( $send ).add( $phrases );
	var $bc = $( '<div class="chat-buttons"></div>' );
	$bc.append( $buttons );
	$container.append( $bc );
                                                            // src/chat/announce-dialog.js:32
	$reset.on( "click", function() {
		input.clear();
	});
                                                            // src/chat/announce-dialog.js:36
	$phrases.on( "click", function() {
		phrases.toggle();
	});
                                                            // src/chat/announce-dialog.js:40
	/*
	 * Send on Ctrl-Enter in the input.
	 */
	input.on( "keypress", function( event ) {
		if( event.keyCode == 13 && event.ctrlKey ) {
			send();
		}
	});
	/*
	 * Send on button click.
	 */
	$send.on( "click", function() {
		send();
	});
	/*
	 * Send on phrase select.
	 */
	phrases.onSelect( function( str ) {
		input.append( str );
	});
                                                            // src/chat/announce-dialog.js:61
	function send()
	{
		var str = input.get();
		if( str == "" ) return;
                                                            // src/chat/announce-dialog.js:66
		disable();
		disp.broadcastChatMessage( drivers, str )
		.then( function() {
			output.add({
				text: str,
				utc: time.utc()
			});
			enable();
			input.clear();
		})
		.catch( function( error ) {
			Dialog.show( error );
			enable();
		});
	}
                                                            // src/chat/announce-dialog.js:82
	function disable()
	{
		output.disable();
		input.disable();
		$buttons.prop( "disabled", true );
	}
                                                            // src/chat/announce-dialog.js:89
	function enable()
	{
		output.enable();
		input.enable();
		$buttons.prop( "disabled", false );
	}
                                                            // src/chat/announce-dialog.js:96
	function initHeader( drivers, $container ) {
		var $h = $( '<div class="header"></div>' );
		var calls = [];
		drivers.forEach( function( id ) {
			var d = disp.getDriver( id );
			if( !d ) {
				console.error( "Unknown driver id: " + id );
				return;
			}
			calls.push( d.call_id );
		});
		$h.html( "Групповое сообщение " + calls.join( ", " ) );
		$container.append( $h );
	}
}
                                                            // src/chat/announce-dialog.js:112
function Input( disp, $container )
{
	var $t = $( '<textarea placeholder="Сообщение"></textarea>' );
	$container.append( $t );
                                                            // src/chat/announce-dialog.js:117
	this.on = function( type, func ) {
		$t.on( type, func );
	};
                                                            // src/chat/announce-dialog.js:121
	this.clear = function() {
		$t.val( "" );
	};
                                                            // src/chat/announce-dialog.js:125
	this.get = function() {
		return $.trim( $t.val() );
	};
                                                            // src/chat/announce-dialog.js:129
	this.append = function( str ) {
		var s = $t.val();
		if( s.length > 0 ) s += " ";
		s += str;
		$t.val( s );
	};
                                                            // src/chat/announce-dialog.js:136
	this.disable = function() {
		$t.prop( "disabled", true );
	};
	this.enable = function() {
		$t.prop( "disabled", false );
	};
}
                                                            // src/chat/announce-dialog.js:144
function Output( disp, $container )
{
	var $c = $( '<div class="output"></div>' );
	$container.append( $c );
                                                            // src/chat/announce-dialog.js:149
	/*
	 * Stop mousedown events to avoid dialog dragging here.
	 */
	$c.on( "mousedown", function( event ) {
		event.stopPropagation();
	});
                                                            // src/chat/announce-dialog.js:156
	var prevTime = 0;
                                                            // src/chat/announce-dialog.js:158
	this.clear = function() {
		prevTime = 0;
		$c.empty();
	};
                                                            // src/chat/announce-dialog.js:163
	this.add = function( message ) {
		if( !prevTime || !sameDay( prevTime, message.utc ) ) {
			writeDate( message.utc );
		}
		prevTime = message.utc;
		writeMessage( message );
		$c.get(0).scrollTop = $c.get(0).scrollHeight;
	};
                                                            // src/chat/announce-dialog.js:172
	this.disable = function() {
		$c.addClass( "disabled" );
	};
                                                            // src/chat/announce-dialog.js:176
	this.enable = function() {
		$c.removeClass( "disabled" );
	};
                                                            // src/chat/announce-dialog.js:180
	function sameDay( utc1, utc2 )
	{
		var d1 = new Date( utc1 * 1000 );
		var d2 = new Date( utc2 * 1000 );
		var same = (d1.getFullYear() == d2.getFullYear() &&
			d1.getMonth() == d2.getMonth() &&
			d1.getDate() == d2.getDate());
		return same;
	}
                                                            // src/chat/announce-dialog.js:190
	function writeDate( utc )
	{
		var d = new Date( time.local( utc ) * 1000 );
		var months = [ "января", "февраля", "марта", "апреля", "мая",
			"июня", "июля", "августа", "сентября", "октября",
			"ноября", "декабря" ];
                                                            // src/chat/announce-dialog.js:197
		$c.append( '<h2 class="date">' + d.getDate() + ' ' +
			months[d.getMonth()] + ' ' + d.getFullYear() + '</h2>' );
	}
                                                            // src/chat/announce-dialog.js:201
	function writeMessage( message )
	{
		var s = fmt( '<article class="dispatcher-broadcast"><p><time>%s</time> %s</p></article>',
			formatTime( time.local( message.utc ) ),
			html.escape( message.text )
		);
		$c.append( s );
	}
}
                                                            // src/chat/announce-dialog.js:211
function Phrases( disp, $container )
{
	var $c = $( '<div class="phrases menu"></div>' );
	var s = '';
	var phrases = disp.param( "phrases_dispatcher" );
	if( !phrases ) phrases = '';
	phrases = phrases.split( "\n" ).map( $.trim ).filter( function( val ) {
		return val != '';
	});
	phrases.forEach( function( str, i ) {
		s += '<div data-id="'+i+'">'+str+'</div>';
	});
	$c.html( s );
	$container.append( $c );
                                                            // src/chat/announce-dialog.js:226
	var onSelect = null;
	$c.on( "click", "div", function( event ) {
                                                            // src/chat/announce-dialog.js:229
		var id = $( this ).data( "id" );
		if( typeof id == "undefined" ) return;
		onSelect( phrases[id] );
		$c.removeClass( "open" );
	});
                                                            // src/chat/announce-dialog.js:235
	this.toggle = function() {
		$c.toggleClass( "open" );
	};
                                                            // src/chat/announce-dialog.js:239
	this.hide = function() {
		$c.removeClass( "open" );
	};
                                                            // src/chat/announce-dialog.js:243
	this.onSelect = function( f ) {
		onSelect = f;
	};
}
                                                            // src/chat/announce-dialog.js:248
return AnnounceDialog;
})();


// src/chat/chat-dialog.js
var ChatDialog = ( function() {
                                                            // src/chat/chat-dialog.js:2
function ChatDialog( disp, driver )
{
	/*
	 * Put the chat inside a dialog.
	 */
	var $container = $( '<div class="chat-dialog"></div>' );
	var d = new Dialog( $container );
	d.addButton( "Закрыть", function() {
		this.close();
	}, "no" );
	this.show = d.show.bind( d );
                                                            // src/chat/chat-dialog.js:14
	this.on = function( type, func ) {
		d.on( type, func );
	};
                                                            // src/chat/chat-dialog.js:18
	/*
	 * Form elements.
	 */
	initHeader( driver, $container );
	var picker = new Picker( disp, $container );
	var output = new Output( disp, $container );
	var input = new Input( disp, $container );
	var phrases = new Phrases( disp, $container );
	/*
	 * Buttons
	 */
	var $reset = $( '<button type="button" class="reset">Очистить</button>' );
	var $phrases = $( '<button type="button" class="phrases">Заготовка</button>' );
	var $send = $( '<button type="button" class="send">Отправить (Ctrl-Enter)</button>' );
	var $buttons = $reset.add( $send ).add( $phrases );
	var $bc = $( '<div class="chat-buttons"></div>' );
	$bc.append( $buttons );
	$container.append( $bc );
                                                            // src/chat/chat-dialog.js:37
	$reset.on( "click", function() {
		input.clear();
	});
                                                            // src/chat/chat-dialog.js:41
	$phrases.on( "click", function() {
		phrases.toggle();
	});
                                                            // src/chat/chat-dialog.js:45
	/*
	 * When the date range is changed, get and display the corresponding
	 * messages.
	 */
	picker.onChange( function( from, to ) {
		disable();
                                                            // src/chat/chat-dialog.js:52
		disp.getChatMessages( driver.id, from, to )
		.then( function( messages ) {
			showMessages( messages );
			enable();
		})
		.catch( function( error ) {
			Dialog.show( error );
			enable();
		});
	});
                                                            // src/chat/chat-dialog.js:63
	/*
	 * Send on Ctrl-Enter in the input.
	 */
	input.on( "keypress", function( event ) {
		if( event.keyCode == 13 && event.ctrlKey ) {
			send();
		}
	});
	/*
	 * Send on button click.
	 */
	$send.on( "click", function() {
		send();
	});
	/*
	 * Send on phrase select.
	 */
	phrases.onSelect( function( str ) {
		input.append( str );
	});
                                                            // src/chat/chat-dialog.js:84
	init();
                                                            // src/chat/chat-dialog.js:86
	/*
	 * Adds the message to the dialog. Returns false if the message
	 * was not actually shown.
	 */
	this.addMessage = function( msg )
	{
		/*
		 * If the message does not belong to this window, ignore.
		 */
		if( msg.from != driver.id && msg.to != driver.id ) {
			console.warn( "The message doesn't belong to this window" );
			return;
		}
		/*
		 * If the message does not fall into the selected time range,
		 * ignore.
		 */
		var range = picker.get();
		if( msg.utc < range[0] || msg.utc > range[1] ) {
			return false;
		}
		output.add( msg );
		return true;
	};
                                                            // src/chat/chat-dialog.js:111
	//--
                                                            // src/chat/chat-dialog.js:113
	function init()
	{
		disable();
		var range = picker.get();
		disp.getChatMessages( driver.id, range[0], range[1] )
		.then( function( messages ) {
			showMessages( messages );
			enable();
		})
		.catch( function( error ) {
			Dialog.show( "Ошибка: " + error );
		});
		enable();
	}
                                                            // src/chat/chat-dialog.js:128
	function send()
	{
		var str = input.get();
		if( str == "" ) return;
                                                            // src/chat/chat-dialog.js:133
		disable();
		disp.sendChatMessage( driver.id, str )
		.then( function() {
			enable();
			input.clear();
		})
		.catch( function( error ) {
			Dialog.show( error );
			enable();
		});
	}
                                                            // src/chat/chat-dialog.js:145
	function showMessages( arr )
	{
		output.clear();
                                                            // src/chat/chat-dialog.js:149
		var lastId = 0;
		arr.forEach( function( msg ) {
			output.add( msg );
			if( msg.from == driver.id ) {
				lastId = msg.id;
			}
		});
                                                            // src/chat/chat-dialog.js:157
		if( lastId ) {
			disp.markChatMessages( driver.id, lastId );
		}
	}
                                                            // src/chat/chat-dialog.js:162
	function disable()
	{
		picker.disable();
		output.disable();
		input.disable();
		$buttons.prop( "disabled", true );
	}
                                                            // src/chat/chat-dialog.js:170
	function enable()
	{
		picker.enable();
		output.enable();
		input.enable();
		$buttons.prop( "disabled", false );
	}
                                                            // src/chat/chat-dialog.js:178
	function initHeader( driver, $container ) {
		var $h = $( '<div class="header"></div>' );
                                                            // src/chat/chat-dialog.js:181
		var call = driver.call_id;
		if( call.match( /^\d+$/ ) ) {
			call += "-м";
		}
		var str = "Чат с " + call;
                                                            // src/chat/chat-dialog.js:187
		str += " (";
                                                            // src/chat/chat-dialog.js:189
		str += driver.name;
		str += ", тел. " + driver.phone;
                                                            // src/chat/chat-dialog.js:192
		var car = disp.getCar( driver.car_id );
		if( !car ) {
			str += ", без автомобиля";
		}
		else {
			str += tpl( ", ?, ?", car.name, car.plate );
		}
		str += ")";
                                                            // src/chat/chat-dialog.js:201
		$h.html( str );
		$container.append( $h );
	}
}
                                                            // src/chat/chat-dialog.js:206
function Picker( disp, $container )
{
	var $c = $( '<div class="picker"></div>' );
	var $prev = $( '<button type="button" class="prev">Прошлая неделя</button>' );
	var $next = $( '<button type="button" class="next">Следующая неделя</button>' );
	var $disp = $( '<span class="range-display"></span>' );
	var $all = $prev.add( $next );
                                                            // src/chat/chat-dialog.js:214
	$c.append( $all );
	$c.append( $disp );
	$container.append( $c );
                                                            // src/chat/chat-dialog.js:218
	var onChange = null;
                                                            // src/chat/chat-dialog.js:220
	var from = new Date();
	var to = new Date();
                                                            // src/chat/chat-dialog.js:223
	fixRange();
                                                            // src/chat/chat-dialog.js:225
	$prev.on( "click", function() {
		from.setDate( from.getDate() - 1 );
		to.setDate( to.getDate() - 7 );
		fixRange();
		callChange();
	});
	$next.on( "click", function() {
		from.setDate( from.getDate() + 7 );
		to.setDate( to.getDate() + 1 );
		fixRange();
		callChange();
	});
                                                            // src/chat/chat-dialog.js:238
	function fixRange()
	{
		toWeekBegin( from );
		toWeekEnd( to );
		$disp.html( tpl( "?—?", formatDate( from ), formatDate( to ) ) );
	}
                                                            // src/chat/chat-dialog.js:245
	function formatDate( d )
	{
		var days = "вс пн вт ср чт пт сб".split( ' ' );
		return fmt( "%02d.%02d.%d %02d:%02d (%s)",
			d.getDate(),
			d.getMonth() + 1,
			d.getFullYear(),
			d.getHours(),
			d.getMinutes(),
			days[d.getDay()]
		);
	}
                                                            // src/chat/chat-dialog.js:258
	function toWeekEnd( d ) {
		/*
		 * d.getDay() + x = 0 + 7i
		 * thus x = 7i - d.getDay()
		 */
		var x = -d.getDay();
		if( x < 0 ) x += 7;
		d.setDate( d.getDate() + x );
		d.setHours( 23, 59, 59, 999 );
	}
                                                            // src/chat/chat-dialog.js:269
	function toWeekBegin( d ) {
		/*
		 * d.getDay() - x = 1 - 7i
		 * thus x = d.getDay() - 1 + 7i, x >= 0
		 */
		var x = d.getDay() - 1;
		if( x < 0 ) x += 7;
		d.setDate( d.getDate() - x );
		d.setHours( 0, 0, 0, 0 );
	}
                                                            // src/chat/chat-dialog.js:280
	function callChange() {
		onChange( time.utcFromDate( from ), time.utcFromDate( to ) );
	}
                                                            // src/chat/chat-dialog.js:284
	this.onChange = function( f ) {
		onChange = f;
	};
                                                            // src/chat/chat-dialog.js:288
	this.enable = function() {
		$all.prop( "disabled", false );
	};
                                                            // src/chat/chat-dialog.js:292
	this.disable = function() {
		$all.prop( "disabled", true );
	};
                                                            // src/chat/chat-dialog.js:296
	this.get = function() {
		return [time.utcFromDate( from ), time.utcFromDate( to )];
	};
}
                                                            // src/chat/chat-dialog.js:301
function Input( disp, $container )
{
	var $t = $( '<textarea placeholder="Сообщение"></textarea>' );
	$container.append( $t );
                                                            // src/chat/chat-dialog.js:306
	this.on = function( type, func ) {
		$t.on( type, func );
	};
                                                            // src/chat/chat-dialog.js:310
	this.clear = function() {
		$t.val( "" );
	};
                                                            // src/chat/chat-dialog.js:314
	this.get = function() {
		return $.trim( $t.val() );
	};
                                                            // src/chat/chat-dialog.js:318
	this.append = function( str ) {
		var s = $t.val();
		if( s.length > 0 ) s += " ";
		s += str;
		$t.val( s );
	};
                                                            // src/chat/chat-dialog.js:325
	this.disable = function() {
		$t.prop( "disabled", true );
	};
	this.enable = function() {
		$t.prop( "disabled", false );
	};
}
                                                            // src/chat/chat-dialog.js:333
function Output( disp, $container )
{
	var $c = $( '<div class="output"></div>' );
	$container.append( $c );
                                                            // src/chat/chat-dialog.js:338
	/*
	 * Stop mousedown events to avoid dialog dragging here.
	 */
	$c.on( "mousedown", function( event ) {
		event.stopPropagation();
	});
                                                            // src/chat/chat-dialog.js:345
	var prevTime = 0;
                                                            // src/chat/chat-dialog.js:347
	this.clear = function() {
		prevTime = 0;
		$c.empty();
	};
                                                            // src/chat/chat-dialog.js:352
	this.add = function( message ) {
		if( !prevTime || !sameDay( prevTime, message.utc ) ) {
			writeDate( message.utc );
		}
		prevTime = message.utc;
		writeMessage( message );
		$c.get(0).scrollTop = $c.get(0).scrollHeight;
	};
                                                            // src/chat/chat-dialog.js:361
	this.disable = function() {
		$c.addClass( "disabled" );
	};
                                                            // src/chat/chat-dialog.js:365
	this.enable = function() {
		$c.removeClass( "disabled" );
	};
                                                            // src/chat/chat-dialog.js:369
	function sameDay( utc1, utc2 )
	{
		var d1 = new Date( utc1 * 1000 );
		var d2 = new Date( utc2 * 1000 );
		var same = (d1.getFullYear() == d2.getFullYear() &&
			d1.getMonth() == d2.getMonth() &&
			d1.getDate() == d2.getDate());
		return same;
	}
                                                            // src/chat/chat-dialog.js:379
	function writeDate( utc )
	{
		var d = new Date( time.local( utc ) * 1000 );
		var months = [ "января", "февраля", "марта", "апреля", "мая",
			"июня", "июля", "августа", "сентября", "октября",
			"ноября", "декабря" ];
                                                            // src/chat/chat-dialog.js:386
		$c.append( '<h2 class="date">' + d.getDate() + ' ' +
			months[d.getMonth()] + ' ' + d.getFullYear() + '</h2>' );
	}
                                                            // src/chat/chat-dialog.js:390
	function writeMessage( message )
	{
		var cn = disp.getDriver( message.from ) ? "driver" : "dispatcher";
		var s = fmt( '<article class="%s"><p><time>%s</time> %s</p></article>',
			cn, formatTime( time.local( message.utc ) ),
			html.escape( message.text )
		);
		$c.append( s );
	}
}
                                                            // src/chat/chat-dialog.js:401
function Phrases( disp, $container )
{
	var $c = $( '<div class="phrases menu"></div>' );
	var s = '';
	var phrases = disp.param( "phrases_dispatcher" );
	if( !phrases ) phrases = '';
	phrases = phrases.split( "\n" ).map( $.trim ).filter( function( val ) {
		return val != '';
	});
	phrases.forEach( function( str, i ) {
		s += '<div data-id="'+i+'">'+str+'</div>';
	});
	$c.html( s );
	$container.append( $c );
                                                            // src/chat/chat-dialog.js:416
	var onSelect = null;
	$c.on( "click", "div", function( event ) {
                                                            // src/chat/chat-dialog.js:419
		var id = $( this ).data( "id" );
		if( typeof id == "undefined" ) return;
		onSelect( phrases[id] );
		$c.removeClass( "open" );
	});
                                                            // src/chat/chat-dialog.js:425
	this.toggle = function() {
		$c.toggleClass( "open" );
	};
                                                            // src/chat/chat-dialog.js:429
	this.hide = function() {
		$c.removeClass( "open" );
	};
                                                            // src/chat/chat-dialog.js:433
	this.onSelect = function( f ) {
		onSelect = f;
	};
}
                                                            // src/chat/chat-dialog.js:438
return ChatDialog;
})();


// src/chat/chat.js
function initChat( disp, qw )
{
	var sound = sounds.track( "/res/dispatcher/chat.ogg" );
	var dialogs = {};
                                                            // src/chat/chat.js:5
	/*
	 * Mark drivers for which there are unread messages in the queues
	 * widget.
	 */
	disp.drivers().forEach( function( driver )
	{
		if( disp.haveNewMessages( driver ) ) {
			qw.addSelection( driver.id, "chat" );
		}
	});
                                                            // src/chat/chat.js:16
	disp.on( "chat-message-received", function( event ) {
		sound.play();
                                                            // src/chat/chat.js:19
		var msg = event.data.message;
		var driver = disp.getDriver( msg.from ) || disp.getDriver( msg.to );
		if( !driver ) {
			return;
		}
		/*
		 * If there is an open chat with the driver, put the message
		 * there.
		 */
		var d = dialogs[driver.id];
		if( d ) {
			/*
			 * If the message has been displayed, mark it as read.
			 */
			if( d.addMessage( msg ) && disp.getDriver( msg.from ) ) {
				disp.markChatMessages( driver.id, msg.id );
			}
		}
	});
                                                            // src/chat/chat.js:39
	disp.on( "chat-front-changed", function( event )
	{
		var driver = event.data.driver;
		if( event.data.unread > 0 ) {
			qw.addSelection( driver.id, "chat" );
		} else {
			qw.removeSelection( driver.id, "chat" );
		}
	});
                                                            // src/chat/chat.js:49
	qw.on( "driver-click", function( event ) {
		if( event.data.button != 2 ) return;
		var driver = event.data.driver;
		if( driver.is_fake == '1' ) {
			return;
		}
		openChat( driver );
	});
                                                            // src/chat/chat.js:58
	function openChat( driver )
	{
		if( driver.id in dialogs ) {
			dialogs[driver.id].focus();
			return;
		}
		var d = new ChatDialog( disp, driver );
		dialogs[driver.id] = d;
		d.show();
		d.on( "close", function() {
			delete dialogs[driver.id];
		});
	}
}


// src/dx.js
var dx = new DX( '/dx/dispatcher' );


// src/order-form/address.js
function AddressGroupSection( $container, type )
{
	var $c = $( '<div></div>' );
	$container.append( $c );
                                                            // src/order-form/address.js:5
	/*
	 * Subforms for three address types.
	 */
	var fromQueue = new QueueSection( disp, $c );
	var fromObject = new ObjectSection( disp, $c );
	var from = new AddressSection( disp, $c, type );
                                                            // src/order-form/address.js:12
	from.onChange( function( addr ) {
		fromQueue.set( null );
		fromObject.set( null );
	});
                                                            // src/order-form/address.js:17
	fromQueue.onChange( function( loc ) {
		fromObject.set( null );
		from.set( loc ? loc.addr : null );
	});
                                                            // src/order-form/address.js:22
	fromObject.onChange( function( loc ) {
		from.set( loc ? loc.addr : null );
		fromQueue.set( null );
	});
                                                            // src/order-form/address.js:27
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
                                                            // src/order-form/address.js:38
	this.set = function( spec )
	{
		from.set( spec.addr );
		fromQueue.set( locQueue(spec.loc_id) );
	};
                                                            // src/order-form/address.js:44
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
                                                            // src/order-form/address.js:55
	this.setQueue = function( qid )
	{
		fromQueue.set( qid );
		var loc = fromQueue.get();
		if( loc ) {
			fromObject.set( loc );
			from.set( loc.addr );
		}
	};
                                                            // src/order-form/address.js:65
	this.slideToggle = function() {
		$c.slideToggle( 'fast' );
	};
                                                            // src/order-form/address.js:69
	this.hide = function() {
		$c.hide();
	};
}
                                                            // src/order-form/address.js:74
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
                                                            // src/order-form/address.js:86
	var $s = $( s );
	$container.append( $c );
	$c.append( $s );
                                                            // src/order-form/address.js:90
	var $city = $s.find( '.city' );
	var $street = $s.find( '.street' );
	var $house = $s.find( '.house' );
	var $building = $s.find( '.building' );
	var $entrance = $s.find( '.entrance' );
	var $apartment = $s.find( '.apartment' );
                                                            // src/order-form/address.js:97
	$city.val( disp.param( "default_city" ) );
	$city.autocomplete( mapdata.getPlaceSuggestions );
	$street.autocomplete( function( term, callback ) {
		mapdata.getStreetSuggestions( term, $city.val(), callback );
	});
                                                            // src/order-form/address.js:103
	var $all = $s.find( 'input' );
	var callback = null;
                                                            // src/order-form/address.js:106
	$all.on( "change", function() {
		if( !callback ) return;
		callback( getAddr() );
	});
                                                            // src/order-form/address.js:111
	this.get = getAddr;
                                                            // src/order-form/address.js:113
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
                                                            // src/order-form/address.js:125
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
                                                            // src/order-form/address.js:145
	this.onChange = function( f ) {
		callback = f;
	};
}
                                                            // src/order-form/address.js:150
function QueueSection( disp, $container )
{
	var $c = $( '<div><label>Объект (к)</label></div>' );
                                                            // src/order-form/address.js:154
	var s = '<select class="queue-loc"><option value=""></option>';
	disp.queues().forEach( function( q ) {
		if( !q.loc_id ) return;
		s += '<option value="'+q.id+'">'+q.name+'</option>';
	});
	s += '</select>';
	var $s = $(s);
                                                            // src/order-form/address.js:162
	$container.append( $c );
	$c.append( $s );
                                                            // src/order-form/address.js:165
	var callback = null;
                                                            // src/order-form/address.js:167
	$s.on( "change", function() {
		var loc = disp.getQueueLocation( this.value );
		callback( loc );
	});
                                                            // src/order-form/address.js:172
	this.onChange = function( f ) {
		callback = f;
	};
                                                            // src/order-form/address.js:176
	this.get = function() {
		return disp.getQueueLocation( $s.val() );
	};
                                                            // src/order-form/address.js:180
	this.set = function( id ) {
		$s.val( id );
	};
}
                                                            // src/order-form/address.js:185
function ObjectSection( disp, $container )
{
	var $c = $( '<div><label>Объект</label></div>' );
	var $s = $( '<input class="loc">' );
                                                            // src/order-form/address.js:190
	$container.append( $c );
	$c.append( $s );
                                                            // src/order-form/address.js:193
	var callback = null;
	var location = null;
                                                            // src/order-form/address.js:196
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
                                                            // src/order-form/address.js:217
	this.onChange = function( f ) {
		callback = f;
	};
                                                            // src/order-form/address.js:221
	this.get = function() {
		return location;
	};
                                                            // src/order-form/address.js:225
	this.set = function( loc ) {
		location = loc;
		$s.val( loc ? loc.name : "" );
	};
}


// src/order-form/customer.js
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
                                                            // src/order-form/customer.js:11
	var $phone = $s.find( "input" ).eq(0);
	var $name = $s.find( "input" ).eq(1);
	var $button = $s.find( "button" ).eq(0);
	$button.prop( "disabled", true );
                                                            // src/order-form/customer.js:16
	this.get = function() {
		return {
			customer_phone: getPhone(),
			customer_name: $name.val()
		};
	};
                                                            // src/order-form/customer.js:23
	var addresses = [];
	var onAddress = null;
                                                            // src/order-form/customer.js:26
	this.onAddress = function( func ) {
		onAddress = func;
	};
                                                            // src/order-form/customer.js:30
	$button.on( "click", function() {
		var s = '<div class="menu">';
		addresses.forEach( function( addr, i ) {
			s += '<div data-id="'+i+'">'+addr.format()+'</div>';
		});
		s += '</div>';
                                                            // src/order-form/customer.js:37
		var $c = $( s );
		var d = new Dialog( $c.get(0) );
		d.setTitle( "Адреса клиента" );
		d.addButton( "Закрыть", null, "no" );
		d.show();
                                                            // src/order-form/customer.js:43
		$c.on( "click", "div", function() {
			var i = $(this).data( "id" );
			if( typeof i == "undefined" ) return;
			if( onAddress ) onAddress( addresses[i] );
			d.close();
		});
	});
                                                            // src/order-form/customer.js:51
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
                                                            // src/order-form/customer.js:69
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
                                                            // src/order-form/customer.js:90
	this.set = function( order )
	{
		var phone = order.customer_phone;
		var name = order.customer_name;
		if( phone ) {
			$phone.val( formatPhone( phone ) );
		}
		$name.val( name );
	};
                                                            // src/order-form/customer.js:100
	this.setPhone = function( phone, trigger )
	{
		$phone.val( phone );
		$name.val( '' );
		if( trigger ) {
			$phone.trigger( 'change' );
		}
	};
}


// src/order-form/drivers.js
function DriverSection( $container )
{
	var s = '<select class="driver"><option value="0">Выбрать автоматически</option>';
	disp.drivers().forEach( function( d ) {
		s += tpl( '<option value="?">? - ?</option>',
			d.id, d.call_id, d.surname() );
	});
	s += '</select>';
	var $select = $( s );
                                                            // src/order-form/drivers.js:10
	$container.append( '<label>Водитель</label>' );
	$container.append( $select );
                                                            // src/order-form/drivers.js:13
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
                                                            // src/order-form/drivers.js:26
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
                                                            // src/order-form/drivers.js:40
	$class = $class.filter( "select" );
                                                            // src/order-form/drivers.js:42
	this.get = function() {
		return {
			opt_car_class: $class.val(),
			opt_vip: $vip.is( ':checked' )? '1' : '0',
			opt_terminal: $term.is( ':checked' )? '1' : '0'
		};
	};
                                                            // src/order-form/drivers.js:50
	this.set = function( order ) {
		$class.val( order.opt_car_class );
		$vip.prop( 'checked', order.opt_vip == '1' );
		$term.prop( 'checked', order.opt_terminal == '1' );
	};
                                                            // src/order-form/drivers.js:56
	this.disable = function() {
		$class.val( "" );
		$vip.add( $term ).prop( "checked", false );
		$s.find( 'input, select' ).prop( "disabled", true );
		$s.slideUp( "fast" );
	};
                                                            // src/order-form/drivers.js:63
	this.enable = function() {
		$s.find( 'input, select' ).prop( "disabled", false );
		$s.slideDown( "fast" );
	};
}


// src/order-form/forms.js
var orderForms = (function() {
                                                            // src/order-form/forms.js:2
	var currentForms = [];
                                                            // src/order-form/forms.js:4
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
                                                            // src/order-form/forms.js:18
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
                                                            // src/order-form/forms.js:29
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
                                                            // src/order-form/forms.js:43
		/*
		 * When the form's "cancel" button is clicked, remove the layer.
		 */
		form.on( "cancel", function() {
			closeForm();
		});
                                                            // src/order-form/forms.js:50
		/*
		 * When the form is submitted, save the order.
		 */
		form.on( "submit", function( event )
		{
			order = event.data.order;
			var driverId = event.data.driverId;
			var driver = disp.getDriver( driverId );
                                                            // src/order-form/forms.js:59
			if( order.src.addr.isEmpty() && !order.src.loc_id ) {
				Dialog.show( "Не указано место подачи" );
				return;
			}
                                                            // src/order-form/forms.js:64
			if( driver && !driver.online() ) {
				(new Dialog( "Выбранный водитель сейчас не на связи" )).show();
				return;
			}
                                                            // src/order-form/forms.js:69
			if( driver && disp.sessionRequired( driverId ) ) {
				(new Dialog( "Выбранный водитель не вышел на смену" )).show();
				return;
			}
                                                            // src/order-form/forms.js:74
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
					// TODO: fix the core and the server so that the
					// order object we have is actually used and updated
					// (the core just creates a new one when receiving
					// order-created).
					order = disp.getOrder( order.order_uid );
					var car = disp.getDriverCar( assignedDriver.id );
					var text = orderDesc( order, assignedDriver, car );
					(new Dialog( text )).show();
				});
			}
                                                            // src/order-form/forms.js:104
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
                                                            // src/order-form/forms.js:130
				var d = new Dialog( msg );
				d.addButton( "OK", function() {
					d.close();
					form.unlock();
					layer.focus();
				}, "yes" );
				d.show();
			});
		});
                                                            // src/order-form/forms.js:140
		return form;
	}
                                                            // src/order-form/forms.js:143
	/*
	 * Returns a string describing an assigned order.
	 */
	function orderDesc( order, driver, car )
	{
		var info = [];
                                                            // src/order-form/forms.js:150
		var loc = disp.getLocation( order.src_loc_id );
		if( loc ) {
			info.push( '&laquo;' + loc.name + '&raquo;' );
		}
		info.push( order.formatAddress() );
		info.push( 'Водитель &mdash; ' + driver.call_id );
		info.push( car.format() );
                                                            // src/order-form/forms.js:158
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
                                                            // src/order-form/forms.js:172
	function getFocusForm()
	{
		return currentForms.find( function( f ) {
			return f.layer.hasFocus();
		});
	}
                                                            // src/order-form/forms.js:179
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
                                                            // src/order-form/forms.js:190
	function findOrderForm( order )
	{
		var i = formIndex( order );
		return (i == -1)? null : currentForms[i];
	}
                                                            // src/order-form/forms.js:196
	return {
		show: show,
		getFocusForm: getFocusForm,
		findOrderForm: findOrderForm
	};
})();


// src/order-form/order-form.js
var OrderForm = ( function() {
                                                            // src/order-form/order-form.js:2
function OrderForm( order )
{
	var listeners = new Listeners([
		"cancel",
		"submit"
	]);
	this.on = listeners.add.bind( listeners );
                                                            // src/order-form/order-form.js:10
	var $container = $( '<form class="order-form"></form>' );
	/*
	 * Form title, for order number.
	 */
	var $title = $( '<div class="title"></div>' );
	$container.append( $title );
                                                            // src/order-form/order-form.js:17
	var driver = new DriverSection( div() );
	var options = new OptionsSection( div() );
	var customer = new CustomerSection( div() );
                                                            // src/order-form/order-form.js:21
	$container.append( '<b>Место подачи</b>' );
	var from = new AddressGroupSection( $container );
                                                            // src/order-form/order-form.js:24
	var $toHeader = $( '<b>Место назначения</b>' );
	$container.append( $toHeader );
	var to = new AddressGroupSection( div( 'dest-section' ), 'dest' );
	$toHeader.on( 'click', function() {
		to.slideToggle();
		$toHeader.toggleClass( 'more' );
	});
	to.hide();
	$toHeader.addClass( 'more' );
                                                            // src/order-form/order-form.js:34
	var postpone = new PostponeSection( div() );
                                                            // src/order-form/order-form.js:36
	/*
	 * When a driver is specified, turn the options off.
	 */
	driver.onChange( syncOptions );
                                                            // src/order-form/order-form.js:41
	customer.onAddress( function( addr ) {
		from.set({addr: addr, loc_id: null});
	});
                                                            // src/order-form/order-form.js:45
	this.setDriver = function( id ) {
		driver.set( id );
		syncOptions();
	};
                                                            // src/order-form/order-form.js:50
	function syncOptions() {
		if( driver.get() != '0' ) {
			options.disable();
		} else {
			options.enable();
		}
	}
                                                            // src/order-form/order-form.js:58
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
                                                            // src/order-form/order-form.js:74
	var $controls = $container.find( "input, select, button:not(.cancel), textarea" );
                                                            // src/order-form/order-form.js:76
	function div( className ) {
		var $d = $( '<div></div>' );
		if( className ) $d.addClass( className );
		$container.append( $d );
		return $d;
	}
                                                            // src/order-form/order-form.js:83
	if( order ) {
		$title.html( "Заказ № " + order.order_id );
		options.set( order );
		customer.set( order );
		$comments.val( order.comments );
		postpone.set( order );
		from.set( order.src );
		if( order.dest ) {
			to.set( order.dest );
		}
	}
	else {
		$title.html( "Новый заказ" );
	}
                                                            // src/order-form/order-form.js:98
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/order-form/order-form.js:102
	this.lock = function( status ) {
		$status.html( status );
		$controls.prop( "disabled", true );
	};
                                                            // src/order-form/order-form.js:107
	this.unlock = function() {
		$status.html( "" );
		$controls.prop( "disabled", false );
	};
                                                            // src/order-form/order-form.js:112
	this.locked = function() {
		return $controls.prop( "disabled" );
	};
                                                            // src/order-form/order-form.js:116
	this.orderId = function() {
		if( !order ) return null;
		return order.order_uid;
	};
                                                            // src/order-form/order-form.js:121
	this.setQueue = function( qid ) {
		from.setQueue( qid );
	};
                                                            // src/order-form/order-form.js:125
	this.setCustomerPhone = function( phone, trigger ) {
		customer.setPhone( phone, trigger );
	};
                                                            // src/order-form/order-form.js:129
	this.setTitle = function( title, className ) {
		$title.html( title );
		$title.get(0).className = 'title ' + className;
	};
                                                            // src/order-form/order-form.js:134
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
                                                            // src/order-form/order-form.js:150
	function getOrder()
	{
		var data = obj.merge(
			options.get(),
			customer.get(),
			postpone.get()
		);
		data.comments = $comments.val();
		data.status = Order.prototype.POSTPONED;
		data.src = from.get();
		data.dest = to.get();
                                                            // src/order-form/order-form.js:162
		if( order ) {
			for( var k in data ) {
				order[k] = data[k];
			}
		} else {
			order = new Order( data );
		}
                                                            // src/order-form/order-form.js:170
		return order;
	}
}
                                                            // src/order-form/order-form.js:174
return OrderForm;
})();


// src/order-form/postpone.js
function PostponeSection( $container )
{
	var $top = $( html.checkbox( "Отложить заказ" ) );
	var $sub = $( '<div></div>' );
	$sub.html( html.input( "Время подачи машины", "datetime-local" )
		+ '<label>Напоминание</label><input type="number" min="0" step="5" value="5" size="2"> мин. до подачи' );
	$container.append( $top );
	$container.append( $sub );
                                                            // src/order-form/postpone.js:9
	var $checkbox = $top.filter( "input" ).eq(0);
	var $time = $sub.find( "input" ).eq(0);
	var $remind = $sub.find( "input" ).eq(1);
                                                            // src/order-form/postpone.js:13
	html5.fix( $time.get(0) );
                                                            // src/order-form/postpone.js:15
	/*
	 * Because these elements are not inserted into the document yet,
	 * jQuery's 'slideUp' won't work, so we additionally call 'hide'
	 * at the beginning if necessary.
	 */
	if( !$checkbox.get(0).checked ) {
		$sub.hide();
	}
                                                            // src/order-form/postpone.js:24
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
                                                            // src/order-form/postpone.js:47
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
                                                            // src/order-form/postpone.js:62
	this.set = function( order )
	{
		if( order.exp_arrival_time )
		{
			$checkbox.prop( 'checked', true );
			$sub.show();
                                                            // src/order-form/postpone.js:69
			setTime( order.exp_arrival_time );
                                                            // src/order-form/postpone.js:71
			var min = Math.round((order.exp_arrival_time - order.reminder_time)/60);
			$remind.val( min )
			enable();
		}
		else {
			$checkbox.prop( 'checked', false );
			disable();
		}
	};
                                                            // src/order-form/postpone.js:81
	//--
                                                            // src/order-form/postpone.js:83
	function enable() {
		$time.prop( 'disabled', false );
		$remind.prop( 'disabled', false );
	}
                                                            // src/order-form/postpone.js:88
	function disable() {
		$time.prop( 'disabled', true );
		$remind.prop( 'disabled', true );
	}
                                                            // src/order-form/postpone.js:93
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
                                                            // src/order-form/postpone.js:114
	function getTime()
	{
		var d = parseDateTime( $time.val() );
		if( !d ) return null;
		return time.utc( Math.round( d.getTime() / 1000 ) );
	}
                                                            // src/order-form/postpone.js:121
	//--
                                                            // src/order-form/postpone.js:123
	/*
	 * Parses a string like "2000-01-01T00:00[:00]" and returns a Date
	 * object.
	 */
	function parseDateTime( dt )
	{
		var re = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)$/;
		var m = dt.match( re );
                                                            // src/order-form/postpone.js:132
		if( !m ) {
			re = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d)$/;
			m = dt.match( re );
		}
                                                            // src/order-form/postpone.js:137
		if( !m ) return null;
                                                            // src/order-form/postpone.js:139
		var Y = m[1];
		var M = m[2] - 1; /* 0-based, surprise! */
		var D = m[3];
		var h = m[4];
		var m = m[5];
		return new Date( Y, M, D, h, m );
	}
}


// src/sessions.js
function initSessions( disp, tabs )
{
	var sessions = new SessionsWidget( disp );
	tabs.addTab( "Смены", sessions.root() );
                                                            // src/sessions.js:5
	initSessionRequests( disp );
}
                                                            // src/sessions.js:8
function initSessionRequests( disp )
{
	/*
	 * Driver id => dialog.
	 */
	var dialogs = {};
                                                            // src/sessions.js:15
	var sound = sounds.track( "/res/dispatcher/phone.ogg" );
                                                            // src/sessions.js:17
	disp.on( 'session-requested', function( event ) {
		var r = event.data;
		showDialog( r.driver_id, r.odometer );
	});
                                                            // src/sessions.js:22
	function showDialog( driver_id, odometer )
	{
		/*
		 * Don't show the dialog twice.
		 */
		if( driver_id in dialogs ) {
			return;
		}
                                                            // src/sessions.js:31
		var d = disp.getDriver( driver_id );
		var msg = "Водитель " + d.call_id + " желает открыть смену.";
                                                            // src/sessions.js:34
		var dialog = new Dialog( msg );
		dialogs[driver_id] = dialog;
                                                            // src/sessions.js:37
		var b1 = dialog.addButton( "Разрешить", function()
		{
			sound.stop();
			b1.disabled = true;
			b2.disabled = true;
                                                            // src/sessions.js:43
			disp.openSession( driver_id, odometer )
			.catch( function( error ) {
				/*
				 * If the error is that the session already exists,
				 * consume it and treat the request as successful.
				 */
				if( error == "open" ) {
					return null;
				}
				/*
				 * If not, pass the error along.
				 */
				throw error;
			})
			.then( function() {
				dialog.close();
				delete dialogs[driver_id];
			})
			.catch( function( error ) {
				Dialog.show( sessionError( error ) );
				b1.disabled = false;
				b2.disabled = false;
			});
                                                            // src/sessions.js:67
		}, "yes" );
                                                            // src/sessions.js:69
		var b2 = dialog.addButton( "Игнорировать", function() {
			sound.stop();
			this.close();
			delete dialogs[driver_id];
		}, "no" );
                                                            // src/sessions.js:75
		dialog.show();
		sound.play();
	}
                                                            // src/sessions.js:79
	disp.on( 'session-opened', function( event )
	{
		var s = event.data;
		var driver_id = s.driver_id;
		if( driver_id in dialogs ) {
			dialogs[driver_id].close();
			sound.stop();
			delete dialogs[driver_id];
		}
	});
}
                                                            // src/sessions.js:91
/*
 * Returns text description of a session-related error code.
 */
function sessionError( code ) {
	var messages = {
		"open": "Смена уже открыта",
		"no_car": "Водителю не назначена машина"
	};
	if( code in messages ) return messages[code];
	return "Ошибка: " + code;
}


// src/settings.js
function initSettings( disp, statusBar )
{
	var dialog = null;
	applySettings();
                                                            // src/settings.js:5
	function applySettings() {
		sounds.vol( disp.getSetting( "sound-volume", 0.5 ) );
	}
                                                            // src/settings.js:9
	var $b = statusBar.addButton( 'settings', 'Настройки' );
	$b.on( "click", function()
	{
		if( dialog ) {
			dialog.focus();
			return;
		}
                                                            // src/settings.js:17
		var $c = $( '<div></div>' );
		$c.append( soundSection() );
                                                            // src/settings.js:20
		var saveButton;
		dialog = new Dialog( $c );
		dialog.setTitle( "Настройки" );
		saveButton = dialog.addButton( "Сохранить", function()
		{
			saveButton.disabled = true;
			disp.saveSettings().then( function() {
				toast( "Сохранено" );
				dialog.close();
				dialog = null;
			})
			.catch( function( err ) {
				Dialog.show( err );
				saveButton.disabled = false;
			});
                                                            // src/settings.js:36
		}, "yes" );
		dialog.addButton( "Отменить", null, "no" );
		dialog.on( "close", function() {
			dialog = null;
		});
		dialog.show();
	});
                                                            // src/settings.js:44
	var testSound = sounds.track( "/res/dispatcher/phone.ogg" );
	function soundSection()
	{
		var s = '<div>\
			<label>Громкость звуков</label>\
			<input type="range" min="0.0" max="1.0"\
				step="0.01">\
			<button type="button">Проверка</button>\
		</div>';
		var $c = $( s );
                                                            // src/settings.js:55
		var $range = $c.find( 'input' );
		var $button = $c.find( 'button' );
                                                            // src/settings.js:58
		var vol = disp.getSetting( "sound-volume", 0.5 )
		$range.val( vol );
		$range.on( "change", function() {
			sounds.vol( this.value );
			disp.changeSetting( "sound-volume", this.value );
		});
                                                            // src/settings.js:65
		$button.on( "click", function() {
			var b = this;
			b.disabled = true;
			testSound.play();
			setTimeout( function() {
				testSound.stop();
				b.disabled = false;
			}, 3000 );
		});
		return $c;
	}
}


// src/widgets/calculator/address-picker.js
function CalcAddressPicker( disp, $container )
{
	var $c = $( '<div class="address-picker"></div>' );
	var s = '<div><label>Город</label><input class="city"></div>\
	<div><label>Улица</label><input class="street"></div>\
	<div><label>Дом, корпус</label>\
		<input class="house">, <input class="building"></div>';
                                                            // src/widgets/calculator/address-picker.js:8
	var $s = $( s );
	$container.append( $c );
	$c.append( $s );
                                                            // src/widgets/calculator/address-picker.js:12
	var $city = $s.find( '.city' );
	var $street = $s.find( '.street' );
	var $house = $s.find( '.house' );
	var $building = $s.find( '.building' );
                                                            // src/widgets/calculator/address-picker.js:17
	$city.val( disp.param( "default_city" ) );
	$city.autocomplete( mapdata.getPlaceSuggestions );
	$street.autocomplete( function( term, callback ) {
		mapdata.getStreetSuggestions( term, $city.val(), callback );
	});
                                                            // src/widgets/calculator/address-picker.js:23
	var $all = $s.find( 'input' );
	var callback = null;
                                                            // src/widgets/calculator/address-picker.js:26
	$all.on( "change", function() {
		callback( getAddr() );
	});
                                                            // src/widgets/calculator/address-picker.js:30
	this.get = getAddr;
                                                            // src/widgets/calculator/address-picker.js:32
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
                                                            // src/widgets/calculator/address-picker.js:44
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
                                                            // src/widgets/calculator/address-picker.js:60
	this.enable = function( quick ) {
		$c.find( "input" ).prop( "disabled", false );
		if( quick ) {
			$c.show();
		} else {
			$c.slideDown( "fast" );
		}
	};
                                                            // src/widgets/calculator/address-picker.js:69
	this.disable = function( quick ) {
		$c.find( "input" ).prop( "disabled", true );
		if( quick ) {
			$c.hide();
		} else {
			$c.slideUp( "fast" );
		}
	};
                                                            // src/widgets/calculator/address-picker.js:78
	this.onChange = function( f ) {
		callback = f;
	};
}


// src/widgets/calculator/calculator.js
function CalculatorWidget( disp )
{
	var $container = $( '<div id="calc-widget"></div>' );
                                                            // src/widgets/calculator/calculator.js:4
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/widgets/calculator/calculator.js:8
	var $pane = $( '<div class="controls"></div>' );
	$container.append( $pane );
                                                            // src/widgets/calculator/calculator.js:11
	$pane.append( '<b>Откуда</b>' );
	var from = new CalcAddressPicker( disp, $pane );
	$pane.append( '<b>Куда</b>' );
	var dest = new CalcAddressPicker( disp, $pane );
	var map = createMap();
	var $fares = createFares();
	var $output = $( '<div class="output"></div>' );
	$pane.append( $output );
                                                            // src/widgets/calculator/calculator.js:20
	function createMap()
	{
		var $map = $( '<div class="map"></div>' );
		$container.append( $map );
		var map = new Map( $map.get(0) );
		map.addZoomControl( "topleft" );
		map = map.leaflet;
		$(window).on( "resize", function() {
			map.invalidateSize();
		});
		return map;
	}
                                                            // src/widgets/calculator/calculator.js:33
	function createFares()
	{
		var s = '<label>Тариф</label><select>';
		disp.fares().forEach( function( f, i ) {
			s += '<option value="'+i+'">'+f.name+'</option>';
		});
		s += '</select>';
		var $s = $( s );
		$pane.append( $s );
		return $s.filter( 'select' );
	}
                                                            // src/widgets/calculator/calculator.js:45
	var fromMarker = L.marker( [0, 0],
		{draggable: true, title: "Точка отправки"} ).addTo( map );
	var destMarker = L.marker( [0, 0],
		{draggable: true, title: "Точка прибытия"} ).addTo( map );
	var route = L.polyline( [[0, 0]] ).addTo( map );
                                                            // src/widgets/calculator/calculator.js:51
	var routeData = null;
                                                            // src/widgets/calculator/calculator.js:53
	$fares.on( "change", function() {
		showData();
	});
                                                            // src/widgets/calculator/calculator.js:57
	setupPicker( from, fromMarker );
	setupPicker( dest, destMarker );
                                                            // src/widgets/calculator/calculator.js:60
	function setupPicker( picker, marker )
	{
		picker.onChange( function( addr )
		{
			/*
			 * Remove marker and output.
			 */
			marker.setLatLng( [0, 0] );
			route.setLatLngs( [[0, 0]] );
			$output.empty();
			/*
			 * Request coordinates, then put marker and recalculate.
			 */
			mapdata.getAddressBounds( addr, function( bounds ) {
				if( !bounds ) {
					$output.html( 'Не удалось определить координаты по адресу' );
					return;
				}
				marker.setLatLng( [bounds.lat, bounds.lon] );
				updateEstimation();
			});
		});
	}
                                                            // src/widgets/calculator/calculator.js:84
	fromMarker.addEventListener( "dragend",
		syncFromMarker.bind( undefined, fromMarker, from ) );
	destMarker.addEventListener( "dragend",
		syncFromMarker.bind( undefined, destMarker, dest ) );
                                                            // src/widgets/calculator/calculator.js:89
	setupMap( "click", from, fromMarker );
	setupMap( "contextmenu", dest, destMarker );
                                                            // src/widgets/calculator/calculator.js:92
	function setupMap( clickType, picker, marker )
	{
		map.addEventListener( clickType, function( event )
		{
			marker.setLatLng( event.latlng );
			syncFromMarker( marker, picker );
			return false;
		});
	}
                                                            // src/widgets/calculator/calculator.js:102
	function syncFromMarker( marker, picker )
	{
		/*
		 * Empty address picker, request and show address.
		 */
		picker.set( null );
		var pos = marker.getLatLng();
		mapdata.getPointAddress( pos.lat, pos.lng,
			function( addr ) {
				for( var k in addr ) {
					addr[k.replace("address_", "")] = addr[k];
				}
				picker.set( addr );
			}
		);
                                                            // src/widgets/calculator/calculator.js:118
		route.setLatLngs( [[0, 0]] );
		$output.empty();
                                                            // src/widgets/calculator/calculator.js:121
		updateEstimation();
	}
                                                            // src/widgets/calculator/calculator.js:124
	function updateEstimation()
	{
		var from = fromMarker.getLatLng();
		var to = destMarker.getLatLng();
		if( from.lat == 0 || to.lat == 0 ) {
			return;
		}
                                                            // src/widgets/calculator/calculator.js:132
		dx.get( "route", {from: from.lat + "," + from.lng,
			to: to.lat + "," + to.lng} )
		.then( function( data )
		{
			routeData = data;
			showData();
		})
		.catch( function( error ) {
			$output.html( "Не удалось проложить маршрут: " + error );
		});
	}
                                                            // src/widgets/calculator/calculator.js:144
	function showData()
	{
		var data = routeData;
                                                            // src/widgets/calculator/calculator.js:148
		route.setLatLngs( data.route_geometry );
		map.fitBounds( route.getBounds() );
                                                            // src/widgets/calculator/calculator.js:151
		var d = data.route_summary.total_distance;
		var fare = disp.fares()[$fares.val()];
                                                            // src/widgets/calculator/calculator.js:154
		var price = fare.price( d );
		price = Math.round( price/1000 ) * 1000;
                                                            // src/widgets/calculator/calculator.js:157
		$output.html(
			fmt( "%.1f км, %s руб.", d/1000, formatNumber( price ) )
		);
	}
}


// src/widgets/drivers-table.js
﻿function DriversTableWidget( disp )
{
	var $table;
                                                            // src/widgets/drivers-table.js:4
	this.root = function() {
		return $table.get(0);
	};
                                                            // src/widgets/drivers-table.js:8
	var s = '<table class="items">';
	s += '<tr><th>Позывной</th><th>Имя</th><th>Телефон</th><th>Автомобиль</th><th>Номер</th><th>Цвет</th></tr>';
	var rt = '<tr>' + '<td>?</td><td>?</td><td>?</td>'
		+ '<td>?</td><td>?</td><td>?</td>' + '</tr>';
	disp.drivers().forEach( function( d ) {
		var c = disp.getCar( d.car_id );
		if( !c ) c = {name: "", plate: "", color: ""};
		s += tpl( rt,
			d.call_id, d.name, d.phone,
			c.name, c.plate, c.color );
	});
	s += '</table>';
	$table = $( s );
}


// src/widgets/imitations.js
function ImitationsWidget( disp )
{
	var $button = $( '<button type="button">Добавить имитацию</button>' );
	$button.on( "click", openAddDialog );
                                                            // src/widgets/imitations.js:5
	this.root = function() {
		return $button.get(0);
	};
                                                            // src/widgets/imitations.js:9
	var dialog = null;
                                                            // src/widgets/imitations.js:11
	/*
	 * Shows a dialog with cars that are not yet "online".
	 */
	function openAddDialog()
	{
		if( dialog ) {
			dialog.focus();
			return;
		}
                                                            // src/widgets/imitations.js:21
		/*
		 * Get all fake drivers that are offline.
		 */
		var list = disp.drivers().filter( function( d ) {
			return d.is_fake == 1 && !d.online();
		});
                                                            // src/widgets/imitations.js:28
		if( list.length == 0 ) {
			toast( "Все имитации уже в таблице" );
			return;
		}
                                                            // src/widgets/imitations.js:33
		var s = '<div class="menu">';
		list.forEach( function( driver ) {
			s += '<div data-id="' + driver.id +'">'+driver.call_id+'</div> ';
		});
		s += '<p>Удалить водителя из таблицы можно нажав правую кнопку мыши.</p>';
		s += '</div>';
		var $s = $( s );
                                                            // src/widgets/imitations.js:41
		dialog = new Dialog( $s.get(0) );
		dialog.setTitle( "Добавление имитации" );
		dialog.addButton( "Отменить", function() {
			dialog.close();
			dialog = null;
		}, "no" );
		$s.on( 'click', 'div', function( event )
		{
			event.preventDefault();
			var id = $( this ).data( 'id' );
			disp.setDriverOnline( id, true ).catch( function( error ) {
				Dialog.show( "Ошибка: " + error );
			});
			dialog.close();
			dialog = null;
		});
		dialog.show();
	}
}


// src/widgets/map.js
function MapWidget( disp )
{
	var $container = $( '<div id="map-widget"></div>' );
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/widgets/map.js:7
	// driver id => marker name
	var driverClasses = {};
                                                            // src/widgets/map.js:10
	var map;
                                                            // src/widgets/map.js:12
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
                                                            // src/widgets/map.js:29
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
                                                            // src/widgets/map.js:41
		$w.on( "resize", track );
		track();
	}
                                                            // src/widgets/map.js:45
	this.setPosition = function( coords ) {
		map.panTo( coords[0], coords[1] );
                                                            // src/widgets/map.js:48
	};
                                                            // src/widgets/map.js:50
	this.setZoom = function( level ) {
		map.setZoom( level );
	};
                                                            // src/widgets/map.js:54
	this.setClass = function( driverId, className ) {
		driverClasses[driverId] = className;
		updateMarker( driverId );
	};
                                                            // src/widgets/map.js:59
	this.removeClass = function( driverId, className ) {
		delete driverClasses[driverId];
		updateMarker( driverId );
	};
                                                            // src/widgets/map.js:64
	function updateMarker( id )
	{
		var driver = disp.getDriver( id );
		if( driver.is_online != '1' ) {
			return;
		}
		putCarMarker( map, driver );
	}
                                                            // src/widgets/map.js:73
	//--
                                                            // src/widgets/map.js:75
	function getBounds()
	{
		var P = {ok: null, fail: null};
		var promise = new Promise( function( ok, fail )
		{
			P.ok = ok;
			P.fail = fail;
		});
                                                            // src/widgets/map.js:84
		var minskBounds = {
			name: "Минск и окрестность",
			min_lat: 53.87,
			max_lat: 53.93,
			min_lon: 27.555,
			max_lon: 27.575
		};
                                                            // src/widgets/map.js:92
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
                                                            // src/widgets/map.js:105
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
                                                            // src/widgets/map.js:120
		return {
			onClick: function( f ) {
				assert( !callback, "only one onClick allowed" );
				callback = f;
			}
		};
	}
                                                            // src/widgets/map.js:128
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
                                                            // src/widgets/map.js:143
	function showQueues( map )
	{
		var flagIcon = L.icon({
			iconUrl: "/res/dispatcher/images/flag-icon.png",
			iconSize: [25, 27],
			iconAnchor: [12, 27]
		});
                                                            // src/widgets/map.js:151
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
                                                            // src/widgets/map.js:162
			map.setMarker( 'q_' + q.queue_id,
				coords[0], coords[1], options );
		});
	}
                                                            // src/widgets/map.js:167
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
                                                            // src/widgets/map.js:178
		disp.on( "driver-online-changed", function( event ) {
			var d = event.data.driver;
			if( d.online() ) {
				putCarMarker( map, d );
			} else {
				map.removeMarker( 'taxi_' + d.id );
			}
		});
                                                            // src/widgets/map.js:187
		disp.on( 'driver-moved', function( event )
		{
			var driver = event.data.driver;
			putCarMarker( map, driver );
		});
	}
                                                            // src/widgets/map.js:194
	//--
                                                            // src/widgets/map.js:196
	function putCarMarker( map, driver )
	{
		/*
		 * If the driver is offline, don't show the marker.
		 */
		var coords = driver.coords();
		if( !coords[0] ) return;
                                                            // src/widgets/map.js:204
		var options = {
			title: driver.call_id,
			icon: L.icon({
				iconUrl: driverIconUrl( driver ),
				iconSize: [25, 27],
				iconAnchor: [12, 27]
			})
		};
                                                            // src/widgets/map.js:213
		var m = map.setMarker( "taxi_" + driver.id,
			coords[0], coords[1], options );
		m.bindLabel( driver.call_id, { noHide: true } ).showLabel();
	}
                                                            // src/widgets/map.js:218
	function driverIconUrl( driver )
	{
		var pref = "/res/dispatcher/images/map-icon-";
                                                            // src/widgets/map.js:222
		if( driver.id in driverClasses ) {
			return pref + driverClasses[driver.id] + ".gif";
		}
                                                            // src/widgets/map.js:226
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
                                                            // src/widgets/map.js:239
		var url = pref + carClass;
		if( car && car['class'] == 'vip' ) url += "-vip";
		url += ".png";
		return url;
	}
                                                            // src/widgets/map.js:245
	//--
}


// src/widgets/monitor/ban-dialog.js
function showBanDialog( driverId )
{
	var driver = disp.getDriver( driverId );
                                                            // src/widgets/monitor/ban-dialog.js:4
	var $s = $( '<div>'
		+ 'Заблокировать водителя ' + driver.call_id + ' на '
		+ '<input type="number" min="10" step="10" value="10" size="3"> мин.'
		+ '<br><label>Причина:</label><input name="reason">'
		+ '</div>' );
                                                            // src/widgets/monitor/ban-dialog.js:10
	var d = new Dialog( $s.get(0) );
	d.addButton( "Заблокировать", function()
	{
		var minutes = $s.find( 'input[type="number"]' ).val();
		var reason = $s.find( 'input[name="reason"]' ).val();
		var seconds = minutes * 60;
		disp.blockDriver( driverId, seconds, reason );
		d.close();
	}, "yes" );
	d.addButton( "Отменить", null, "no" );
	d.show();
}
                                                            // src/widgets/monitor/ban-dialog.js:23
function showUnbanDialog( driverId )
{
	var driver = disp.getDriver( driverId );
                                                            // src/widgets/monitor/ban-dialog.js:27
	var d = new Dialog( "Разблокировать водителя " + driver.call_id + "?" );
	d.addButton( "Да", function() {
		disp.unblockDriver( driverId );
		d.close();
	}, "yes" );
	d.addButton( "Нет", null, "no" );
	d.show();
}


// src/widgets/monitor/drivers-filter.js
function DriversFilterWidget( disp )
{
	var s = '<div id="cars-selector">\
		<b>Выбор водителей:</b>\
		<span>\
		<input type="checkbox" id="cb-terminal-highlight">\
		<label for="cb-terminal-highlight">терминал</label>\
		</span>';
                                                            // src/widgets/monitor/drivers-filter.js:9
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
                                                            // src/widgets/monitor/drivers-filter.js:22
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
                                                            // src/widgets/monitor/drivers-filter.js:35
	s += '</div>';
                                                            // src/widgets/monitor/drivers-filter.js:37
	var $c = $( s );
	var $term = $c.find( '#cb-terminal-highlight' );
	$term.on( 'change', applyFilter );
                                                            // src/widgets/monitor/drivers-filter.js:41
	var $type = $c.find( 'input[name="type"]' );
	$type.on( 'change', applyFilter );
                                                            // src/widgets/monitor/drivers-filter.js:44
	var $group = $c.find( 'input[name="group"]' );
	$group.on( 'change', applyFilter );
                                                            // src/widgets/monitor/drivers-filter.js:47
	this.root = function() {
		return $c.get(0);
	};
                                                            // src/widgets/monitor/drivers-filter.js:51
	var listeners = [];
	this.onChange = listeners.push.bind( listeners );
                                                            // src/widgets/monitor/drivers-filter.js:54
	this.clear = function() {
		$term.prop( "checked", false );
		$type.prop( "checked", false );
		$group.prop( 'checked', false );
	};
                                                            // src/widgets/monitor/drivers-filter.js:60
	function applyFilter()
	{
		var filter = [];
		if( $term.is( ':checked' ) ) {
			filter.push( {has_bank_terminal: 1} );
		}
                                                            // src/widgets/monitor/drivers-filter.js:67
		$type.filter( ":checked" ).each( function() {
			filter.push( {type_id: this.value} );
		});
                                                            // src/widgets/monitor/drivers-filter.js:71
		$group.filter( ":checked" ).each( function() {
			filter.push( {group_id: this.value} );
		});
                                                            // src/widgets/monitor/drivers-filter.js:75
		listeners.forEach( function( f ) {
			f( filter );
		});
	}
}


// src/widgets/monitor/monitor.js
/*
 * "Monitor" is the widgets combo on the first tab: imitations button,
 * drivers filter and queues table.
 */
function initMonitorWidget( disp, tabs )
{
	var $p = $( '<div></div>' );
	if( disp.imitationsEnabled() ) {
		var im = new ImitationsWidget( disp );
		$p.append( im.root() );
	}
	var filterWidget = new DriversFilterWidget( disp );
	$p.append( filterWidget.root() );
                                                            // src/widgets/monitor/monitor.js:14
	var $invertButton = $( '<button type="button">Инвертировать</button>' );
	$invertButton.appendTo( filterWidget.root() );
                                                            // src/widgets/monitor/monitor.js:17
	/*
	 * Button for sending announces.
	 */
	var $announceButton = $( '<button type="button">Отправить сообщение</button>' );
	$announceButton.appendTo( filterWidget.root() );
                                                            // src/widgets/monitor/monitor.js:23
	var qw = new QueuesWidget( disp );
	$p.append( qw.root() );
                                                            // src/widgets/monitor/monitor.js:26
	tabs.addTab( "Очереди", $p.get(0) );
                                                            // src/widgets/monitor/monitor.js:28
	filterWidget.onChange( function( filter ) {
		qw.selectDrivers( filter );
		syncAnnounceButton();
	});
                                                            // src/widgets/monitor/monitor.js:33
	/*
	 * On Ctrl-left-click toggle the clicked driver's selection.
	 */
	qw.on( "driver-click", function( event )
	{
		if( !event.data.ctrlKey || event.data.button != 0 ) {
			return;
		}
		qw.toggleSelection( event.data.driver.id );
		filterWidget.clear();
		syncAnnounceButton();
	});
                                                            // src/widgets/monitor/monitor.js:46
	/*
	 * On invert button click invert the selection.
	 */
	$invertButton.on( "click", function() {
		qw.invertSelection();
		filterWidget.clear();
		syncAnnounceButton();
	});
                                                            // src/widgets/monitor/monitor.js:55
	syncAnnounceButton();
	function syncAnnounceButton() {
		$announceButton.prop( "disabled", qw.selectedDrivers().length == 0 );
	}
                                                            // src/widgets/monitor/monitor.js:60
	/*
	 * When the button is clicked, open a new announcement dialog.
	 */
	$announceButton.on( "click", function()
	{
		var d = new AnnounceDialog( disp, qw.selectedDrivers() );
		d.show();
	});
                                                            // src/widgets/monitor/monitor.js:69
	return {
		qw: qw
	};
}


// src/widgets/monitor/queues-widget/clicking.js
function initQueueClicking( disp, table, listeners )
{
	/*
	 * Split the click events into explicit left-click and right-click
	 * types.
	 */
	table.on( "item-click", function( event )
	{
		var driver = disp.getDriver( event.data.id );
		var queue = disp.getQueue( event.data.qid );
                                                            // src/widgets/monitor/queues-widget/clicking.js:11
		listeners.call( "driver-click", {
			driver: driver,
			button: event.data.button,
			ctrlKey: event.data.ctrlKey
		} );
                                                            // src/widgets/monitor/queues-widget/clicking.js:17
		if( event.data.button == 0 ) {
			return driverLeftClick( driver, queue, event );
		} else {
			return driverRightClick( driver, queue, event );
		}
	});
                                                            // src/widgets/monitor/queues-widget/clicking.js:24
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
                                                            // src/widgets/monitor/queues-widget/clicking.js:35
	//--
                                                            // src/widgets/monitor/queues-widget/clicking.js:37
	function driverLeftClick( driver, queue, event )
	{
		if( event.data.ctrlKey ) {
			return;
		}
		/*
		 * If there is an open editable form, update it with the
		 * driver.
		 */
		var form = orderForms.getFocusForm();
		if( form && !form.locked() ) {
			form.setDriver( driver.id );
			return;
		}
                                                            // src/widgets/monitor/queues-widget/clicking.js:52
		/*
		 * If can't send an order to this driver, ignore the click.
		 */
		if( driver.blocked() || disp.sessionRequired( driver.id ) ) {
			return;
		}
                                                            // src/widgets/monitor/queues-widget/clicking.js:59
		/*
		 * Create new form and set the driver and the queue in it.
		 */
		var form = orderForms.show();
		if( queue ) {
			form.setQueue( queue.id );
		}
		form.setDriver( driver.id );
	}
                                                            // src/widgets/monitor/queues-widget/clicking.js:69
	function driverRightClick( driver, queue )
	{
		if( driver.is_fake != '1' ) {
			return;
		}
                                                            // src/widgets/monitor/queues-widget/clicking.js:75
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
                                                            // src/widgets/monitor/queues-widget/clicking.js:86
	function queueLeftClick( queue )
	{
		/*
		 * If this is not a location queue, ignore the click.
		 */
		if( !disp.getQueueLocation( queue.id ) ) {
			return;
		}
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
                                                            // src/widgets/monitor/queues-widget/clicking.js:109
	/*
	 * Show a dialog with queue settings.
	 */
	function queueRightClick( queue )
	{
		var s = '<div>'
			+ '<div>'
			+ '<label>Количество дежурных машин</label>'
			+ '<input type="number" min="0" step="1"'
				+ ' name="min" value="'+queue.min+'">'
			+ '</div>';
                                                            // src/widgets/monitor/queues-widget/clicking.js:121
		/*
		 * For subqueues show also priority value.
		 */
		if( queue.parent_id ) {
			s += '<div>'
			+ '<label>Приоритет (0&ndash;9)</label>'
			+ '<input type="number" min="0" max="9" step="1"'
				+ ' name="priority" value="'+queue.priority+'">'
			+ '</div>';
		} else {
			s += '<input type="hidden" name="priority" value="'+queue.priority+'">';
		}
                                                            // src/widgets/monitor/queues-widget/clicking.js:134
		s += '</div>';
                                                            // src/widgets/monitor/queues-widget/clicking.js:136
		var $src = $( s );
                                                            // src/widgets/monitor/queues-widget/clicking.js:138
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


// src/widgets/monitor/queues-widget/dragging.js
function initQueueDragging( disp, table )
{
	table.initDragging( onDragStart, onDragEnd, onDragCancel );
                                                            // src/widgets/monitor/queues-widget/dragging.js:4
	/*
	 * Original item's position.
	 */
	var qid1 = null;
	var pos1 = null;
                                                            // src/widgets/monitor/queues-widget/dragging.js:10
	function onDragStart( event )
	{
		qid1 = event.qid;
		pos1 = event.pos;
                                                            // src/widgets/monitor/queues-widget/dragging.js:15
		/*
		 * Mark queues forbidden for this driver.
		 */
		var allowed = allowedQueues( event.id );
		table.selectQueuesExcept( allowed, 'forbidden' );
		return true;
	}
                                                            // src/widgets/monitor/queues-widget/dragging.js:23
	function onDragCancel( event ) {
		table.selectQueues( [], 'forbidden' );
	}
                                                            // src/widgets/monitor/queues-widget/dragging.js:27
	function onDragEnd( event )
	{
		table.selectQueues( [], 'forbidden' );
                                                            // src/widgets/monitor/queues-widget/dragging.js:31
		var qid2 = event.qid;
		var pos2 = event.pos;
                                                            // src/widgets/monitor/queues-widget/dragging.js:34
		if( qid1 == qid2 && pos1 == pos2 ) {
			return false;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:38
		var id = event.id;
		var from = { qid: qid1, pos: pos1 };
		var to = { qid: qid2, pos: pos2 };
                                                            // src/widgets/monitor/queues-widget/dragging.js:42
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
                                                            // src/widgets/monitor/queues-widget/dragging.js:55
		if( qid2 == table.BLOCKED ) {
			showBanDialog( id );
			return false;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:60
		if( qid1 == table.BLOCKED ) {
			showUnbanDialog( id );
			return false;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:65
		if( disp.allowedQueues( id ).length == 0 && to.qid == table.NONE ) {
			return false;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:69
		if( to.qid == table.NONE ) {
			return confirmKick( id, from, to );
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:73
		if( disp.sessionRequired( id ) ) {
			toast( "Нельзя записывать в очередь не вышедших на смену" );
			return false;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:78
		return confirmMove( id, from, to );
	}
                                                            // src/widgets/monitor/queues-widget/dragging.js:81
	//--
                                                            // src/widgets/monitor/queues-widget/dragging.js:83
	function allowedQueues( driverId )
	{
		var driver = disp.getDriver( driverId );
                                                            // src/widgets/monitor/queues-widget/dragging.js:87
		if( driver.blocked() ) {
			return [table.BLOCKED, table.NONE];
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:91
		if( disp.sessionRequired( driverId ) ) {
			return [table.BLOCKED];
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:95
		var ids = disp.allowedQueues( driverId );
		ids.push( table.BLOCKED );
                                                            // src/widgets/monitor/queues-widget/dragging.js:98
		if( disp.allowedQueues( driverId ).length == 0 ) {
			ids.push( table.CITY );
		} else {
			ids.push( table.NONE );
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:104
		return ids;
	}
                                                            // src/widgets/monitor/queues-widget/dragging.js:107
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
                                                            // src/widgets/monitor/queues-widget/dragging.js:120
	function confirmMove( id, from, to )
	{
		var pos = to.pos;
		var qid = to.qid;
                                                            // src/widgets/monitor/queues-widget/dragging.js:125
		/*
		 * If the destination is forbidden, process group change.
		 */
		var allowed = disp.allowedQueues( id );
		if( allowed.indexOf( qid ) == -1  ) {
			processTransfer( id, from, to );
			return;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:134
		var taxi = disp.getDriver( id );
                                                            // src/widgets/monitor/queues-widget/dragging.js:136
		var doConfirm = from.qid != to.qid;
		if( !doConfirm ) {
			moveDriver( taxi, from, to );
			return;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:142
		var q = disp.getQueue( qid );
		var message = "Переместить водителя " + taxi.call_id
			+ " в очередь &laquo;" + q.name + "&raquo; " + (pos+1) + "-м?";
                                                            // src/widgets/monitor/queues-widget/dragging.js:146
		var d = new Dialog( message );
		d.addButton( "Да", function() {
			moveDriver( taxi, from, to );
			this.close();
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}
                                                            // src/widgets/monitor/queues-widget/dragging.js:155
	//--
                                                            // src/widgets/monitor/queues-widget/dragging.js:157
	function processTransfer( id, from, to )
	{
		var qid = to.qid;
                                                            // src/widgets/monitor/queues-widget/dragging.js:161
		/*
		 * Find groups that have access to that queue.
		 */
		var groups = disp.getQueueGroups( qid );
                                                            // src/widgets/monitor/queues-widget/dragging.js:166
		if( groups.length == 0 ) {
			toast( "В эту очередь нельзя записаться" );
			return;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:171
		var taxi = disp.getDriver( id );
                                                            // src/widgets/monitor/queues-widget/dragging.js:173
		if( groups.length == 1 ) {
			confirmTransfer( taxi, to, groups[0] );
			return;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:178
		showTransferMenu( taxi, to, groups );
	}
                                                            // src/widgets/monitor/queues-widget/dragging.js:181
	function confirmTransfer( taxi, to, group )
	{
		var q = disp.getQueue( to.qid );
                                                            // src/widgets/monitor/queues-widget/dragging.js:185
		var msg = 'Чтобы водитель '+taxi.call_id+' мог записаться в очередь «'
			+ q.name + '», его нужно переназначить в группу «' + group.name + '». Переназначить?';
                                                            // src/widgets/monitor/queues-widget/dragging.js:188
		var d = new Dialog( msg );
		d.addButton( "Да", function() {
			disp.changeDriverGroup( driver_id, group_id );
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}
                                                            // src/widgets/monitor/queues-widget/dragging.js:196
	function showTransferMenu( taxi, to, groups )
	{
		var q = disp.getQueue( to.qid );
		var menu = 'Водитель '+taxi.call_id+' не может записаться в очередь «'+q.name+'» в его текущей группе. В какую группу его переназначить?';
		menu += '<div class="menu">';
		for( var i = 0; i < groups.length; i++ ) {
			menu += '<div data-gid="'+groups[i].group_id+'">' + groups[i].name + '</div>';
		}
		menu += '</div>';
                                                            // src/widgets/monitor/queues-widget/dragging.js:206
		var $menu = $( '<div>' + menu + '</div>' );
                                                            // src/widgets/monitor/queues-widget/dragging.js:208
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
                                                            // src/widgets/monitor/queues-widget/dragging.js:220
	function moveDriver( driver, from, to )
	{
		var qid = to.qid;
		var pos = to.pos;
                                                            // src/widgets/monitor/queues-widget/dragging.js:225
		/*
		 * In some cases we have to send a dialog to the driver before
		 * moving them to the new queue.
		 */
		var dialogRequired = (
			disp.param( "queue_dialogs" ) == "1" &&
			driver.is_fake != "1" &&
			from.qid != to.qid
		);
                                                            // src/widgets/monitor/queues-widget/dragging.js:235
		if( dialogRequired )
		{
			if( !driver.online() ) {
				toast( "Водитель не на связи" );
			} else {
				disp.suggestQueue( driver.driver_id, qid, pos );
				toast( "Водителю отправлено сообщение" );
			}
			return;
		}
                                                            // src/widgets/monitor/queues-widget/dragging.js:246
		/*
		 * If the dialog is not needed, just assign the queue directly.
		 */
		disp.assignDriverQueue( driver.id, qid, pos );
	}
}


// src/widgets/monitor/queues-widget/items.js
function QueuesWidgetItems( disp )
{
	var items = {};
	var selections = {};
                                                            // src/widgets/monitor/queues-widget/items.js:5
	this.select = function( filter, className )
	{
		if( !className ) className = "highlight";
                                                            // src/widgets/monitor/queues-widget/items.js:9
		if( !filter ) {
			filter = [];
		}
		selections[className] = filter;
		sync( className );
	};
                                                            // src/widgets/monitor/queues-widget/items.js:16
	this.selectedItems = function( className )
	{
		if( !className ) className = "highlight";
		var list = [];
		for( var id in items ) {
			if( items[id].hasClass( className ) ) {
				list.push( id );
			}
		}
		return list;
	};
                                                            // src/widgets/monitor/queues-widget/items.js:28
	this.addSelection = function( id, className )
	{
		if( !className ) className = "highlight";
                                                            // src/widgets/monitor/queues-widget/items.js:32
		breakConditions( className );
                                                            // src/widgets/monitor/queues-widget/items.js:34
		if( !(id in items) || (items[id].hasClass( className )) ) {
			return;
		}
                                                            // src/widgets/monitor/queues-widget/items.js:38
		selections[className].push( {id: id} );
		items[id].addClass( className );
	};
                                                            // src/widgets/monitor/queues-widget/items.js:42
	this.removeSelection = function( id, className )
	{
		if( !className ) className = "highlight";
                                                            // src/widgets/monitor/queues-widget/items.js:46
		breakConditions( className );
                                                            // src/widgets/monitor/queues-widget/items.js:48
		if( !(id in items) || (!items[id].hasClass( className )) ) {
			return;
		}
                                                            // src/widgets/monitor/queues-widget/items.js:52
		var pos = -1;
		var n = selections[className].length;
		for( var i = 0; i < n; i++ ) {
			if( selections[className][i].id == id ) {
				pos = i;
				break;
			}
		}
		if( pos == -1 ) {
			return;
		}
		selections[className].splice( pos, 1 );
		items[id].removeClass( className );
	};
                                                            // src/widgets/monitor/queues-widget/items.js:67
	this.toggleSelection = function( id, className )
	{
		if( !className ) className = "highlight";
                                                            // src/widgets/monitor/queues-widget/items.js:71
		if( !(id in items) ) {
			return;
		}
                                                            // src/widgets/monitor/queues-widget/items.js:75
		if( items[id].hasClass( className ) ) {
			this.removeSelection( id, className );
		}
		else {
			this.addSelection( id, className );
		}
	};
                                                            // src/widgets/monitor/queues-widget/items.js:83
	this.invertSelection = function( id, className )
	{
		if( !className ) className = "highlight";
                                                            // src/widgets/monitor/queues-widget/items.js:87
		selections[className] = [];
		for( var id in items )
		{
			var item = items[id];
			if( item.hasClass( className ) ) {
				item.removeClass( className );
			}
			else {
				item.addClass( className );
				selections[className].push( {id: id} );
			}
		}
	};
                                                            // src/widgets/monitor/queues-widget/items.js:101
	//--
                                                            // src/widgets/monitor/queues-widget/items.js:103
	/*
	 * Replaces meta conditions with explicit id conditions.
	 */
	function breakConditions( className )
	{
		var cond = [];
		for( var id in items )
		{
			if( items[id].hasClass( className ) ) {
				cond.push( {id: id} );
			}
		}
		selections[className] = cond;
	}
                                                            // src/widgets/monitor/queues-widget/items.js:118
	function sync( className )
	{
		var cond = selections[className];
		if( !cond ) return;
                                                            // src/widgets/monitor/queues-widget/items.js:123
		for( var id in items )
		{
			var driver = disp.getDriver( id )
			if( match( driver, cond ) ) {
				items[id].addClass( className );
			}
			else {
				items[id].removeClass( className );
			}
		}
	}
                                                            // src/widgets/monitor/queues-widget/items.js:135
	function match( driver, cond )
	{
		var n = cond.length;
		if( n == 0 ) return false;
		for( var i = 0; i < n; i++ ) {
			if( obj.match( driver, cond[i] ) ) {
				return true;
			}
		}
		return false;
	}
                                                            // src/widgets/monitor/queues-widget/items.js:147
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
                                                            // src/widgets/monitor/queues-widget/items.js:159
	this.update = update;
                                                            // src/widgets/monitor/queues-widget/items.js:161
	//--
                                                            // src/widgets/monitor/queues-widget/items.js:163
	function create( id )
	{
		var driver = disp.getDriver( id );
		var $icon = $( '<div class="car" data-id="'+id+'">'+driver.call_id+'</div>' );
		return $icon;
	}
                                                            // src/widgets/monitor/queues-widget/items.js:170
	function update( id )
	{
		if( !(id in items) ) {
			return;
		}
		var icon = items[id].get(0);
                                                            // src/widgets/monitor/queues-widget/items.js:177
		var className = getClassName( id );
		if( className != icon.className ) {
			icon.className = className;
		}
                                                            // src/widgets/monitor/queues-widget/items.js:182
		var title = getTitle( id );
		if( title != icon.title ) {
			icon.title = title;
		}
	}
                                                            // src/widgets/monitor/queues-widget/items.js:188
	function getClassName( id )
	{
		var taxi = disp.getDriver( id );
		var car = disp.getDriverCar( id );
		if( !car ) {
			return "no-car";
		}
                                                            // src/widgets/monitor/queues-widget/items.js:196
		var className = 'car';
		if( car.body_type ) className += ' ' + car.body_type;
                                                            // src/widgets/monitor/queues-widget/items.js:199
		var currentOrders = disp.getDriverOrders( id ).filter( function( o ) {
			return !o.closed();
		});
		if( currentOrders.length > 0 || taxi.is_busy == 1 ) {
			className += ' busy';
		}
                                                            // src/widgets/monitor/queues-widget/items.js:206
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
                                                            // src/widgets/monitor/queues-widget/items.js:219
		if( !taxi.online() ) {
			className += ' offline';
		}
                                                            // src/widgets/monitor/queues-widget/items.js:223
		if( taxi["is_fake"] == '1' ) {
			className += ' fake';
		}
                                                            // src/widgets/monitor/queues-widget/items.js:227
		/*
		 * If the driver falls into a previously defined selection,
		 * add the corresponding class.
		 */
		for( var selectClass in selections )
		{
			var filters = selections[selectClass];
			for( var i = 0; i < filters.length; i++ )
			{
				var f = filters[i];
				if( obj.match( taxi, f ) ) {
					className += ' ' + selectClass;
					break;
				}
			}
		}
                                                            // src/widgets/monitor/queues-widget/items.js:244
		return className;
	}
                                                            // src/widgets/monitor/queues-widget/items.js:247
	function getTitle( id )
	{
		var driver = disp.getDriver( id );
		var car = disp.getDriverCar( id );
		var parts = [];
		if( car ) parts.push( car.format() );
		parts.push( driver.format() );
		parts.push( driver.blockDesc() );
		parts = parts.filter( hasValue );
		return parts.join( ', ' );
	}
}


// src/widgets/monitor/queues-widget/queues-widget.js
function QueuesWidget( disp, options )
{
	options = options || {};
	var items = new QueuesWidgetItems( disp );
	var table = new QueuesWidgetTable( disp, items );
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:6
	var listeners = new Listeners([
		"driver-click"
	]);
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:10
	this.on = listeners.add.bind( listeners );
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:12
	this.root = function() {
		return table.root();
	};
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:16
	this.selectDrivers = function( filter, className ) {
		items.select( filter, className );
	};
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:20
	this.selectedDrivers = function( className ) {
		return items.selectedItems( className );
	};
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:24
	this.addSelection = function( id, className ) {
		items.addSelection( id, className );
	};
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:28
	this.removeSelection = function( id, className ) {
		items.removeSelection( id, className );
	};
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:32
	this.toggleSelection = function( id, className ) {
		items.toggleSelection( id, className );
	};
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:36
	this.invertSelection = function( className ) {
		items.invertSelection( className );
	};
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:40
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
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:53
	//--
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:55
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
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:66
	trackDrivers();
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:68
	if( !options.disableDragging ) {
		initQueueDragging( disp, table );
	}
	initQueueClicking( disp, table, listeners );
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:73
	//--
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:75
	function addQueues()
	{
		if( disp.sessionsEnabled() ) {
			table.addQueue({id: table.NO_SESSION, name: "Не вышли на смену"});
		}
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:81
		table.addQueue({id: table.BLOCKED, name: "Заблокированы"});
		table.addQueue( {id: table.NONE, name: "Не записаны"});
		/*
		 * If there are drivers who don't have access to any queues,
		 * add a special row for them.
		 */
		if( disp.haveNonQueueGroups() ) {
			table.addQueue( {id: table.CITY, name: "Город"} );
		}
		table.addRule( '' );
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:92
		disp.queues().forEach( function( q ) {
			table.addQueue( q );
		});
	}
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:97
	function fillDrivers()
	{
		var map = {};
		function push( qid, val ) {
			if( !(qid in map) ) map[qid] = [val];
			else map[qid].push( val );
		}
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:105
		disp.drivers().forEach( function( d )
		{
			if( !d.online() ) return;
			if( disp.getDriverQueue( d.id ) ) {
				return;
			}
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:112
			if( d.blocked() ) {
				push( table.BLOCKED, d.id );
				return;
			}
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:117
			if( disp.sessionRequired( d.id ) ) {
				push( table.NO_SESSION, d.id );
				return;
			}
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:122
			if( disp.allowedQueues( d.id ).length == 0 ) {
				push( table.CITY, d.id );
				return;
			}
			push( table.NONE, d.id );
		});
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:129
		disp.queues().forEach( function( q ) {
			disp.getQueueDrivers( q.id ).forEach( function( driver, pos ) {
				push( q.id, driver.id );
			});
		});
		table.setDrivers( map );
	}
                                                            // src/widgets/monitor/queues-widget/queues-widget.js:137
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


// src/widgets/monitor/queues-widget/table.js
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
                                                            // src/widgets/monitor/queues-widget/table.js:14
	var $table = $( s );
	var $tbody = $table.find( "tbody" );
                                                            // src/widgets/monitor/queues-widget/table.js:17
	var queues = {};
	var listeners = new Listeners([ "head-click", "item-click" ]);
                                                            // src/widgets/monitor/queues-widget/table.js:20
	this.root = function() {
		return $table.get(0);
	};
                                                            // src/widgets/monitor/queues-widget/table.js:24
	this.on = listeners.add.bind( listeners );
                                                            // src/widgets/monitor/queues-widget/table.js:26
	initEvents();
                                                            // src/widgets/monitor/queues-widget/table.js:28
	//--
                                                            // src/widgets/monitor/queues-widget/table.js:30
	function initEvents()
	{
		$table.on( 'click', 'td', convert );
		$table.on( 'contextmenu', 'td', convert );
                                                            // src/widgets/monitor/queues-widget/table.js:35
		function convert( event )
		{
			event.preventDefault();
			var $t = $( event.target );
			var $tr = $t.parents( "tr" );
                                                            // src/widgets/monitor/queues-widget/table.js:41
			var data = {
				qid: $tr.data( "qid" ),
				button: event.which - 1,
				ctrlKey: event.ctrlKey,
				shiftKey: event.shiftKey
			};
                                                            // src/widgets/monitor/queues-widget/table.js:48
			if( $t.hasClass( "queue-head" ) ) {
				listeners.call( "head-click", data );
				return;
			}
                                                            // src/widgets/monitor/queues-widget/table.js:53
			if( $t.hasClass( "car" ) ) {
				data.id = $t.data( "id" );
				listeners.call( "item-click", data );
				return;
			}
		}
	}
                                                            // src/widgets/monitor/queues-widget/table.js:61
	this.initDragging = function( onDragStart, onDragEnd, onDragCancel )
	{
		$table.on( 'selectstart', function( event ) {
			event.preventDefault();
		});
                                                            // src/widgets/monitor/queues-widget/table.js:67
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
                                                            // src/widgets/monitor/queues-widget/table.js:80
			var data = {
				id: $t.data( "id" ),
				qid: $tr.data( "qid" ),
				pos: $td.data( "pos" )
			};
                                                            // src/widgets/monitor/queues-widget/table.js:86
			return onDragStart( data );
		};
                                                            // src/widgets/monitor/queues-widget/table.js:89
		opt.onDragEnd = function( item, dest )
		{
			var $t = $( item );
			var $td = $( dest );
			var $tr = $td.parent();
                                                            // src/widgets/monitor/queues-widget/table.js:95
			/*
			 * Filter cells that are not part of queues.
			 */
			var pos = $td.data( "pos" );
			if( typeof pos == "undefined" ) {
				return false;
			}
                                                            // src/widgets/monitor/queues-widget/table.js:103
			var data = {
				id: $t.data( "id" ),
				qid: $tr.data( "qid" ),
				pos: pos
			};
			return onDragEnd( data );
		};
                                                            // src/widgets/monitor/queues-widget/table.js:111
		opt.onDragCancel = function( item ) {
			onDragCancel( item );
		};
                                                            // src/widgets/monitor/queues-widget/table.js:115
		opt.itemsSelector = "td > *";
		opt.landsSelector = "td";
		initDrag( $table.get(0), opt );
	};
                                                            // src/widgets/monitor/queues-widget/table.js:120
	this.empty = function() {
		$tbody.empty();
		queues = {};
	};
                                                            // src/widgets/monitor/queues-widget/table.js:125
	this.addQueue = function( q, rows )
	{
		if( !rows ) rows = 1;
		var qid = q.id;
                                                            // src/widgets/monitor/queues-widget/table.js:130
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
                                                            // src/widgets/monitor/queues-widget/table.js:141
		for( i = 0; i < q.min; i++ ) {
			Q.cells[i].className = 'req';
		}
	};
                                                            // src/widgets/monitor/queues-widget/table.js:146
	this.addRule = function( name )
	{
		name = name || '';
		var s = '<tr><th colspan="'+(QUEUE_COLUMNS + 1)+'">'+name+'</th></tr>';
		$table.append( s );
	};
                                                            // src/widgets/monitor/queues-widget/table.js:153
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
                                                            // src/widgets/monitor/queues-widget/table.js:174
	function removeDrivers()
	{
		for( var qid in queues ) {
			queues[qid].items.forEach( function( item ) {
				item.remove();
			});
		}
	}
                                                            // src/widgets/monitor/queues-widget/table.js:183
	this.selectQueues = function( ids, className )
	{
		highlightRows( ids.map( toInt ), className );
	};
                                                            // src/widgets/monitor/queues-widget/table.js:188
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
                                                            // src/widgets/monitor/queues-widget/table.js:201
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
                                                            // src/widgets/monitor/queues-widget/table.js:217
	//--
                                                            // src/widgets/monitor/queues-widget/table.js:219
	function createRow( Q, q )
	{
		var qid = q.id;
                                                            // src/widgets/monitor/queues-widget/table.js:223
		var row = document.createElement( 'tr' );
		row.setAttribute( 'data-qid', qid );
		Q.rows.push( row );
                                                            // src/widgets/monitor/queues-widget/table.js:227
		/*
		 * The leftmost cell, the head.
		 */
		var td = document.createElement( 'td' );
		td.className = 'queue-head';
		td.innerHTML = q.name;
                                                            // src/widgets/monitor/queues-widget/table.js:234
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
                                                            // src/widgets/monitor/queues-widget/table.js:245
		/*
		 * Cars number indicator.
		 */
		var number = document.createElement( 'span' );
		number.className = 'number';
		Q.number = number;
		number.innerHTML = '0';
		td.appendChild( number );
		row.appendChild( td );
                                                            // src/widgets/monitor/queues-widget/table.js:255
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


// src/widgets/orders-list/cancel-dialog.js
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
                                                            // src/widgets/orders-list/cancel-dialog.js:14
	var d = new Dialog( $content.get(0) );
	d.addButton( 'Отменить заказ', cancel, 'yes' );
	d.addButton( 'Закрыть окно', null, 'no' );
	d.show();
                                                            // src/widgets/orders-list/cancel-dialog.js:19
	function cancel()
	{
		var reason = $reason.val();
		var restore = $restore.is( ':checked' );
                                                            // src/widgets/orders-list/cancel-dialog.js:24
		var p = disp.cancelOrder( order.order_uid, reason );
		if( restore && order.taxi_id ) {
			p.then( function() {
				disp.restoreDriverQueue( order.taxi_id )
			});
		}
		this.close();
	}
}


// src/widgets/orders-list/orders-widget.js
function OrdersWidget( disp, options )
{
	options = options || {};
	var $container = createList();
	var listeners = new Listeners( ['order-click', 'cancel-click'] );
                                                            // src/widgets/orders-list/orders-widget.js:6
	this.on = listeners.add.bind( listeners );
                                                            // src/widgets/orders-list/orders-widget.js:8
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/widgets/orders-list/orders-widget.js:12
	/*
	 * order id => array of timeouts.
	 */
	var timeouts = {};
                                                            // src/widgets/orders-list/orders-widget.js:17
	/*
	 * Fill the widget with orders from the current list.
	 */
	disp.orders().forEach( function( order ) {
		addOrder( order );
	});
                                                            // src/widgets/orders-list/orders-widget.js:24
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
                                                            // src/widgets/orders-list/orders-widget.js:37
	//--
                                                            // src/widgets/orders-list/orders-widget.js:39
	/*
	 * Orders go into separate "sublists" depending on their status,
	 * and they are sorted by different time values depending of which
	 * sublist they are. To unify all that, every list item is assigned
	 * a "stamp" determined by order status and relevant time value.
	 */
                                                            // src/widgets/orders-list/orders-widget.js:46
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
                                                            // src/widgets/orders-list/orders-widget.js:60
		$list.on( 'click', '.order', function( event ) {
			var uid = $(this).data( 'uid' );
			var order = disp.getOrder( uid );
			listeners.call( 'order-click', {order: order} );
		});
                                                            // src/widgets/orders-list/orders-widget.js:66
		$list.on( 'click', '.cancel', function( event ) {
			event.stopPropagation();
			var $t = $( this ).parents( '.order' );
			var uid = $t.data( 'uid' );
			var order = disp.getOrder( uid );
			listeners.call( 'cancel-click', {order: order} );
		});
                                                            // src/widgets/orders-list/orders-widget.js:74
		return $list;
	}
                                                            // src/widgets/orders-list/orders-widget.js:77
	function addOrder( order )
	{
		var $el = $( '<div></div>' );
		$el.data( 'uid', order.order_uid );
		$el.data( 'stamp', orderStamp( order ) );
		updateItem( $el, order );
		insertItem( $el, order );
		addTimers( order, $el );
	};
                                                            // src/widgets/orders-list/orders-widget.js:87
	function updateOrder( order )
	{
		var $el = findItem( order );
		if( !$el ) {
			console.warn( "updateOrder: no element" );
			addOrder( order );
			return;
		}
                                                            // src/widgets/orders-list/orders-widget.js:96
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
                                                            // src/widgets/orders-list/orders-widget.js:109
		removeTimers( order );
		addTimers( order, $el );
	};
                                                            // src/widgets/orders-list/orders-widget.js:113
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
                                                            // src/widgets/orders-list/orders-widget.js:126
		/*
		 * If have timers, remove them.
		 */
		removeTimers( order );
	};
                                                            // src/widgets/orders-list/orders-widget.js:132
	// --
                                                            // src/widgets/orders-list/orders-widget.js:134
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
                                                            // src/widgets/orders-list/orders-widget.js:145
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
                                                            // src/widgets/orders-list/orders-widget.js:156
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
                                                            // src/widgets/orders-list/orders-widget.js:176
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
                                                            // src/widgets/orders-list/orders-widget.js:193
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
                                                            // src/widgets/orders-list/orders-widget.js:209
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
                                                            // src/widgets/orders-list/orders-widget.js:228
	function addTimers( order, $el )
	{
		if( !order.postponed() ) return;
		var a = [];
                                                            // src/widgets/orders-list/orders-widget.js:233
		var times = [
			order.reminder_time - time.utc() - 300, // "soon"
			order.exp_arrival_time - time.utc(), // "urgent"
			order.reminder_time - time.utc() // "expired"
		];
                                                            // src/widgets/orders-list/orders-widget.js:239
		times.forEach( function( t ) {
			if( t <= 0 ) return;
			var tid = setTimeout( updateItem.bind( undefined, $el, order ), t * 1000 );
			a.push( tid );
		});
                                                            // src/widgets/orders-list/orders-widget.js:245
		if( a.length > 0 ) {
			timeouts[order.id] = a;
		}
	}
                                                            // src/widgets/orders-list/orders-widget.js:250
	function removeTimers( order )
	{
		if( order.id in timeouts ) {
			var a = timeouts[order.id];
			delete timeouts[order.id];
			while( a.length ) clearTimeout( a.shift() );
		}
	}
                                                            // src/widgets/orders-list/orders-widget.js:259
	//--
                                                            // src/widgets/orders-list/orders-widget.js:261
	function getClassName( order )
	{
		if( !order.postponed() ) {
			return order.closed() ? 'closed' : 'current';
		}
                                                            // src/widgets/orders-list/orders-widget.js:267
		var now = time.utc();
		var t1 = order.reminder_time;
		var t2 = order.exp_arrival_time;
		if( t1 > t2 ) {
			t1 = t2;
		}
                                                            // src/widgets/orders-list/orders-widget.js:274
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
                                                            // src/widgets/orders-list/orders-widget.js:290
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
                                                            // src/widgets/orders-list/orders-widget.js:303
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
                                                            // src/widgets/orders-list/orders-widget.js:314
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
                                                            // src/widgets/orders-list/orders-widget.js:326
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
                                                            // src/widgets/orders-list/orders-widget.js:339
		var now = new Date( time.utc() * 1000 );
		if( d.getDate() == now.getDate()
			&& d.getMonth() == now.getMonth()
			&& d.getFullYear() == now.getFullYear() ) {
			return s;
		}
                                                            // src/widgets/orders-list/orders-widget.js:346
		var diff = (d.getTime() - now.getTime()) / 1000 / 3600 / 24;
                                                            // src/widgets/orders-list/orders-widget.js:348
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
                                                            // src/widgets/orders-list/orders-widget.js:363
		return s;
	}
                                                            // src/widgets/orders-list/orders-widget.js:366
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


// src/widgets/orders-table.js
function OrdersTableWidget( disp )
{
	var $container = $( '<div></div>' );
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/widgets/orders-table.js:7
	var controls = createControls( $container );
	var table = createTable( $container );
                                                            // src/widgets/orders-table.js:10
	controls.onChange( showTable );
	showTable();
                                                            // src/widgets/orders-table.js:13
	function createControls( $container )
	{
		var $c = $( '<div>\
			<label><input type="checkbox" checked> Текущие</label>\
			<label><input type="checkbox" checked> Отложенные</label>\
			<label><input type="checkbox"> Закрытые</label>\
		</div>' );
                                                            // src/widgets/orders-table.js:21
		var $cb = $c.find( 'input' );
		var $open = $cb.eq(0);
		var $pending = $cb.eq(1);
		var $closed = $cb.eq(2);
                                                            // src/widgets/orders-table.js:26
		function bool( $checkbox ) {
			return $checkbox.is( ':checked' );
		}
                                                            // src/widgets/orders-table.js:30
		$container.append( $c );
                                                            // src/widgets/orders-table.js:32
		return {
			onChange: function( f ) {
				$cb.on( 'change', f );
			},
			state: function() {
				return {
					open: bool( $open ),
					pending: bool( $pending ),
					closed: bool( $closed )
				};
			}
		};
	}
                                                            // src/widgets/orders-table.js:46
	function createTable( $container )
	{
		var header = [
			"time", "dispatcher", "customer", "addr", "comments",
			"driver", "car", "status"
		];
		var names = {
			time: "Время создания",
			dispatcher: "Диспетчер",
			customer: "Клиент",
			addr: "Адрес подачи",
			comments: "Комментарии",
			driver: "Водитель",
			car: "Автомобиль",
			status: "Состояние"
		};
                                                            // src/widgets/orders-table.js:63
		var t = new Table( header, names );
		t.appendTo( $container );
		return t;
	}
                                                            // src/widgets/orders-table.js:68
	function showTable()
	{
		var show = controls.state();
		table.empty();
		disp.orders().forEach( function( order )
		{
			if( order.closed() && !show.closed ) {
				return;
			}
			if( !order.closed() && !show.open ) {
				return;
			}
			if( order.postponed() && !show.pending ) {
				return;
			}
			table.add( formatRow( order ) );
		});
		table.show();
	}
                                                            // src/widgets/orders-table.js:88
	function formatRow( order )
	{
		var driver = disp.getDriver( order.taxi_id );
		var car = driver ? disp.getDriverCar( driver.id ) : null;
                                                            // src/widgets/orders-table.js:93
		var row = {
			time: formatDateTime( time.local( order.time_created ) ),
			dispatcher: order.owner_id,
			customer: formatCustomer( order ),
			addr: order.src.addr.format(),
			comments: order.comments,
			driver: driver? driver.format() : '',
			car: car? car.format() : '',
			status: order.statusName()
		};
                                                            // src/widgets/orders-table.js:104
		return row;
	}
                                                            // src/widgets/orders-table.js:107
	function formatCustomer( order )
	{
		if( !order.customer_phone ) {
			return order.customer_name;
		}
		var s = formatPhone( order.customer_phone );
		if( order.customer_name ) {
			s += ' (' + order.customer_name + ')';
		}
		return s;
	}
}


// src/widgets/service-log.js
function ServiceLogWidget( disp )
{
	var $container = $( '<div id="events-log"></div>' );
                                                            // src/widgets/service-log.js:4
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/widgets/service-log.js:8
	var MAX_LENGTH = 30;
	var length = 0;
                                                            // src/widgets/service-log.js:11
	dx.get( 'service-log', {n: MAX_LENGTH} )
	.then( function( src )
	{
		var n = src.length;
		if( !n ) return;
		length = n;
                                                            // src/widgets/service-log.js:18
		var s = '';
		for( var i = 0; i < n; i++ ) {
			s = '<p>' + html.escape( src[i].text ) + '</p>' + s;
		}
		$container.html( s );
	});
                                                            // src/widgets/service-log.js:25
	disp.on( 'service-log', function( event )
	{
		if( length >= MAX_LENGTH ) {
			$container.children().last().remove();
		}
		else {
			length++;
		}
		$container.prepend( '<p>' + html.escape( event.data.text ) + '</p>' );
	});
                                                            // src/widgets/service-log.js:36
	function update( done )
	{
		dx.get( 'service-log-update', {id: lastMessageId} )
		.then( done ).then( pushMessages )
	}
                                                            // src/widgets/service-log.js:42
	function pushMessages( src )
	{
		var n = src.length;
		if( !n ) return;
                                                            // src/widgets/service-log.js:47
		for( var i = 0; i < n; i++ )
		{
			var msg = src[i];
			if( length >= MAX_LENGTH ) {
				$container.children().last().remove();
			}
			else {
				length++;
			}
			$container.prepend( '<p>' + html.escape( msg.text ) + '</p>' );
		}
		lastMessageId = src[n-1].message_id;
	}
}


// src/widgets/sessions.js
function SessionsWidget( disp )
{
	var $container = $( '<div></div>' );
                                                            // src/widgets/sessions.js:4
	this.root = function() {
		return $container.get(0);
	};
                                                            // src/widgets/sessions.js:8
	var $button = $( '<button type="button">Открыть смену</button>' );
	$button.on( 'click', function() {
		showOpenSessionDialog();
	});
	$container.append( $button );
                                                            // src/widgets/sessions.js:14
	var $table = $( '<table class="items"><thead>'
		+ '<tr><th>Начало</th>'
		+ '<th>Водитель</th>'
		+ '<th>Машина</th>'
		+ '<th></th>'
		+ '</thead><tbody></tbody>' );
	var $tbody = $table.find( 'tbody' );
	$container.append( $table );
	$tbody.on( 'click', 'button', function( event )
	{
		var driver_id = $( this ).data( 'driver_id' );
		if( !driver_id ) {
			return;
		}
		closeSessionClick.call( this, driver_id );
	});
                                                            // src/widgets/sessions.js:31
	disp.on( 'sessions-changed', refresh );
	refresh();
                                                            // src/widgets/sessions.js:34
	//--
                                                            // src/widgets/sessions.js:36
	function closeSessionClick( driver_id )
	{
		var button = this;
                                                            // src/widgets/sessions.js:40
		var d = disp.getDriver( driver_id );
		/*
		 * If the driver is an imitation, close the session without
		 * asking.
		 */
		if( d.is_fake == '1' ) {
			button.disabled = true;
			disp.closeSession( driver_id, 0 );
			return;
		}
		/*
		 * If the driver is real, ask for the odometer value before
		 * closing.
		 */
		showCloseSessionDialog( driver_id );
	}
                                                            // src/widgets/sessions.js:57
	function refresh()
	{
		var str = '';
		disp.sessions().forEach( function( s )
		{
			var driver = disp.getDriver( s.driver_id );
			var car = disp.getDriverCar( s.driver_id );
			str += '<tr><td>' + formatDateTime( time.local( s.time_started ) ) + '</td>'
			+ '<td>' + driver.call_id + '</td>'
			+ '<td>' + car.name + '</td>'
			+ '<td><button type="button" data-id="'+s.session_id+'" data-driver_id="'+s.driver_id+'">Закрыть</button>'
			+ '</tr>';
		});
		$tbody.html( str );
	}
}
                                                            // src/widgets/sessions.js:74
var curOpenSessionDialog = null;
                                                            // src/widgets/sessions.js:76
function showOpenSessionDialog( driverId )
{
	if( driverId && !disp.sessionRequired( driverId ) ) {
		return;
	}
                                                            // src/widgets/sessions.js:82
	if( curOpenSessionDialog && curOpenSessionDialog.isOpen() ) {
		curOpenSessionDialog.focus();
		return;
	}
                                                            // src/widgets/sessions.js:87
	var drivers = disp.drivers();
                                                            // src/widgets/sessions.js:89
	var s = '<select><option value="0"></option>';
	var n = 0;
	disp.drivers().forEach( function( driver ) {
		if( !disp.sessionRequired( driver.driver_id ) ) {
			return;
		}
		n++;
		s += tpl( '<option value="?">? - ?</option>',
			driver.id, driver.call_id, driver.surname() );
	});
	s += '</select>';
                                                            // src/widgets/sessions.js:101
	if( !n ) {
		toast( "Все смены уже открыты" );
		return;
	}
                                                            // src/widgets/sessions.js:106
	s = '<div><label>Водитель</label>' + s + '</div>'
		+ '<div><label>Одометр</label>'
		+ '<input type="number" min="0" step="1"></div>';
	var $s = $( '<div>' + s + '</div>' );
	var $id = $s.find( 'select' );
	var $km = $s.find( 'input' );
                                                            // src/widgets/sessions.js:113
	if( driverId ) {
		$id.val( driverId );
	}
                                                            // src/widgets/sessions.js:117
	curOpenSessionDialog = new Dialog( $s.get(0) );
	curOpenSessionDialog.addButton( "Открыть", function()
	{
		var driver_id = $id.val();
		var odometer = $km.val();
		if( driver_id == '0' ) {
			toast( "Не выбран водитель" );
			return;
		}
		disp.openSession( driver_id, odometer )
		.catch( function( error ) {
			Dialog.show( sessionError( error ) );
		});
		curOpenSessionDialog.close();
	}, "yes" );
                                                            // src/widgets/sessions.js:133
	curOpenSessionDialog.addButton( "Отменить", null, "no" );
	curOpenSessionDialog.show();
}
                                                            // src/widgets/sessions.js:137
function showCloseSessionDialog( driver_id )
{
	var driver = disp.getDriver( driver_id );
	if( !driver ) {
		console.error( "Unknown driver id: ", driver_id );
		return;
	}
                                                            // src/widgets/sessions.js:145
	var $s = $( '<div><label>Одометр</label>'
		+ '<input type="number" min="0" step="1"></div>' );
	var d = new Dialog( $s.get(0) );
	d.setTitle( "Закрытие смены для " + driver.call_id );
	d.addButton( "Закрыть", function()
	{
		var odometer = $s.find( 'input' ).val();
		disp.closeSession( driver_id, odometer );
		d.close();
	}, "yes" );
	d.addButton( "Отменить", function() {
		d.close();
	}, "no" );
	d.show();
}


// src/widgets/status-bar.js
function StatusBarWidget( disp )
{
	var $c = $( '<div id="status-bar">\
		<div class="indicators">\
			<span class="no-sound hidden">Звук на нуле</span>\
			<span class="rtt"></span>\
			<span class="no-ping hidden">Нет связи с сервером</span>\
		</div>\
		<div class="buttons"></div>\
	</div>' );
                                                            // src/widgets/status-bar.js:11
	var $buttons = $c.find( '.buttons' );
                                                            // src/widgets/status-bar.js:13
	this.root = function() {
		return $c.get(0);
	};
                                                            // src/widgets/status-bar.js:17
	var _this = this;
                                                            // src/widgets/status-bar.js:19
	disp.on( "setting-changed", sync );
	function sync() {
		//this.show( 'no-sound', sound.vol() == 0 );
	}
                                                            // src/widgets/status-bar.js:24
	setInterval( function() {
		var rtt = disp.RTT();
		_this.set( 'rtt', rtt + ' мс' );
		_this.show( 'no-ping', rtt > 5000 );
	}, 1000 );
                                                            // src/widgets/status-bar.js:30
	this.show = function( className, visible )
	{
		if( visible ) {
			$c.find( '.' + className ).removeClass( 'hidden' );
		} else {
			$c.find( '.' + className ).addClass( 'hidden' );
		}
	};
                                                            // src/widgets/status-bar.js:39
	this.set = function( className, html ) {
		$c.find( '.' + className ).html( html );
	};
                                                            // src/widgets/status-bar.js:43
	this.addButton = function( className, title ) {
		var $button = $( '<button type="button" class="'+className+'">'+title+'</button>' );
		$buttons.append( $button );
		return $button;
	};
}


// src/widgets/tabs.js
function TabsWidget()
{
	var p = document.createElement( 'div' );
	var tabs = new Tabs( p );
                                                            // src/widgets/tabs.js:5
	tabs.onChange( function() {
		$( window ).trigger( "resize" );
	});
                                                            // src/widgets/tabs.js:9
	this.count = tabs.count.bind( tabs );
	this.setPage = function( index ) {
		tabs.setCurrentPage( index );
		$( window ).trigger( "resize" );
	};
                                                            // src/widgets/tabs.js:15
	this.next = function() {
		var i = tabs.getCurrentPage() + 1;
		tabs.setCurrentPage( i % tabs.count() );
		$( window ).trigger( "resize" );
	};
                                                            // src/widgets/tabs.js:21
	this.root = function() {
		return p;
	};
                                                            // src/widgets/tabs.js:25
	this.addTab = tabs.addPage.bind( tabs );
}

})();
