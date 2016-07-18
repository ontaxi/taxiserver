function PostponeSection( $container )
{
	var $top = $( html.checkbox( "Отложить заказ" ) );
	var $sub = $( '<div></div>' );
	$sub.html( html.input( "Время подачи машины", "datetime-local" )
		+ '<label>Напоминание</label><input type="number" min="0" step="5" value="5" size="2"> мин. до подачи' );
	$container.append( $top );
	$container.append( $sub );

	var $checkbox = $top.filter( "input" ).eq(0);
	var $time = $sub.find( "input" ).eq(0);
	var $remind = $sub.find( "input" ).eq(1);

	html5.fix( $time.get(0) );

	/*
	 * Because these elements are not inserted into the document yet,
	 * jQuery's 'slideUp' won't work, so we additionally call 'hide'
	 * at the beginning if necessary.
	 */
	if( !$checkbox.get(0).checked ) {
		$sub.hide();
	}

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

	this.set = function( order )
	{
		if( order.exp_arrival_time )
		{
			$checkbox.prop( 'checked', true );
			$sub.show();

			setTime( order.exp_arrival_time );

			var min = Math.round((order.exp_arrival_time - order.reminder_time)/60);
			$remind.val( min )
			enable();
		}
		else {
			$checkbox.prop( 'checked', false );
			disable();
		}
	};

	//--

	function enable() {
		$time.prop( 'disabled', false );
		$remind.prop( 'disabled', false );
	}

	function disable() {
		$time.prop( 'disabled', true );
		$remind.prop( 'disabled', true );
	}

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

	function getTime()
	{
		var d = parseDateTime( $time.val() );
		if( !d ) return null;
		return time.utc( Math.round( d.getTime() / 1000 ) );
	}

	//--

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

		var Y = m[1];
		var M = m[2] - 1; /* 0-based, surprise! */
		var D = m[3];
		var h = m[4];
		var m = m[5];
		return new Date( Y, M, D, h, m );
	}
}
