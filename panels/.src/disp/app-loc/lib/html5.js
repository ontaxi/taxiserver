/*
	Compilation date: 2015-12-07
	Number of files: 3
*/
(function() {
"use strict";

// src/html5.js
window.html5 = {};

var emulations = {};

function addEmulation( type, func ) {
	emulations[type] = func;
}

$(document).ready( init );

function init()
{
	for( var type in emulations )
	{
		if( inputTypeSupported( type ) ) {
			continue;
		}

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

/*
 * Tells whether given input type is supported by the browser.
 */
function inputTypeSupported( type )
{
	var i = document.createElement( 'input' );
	i.setAttribute( 'type', type );
	return i.type == type;
}

html5.fix = function( element )
{
	if( element.tagName.toLowerCase() != "input" ) {
		throw "Can't fix " + element.tagName;
	}

	var type = element.getAttribute( "type" );
	if( !type ) {
		throw "The input doesn't have a type";
	}

	/*
	 * If this input type is supported, return.
	 */
	if( element.type == type ) {
		return;
	}

	var f = emulations[type];
	if( !f ) {
		throw "No fix for input type " + type;
	}

	f( element );
	$( element ).addClass( 'emulated' );
};


// src/misc.js
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

/*
 * For some reason parts.map(parseInt) doesn't work,
 * but parts.map(intval) does.
 */
function intval( s ) {
	return parseInt( s, 10 );
}

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

	if( !match ) return null;

	var Y = match[1];
	var M = match[2] - 1; /* 0-based, surprise! */
	var D = match[3];
	var h = match[4];
	var m = match[5];
	var s = (match.length > 6)? match[6] : 0;
	var d = new Date( Y, M, D, h, m, s );
	return d;
}

function composeDateTime( d )
{
	return d.getFullYear() + '-' + twoDigits( d.getMonth() + 1 )
		+ '-' + twoDigits( d.getDate() )
		+ 'T' + twoDigits( d.getHours() )
		+ ':' + twoDigits( d.getMinutes() )
		+ ':' + twoDigits( d.getSeconds() );
}

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

function selectInputContents() {
	this.select();
}

function onValueChange( input, f ) {
	$( input ).on( 'change', f );
}


// src/types/datetime-local.js
addEmulation( 'datetime-local', function( input )
{
	var $input = $( input );
	var em = new DateTimeLocal( $input.get(0) );

	/*
	 * When original is changed, update the emulation.
	 */
	onValueChange( $input.get(0), function() {
		em.val( $input.val() );
	});

	/*
	 * When emulation is changed, update the original.
	 */
	em.onChange( function() {
		$input.val( em.val() );
	});
});

function DateTimeLocal( input )
{
	var $input = $( input );
	$input.hide();

	var $c = $( '<div class="emulation-datetime-local"></div>' );
	var $date = $( '<input size="2" class="date">' );
	var $mon = $( '<input size="2" class="month">' );
	var $year = $( '<input size="4" class="year">' );
	var $hour = $( '<input size="2" class="hour">' );
	var $min = $( '<input size="2" class="minute">' );
	var $sec = $( '<input size="2" class="second">' );

	$c.append( $date );
	$c.append( $mon );
	$c.append( $year );
	$c.append( $hour );
	$c.append( $min );
	$c.append( $sec );
	$c.insertAfter( $input );

	$( '<span>&nbsp;</span>' ).insertAfter( $year );
	$( '<span>:</span>' ).insertAfter( $hour );
	$( '<span>:</span>' ).insertAfter( $min );
	$( '<span>.</span>' ).insertAfter( $date );
	$( '<span>.</span>' ).insertAfter( $mon );

	set( $input.val() );
	if( typeof( get() ) == "undefined" ) {
		$input.val( composeDateTime( new Date() ) );
		set( $input.val() );
	}

	var $all = $c.find( 'input' );

	$all.on( 'keypress', function( event )
	{
		var k = event.keyCode;
		if( k != KEY_UP && k != KEY_DOWN ) return;

		var n = parseInt( this.value );

		if( k == KEY_DOWN ) n--;
		else n++;

		this.value = twoDigits( n );
		$( this ).trigger( 'change' );
	});

	$all.on( 'change', function() {
		set( get() );
	});

	$all.on( 'focus', function() {
		this.select();
	});

	this.root = function() {
		return $c.get(0);
	};

	this.onChange = function( f ) {
		$all.on( 'change', f );
	};

	this.val = function( newval )
	{
		if( typeof newval == "undefined" ) {
			return get();
		}
		set( newval );
	};

	function set( str )
	{
		var date = parseDateTime( str );
		if( !date ) return;

		$year.val( date.getFullYear() );
		$mon.val( twoDigits( date.getMonth() + 1 ) );
		$date.val( twoDigits( date.getDate() ) );
		$hour.val( twoDigits( date.getHours() ) );
		$min.val( twoDigits( date.getMinutes() ) );
		$sec.val( twoDigits( date.getSeconds() ) );
	}

	function get()
	{
		var year = intval( $year.val() );
		var mon = intval( $mon.val() );
		var day = intval( $date.val() );
		var hour = intval( $hour.val() );
		var min = intval( $min.val() );
		var sec = intval( $sec.val() );

		var d = new Date( year, mon - 1, day, hour, min, sec );
		if( isNaN( d.getTime() ) ) {
			return undefined;
		}

		var str = composeDateTime( d );
		return str;
	}
}

})();
