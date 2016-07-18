$(document).ready( function()
{
	var KEY_LEFT = 37;
	var KEY_UP = 38;
	var KEY_RIGHT = 39;
	var KEY_DOWN = 40;

	var emulations = {};
	emulations["datetime-local"] = em_datetime_local;

	function emulateInput( $input )
	{
		var type = $input.attr( 'type' );
		if( !( type in emulations ) || inputTypeSupported( type ) ) {
			return;
		}
		new emulations[type]( $input );
	}

	window.emulateInput = emulateInput;

	/*
	 * Tells whether given input type is supported by the browser.
	 */
	function inputTypeSupported( type )
	{
		var i = document.createElement( 'input' );
		i.setAttribute( 'type', type );
		return i.type == type;
	}

	for( var type in emulations )
	{
		if( inputTypeSupported( type ) ) {
			continue;
		}

		var $inputs = $( 'input[type="'+type+'"]' );
		$inputs.each( function()
		{
			var $t = $(this);
			if( $t.hasClass( 'dont-emulate' ) ) {
				return;
			}
			new emulations[type]( $(this) );
		});
	}
	/*
	 * For some reason parts.map(parseInt) doesn't work,
	 * but parts.map(intval) does.
	 */
	function intval( s )
	{
		return parseInt( s, 10 );
	}
	/*
	 * Parses a string like "2000-01-01T00:00[:00]" and returns a Date
	 * object.
	 */
	function parseDateTime( dt )
	{

		var re = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)$/;
		var m = dt.match( re );
		if( !m ) {
			re = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d)$/;
			m = dt.match( re );
		}

		if( !m ) return null;

		var d = new Date();
		var Y = m[1];
		var M = m[2] - 1; /* 0-based, surprise! */
		var D = m[3];
		var h = m[4];
		var m = m[5];
		var s = (m.length > 6)? m[6] : 0;
		return new Date( Y, M, D, h, m, s );
	}

	/*
	 * Adds leading zero to numbers less than 10.
	 */
	function twoDigits( number )
	{
		if( typeof number == "string" )
			number = parseInt( number );
		return ((number < 10)? '0' : '') + number.toString();
	}

	function selectInputContents()
	{
		this.select();
	}

	function em_datetime_local( $originalInput )
	{
		var $dt = $originalInput;
		/*
		 * Creates a bundle for the given datetime input. Bundle is a
		 * set of backup inputs imitating the datetime.
		 */
		function createBundle( $dt )
		{
			var bundle = {
				$date: $( '<input size="2" class="date">' ),
				$mon: $( '<input size="2" class="month">' ),
				$year: $( '<input size="4" class="year">' ),
				$hour: $( '<input size="2" class="hour">' ),
				$min: $( '<input size="2" class="minute">' ),
				$sec: $( '<input size="2" class="second">' )
			};

			var $c = $( '<div class="emulation-datetime-local"></div>' );
			$c.insertAfter( $dt );

			$c.append( bundle.$date );
			$c.append( bundle.$mon );
			$c.append( bundle.$year );
			$c.append( bundle.$hour );
			$c.append( bundle.$min );
			$c.append( bundle.$sec );

			$( '<span>&nbsp;</span>' ).insertAfter( bundle.$year );
			$( '<span>:</span>' ).insertAfter( bundle.$hour );
			$( '<span>:</span>' ).insertAfter( bundle.$min );
			$( '<span>.</span>' ).insertAfter( bundle.$date );
			$( '<span>.</span>' ).insertAfter( bundle.$mon );

			syncBundle( $dt, bundle );
			return bundle;
		}

		/*
		 * Moves datetime from the original input to the bundle.
		 */
		function syncBundle( $dt, bundle )
		{
			var date = parseDateTime( $dt.val() );
			if( !date ) return;

			bundle.$year.val( date.getFullYear() );
			bundle.$mon.val( twoDigits( date.getMonth() + 1 ) );
			bundle.$date.val( twoDigits( date.getDate() ) );
			bundle.$hour.val( twoDigits( date.getHours() ) );
			bundle.$min.val( twoDigits( date.getMinutes() ) );
			bundle.$sec.val( twoDigits( date.getSeconds() ) );
		}

		/*
		 * Moves datetime from the bundle to the original input.
		 */
		function syncOriginal( $dt, bundle )
		{
			var year = intval( bundle.$year.val() );
			var mon = intval( bundle.$mon.val() );
			var day = intval( bundle.$date.val() );
			var hour = intval( bundle.$hour.val() );
			var min = intval( bundle.$min.val() );
			var sec = intval( bundle.$sec.val() );

			if(
				(year < 1970)
				|| (mon > 12 || mon < 1)
				|| (day < 1 || day > 31)
				|| (hour < 0 || hour > 23)
				|| (min < 0 || min > 59)
				|| (sec < 0 || sec > 59)
			) {
				return false;
			}

			var s = year
			+ '-' + twoDigits( mon )
			+ '-' + twoDigits( day )
			+ 'T' + twoDigits( hour )
			+ ':' + twoDigits( min )
			+ ':' + twoDigits( sec );

			$dt.val( s );
			return true;
		}

		var bundle = createBundle( $dt );
		var $bundle = $();
		for( var i in bundle ) {
			$bundle = $bundle.add( bundle[i] );
		}

		$bundle.on( 'change', function()
		{
			var n = intval( this.value );
			if( !n && n !== 0 ) {
				syncBundle( $dt, bundle );
			}
			else if( !syncOriginal( $dt, bundle ) ) {
				syncBundle( $dt, bundle );
			}
			$dt.trigger( 'change' );
		});

		$bundle.on( 'keypress', function( event )
		{
			var k = event.keyCode;
			if( k != KEY_UP && k != KEY_DOWN ) return;

			var n = parseInt( this.value );
			if( k == KEY_DOWN && n == 0 ) return;

			if( k == KEY_DOWN ) n--;
			else n++;

			this.value = twoDigits( n );
			$( this ).trigger( 'change' );
		});

		$dt.on( 'change', function() {
			syncBundle( $dt, bundle );
		});

		$bundle.on( 'focus', selectInputContents );
		$dt.hide();
	}
});
