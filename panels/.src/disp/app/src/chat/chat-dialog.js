var ChatDialog = ( function() {

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

	this.on = function( type, func ) {
		d.on( type, func );
	};

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

	$reset.on( "click", function() {
		input.clear();
	});

	$phrases.on( "click", function() {
		phrases.toggle();
	});

	/*
	 * When the date range is changed, get and display the corresponding
	 * messages.
	 */
	picker.onChange( function( from, to ) {
		disable();

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

	init();

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

	//--

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

	function send()
	{
		var str = input.get();
		if( str == "" ) return;

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

	function showMessages( arr )
	{
		output.clear();

		var lastId = 0;
		arr.forEach( function( msg ) {
			output.add( msg );
			if( msg.from == driver.id ) {
				lastId = msg.id;
			}
		});

		if( lastId ) {
			disp.markChatMessages( driver.id, lastId );
		}
	}

	function disable()
	{
		picker.disable();
		output.disable();
		input.disable();
		$buttons.prop( "disabled", true );
	}

	function enable()
	{
		picker.enable();
		output.enable();
		input.enable();
		$buttons.prop( "disabled", false );
	}

	function initHeader( driver, $container ) {
		var $h = $( '<div class="header"></div>' );

		var call = driver.call_id;
		if( call.match( /^\d+$/ ) ) {
			call += "-м";
		}
		var str = "Чат с " + call;

		str += " (";

		str += driver.name;
		str += ", тел. " + driver.phone;

		var car = disp.getCar( driver.car_id );
		if( !car ) {
			str += ", без автомобиля";
		}
		else {
			str += tpl( ", ?, ?", car.name, car.plate );
		}
		str += ")";

		$h.html( str );
		$container.append( $h );
	}
}

function Picker( disp, $container )
{
	var $c = $( '<div class="picker"></div>' );
	var $prev = $( '<button type="button" class="prev">Прошлая неделя</button>' );
	var $next = $( '<button type="button" class="next">Следующая неделя</button>' );
	var $disp = $( '<span class="range-display"></span>' );
	var $all = $prev.add( $next );

	$c.append( $all );
	$c.append( $disp );
	$container.append( $c );

	var onChange = null;

	var from = new Date();
	var to = new Date();

	fixRange();

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

	function fixRange()
	{
		toWeekBegin( from );
		toWeekEnd( to );
		$disp.html( tpl( "?—?", formatDate( from ), formatDate( to ) ) );
	}

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

	function callChange() {
		onChange( time.utcFromDate( from ), time.utcFromDate( to ) );
	}

	this.onChange = function( f ) {
		onChange = f;
	};

	this.enable = function() {
		$all.prop( "disabled", false );
	};

	this.disable = function() {
		$all.prop( "disabled", true );
	};

	this.get = function() {
		return [time.utcFromDate( from ), time.utcFromDate( to )];
	};
}

function Input( disp, $container )
{
	var $t = $( '<textarea placeholder="Сообщение"></textarea>' );
	$container.append( $t );

	this.on = function( type, func ) {
		$t.on( type, func );
	};

	this.clear = function() {
		$t.val( "" );
	};

	this.get = function() {
		return $.trim( $t.val() );
	};

	this.append = function( str ) {
		var s = $t.val();
		if( s.length > 0 ) s += " ";
		s += str;
		$t.val( s );
	};

	this.disable = function() {
		$t.prop( "disabled", true );
	};
	this.enable = function() {
		$t.prop( "disabled", false );
	};
}

function Output( disp, $container )
{
	var $c = $( '<div class="output"></div>' );
	$container.append( $c );

	/*
	 * Stop mousedown events to avoid dialog dragging here.
	 */
	$c.on( "mousedown", function( event ) {
		event.stopPropagation();
	});

	var prevTime = 0;

	this.clear = function() {
		prevTime = 0;
		$c.empty();
	};

	this.add = function( message ) {
		if( !prevTime || !sameDay( prevTime, message.utc ) ) {
			writeDate( message.utc );
		}
		prevTime = message.utc;
		writeMessage( message );
		$c.get(0).scrollTop = $c.get(0).scrollHeight;
	};

	this.disable = function() {
		$c.addClass( "disabled" );
	};

	this.enable = function() {
		$c.removeClass( "disabled" );
	};

	function sameDay( utc1, utc2 )
	{
		var d1 = new Date( utc1 * 1000 );
		var d2 = new Date( utc2 * 1000 );
		var same = (d1.getFullYear() == d2.getFullYear() &&
			d1.getMonth() == d2.getMonth() &&
			d1.getDate() == d2.getDate());
		return same;
	}

	function writeDate( utc )
	{
		var d = new Date( time.local( utc ) * 1000 );
		var months = [ "января", "февраля", "марта", "апреля", "мая",
			"июня", "июля", "августа", "сентября", "октября",
			"ноября", "декабря" ];

		$c.append( '<h2 class="date">' + d.getDate() + ' ' +
			months[d.getMonth()] + ' ' + d.getFullYear() + '</h2>' );
	}

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

	var onSelect = null;
	$c.on( "click", "div", function( event ) {

		var id = $( this ).data( "id" );
		if( typeof id == "undefined" ) return;
		onSelect( phrases[id] );
		$c.removeClass( "open" );
	});

	this.toggle = function() {
		$c.toggleClass( "open" );
	};

	this.hide = function() {
		$c.removeClass( "open" );
	};

	this.onSelect = function( f ) {
		onSelect = f;
	};
}

return ChatDialog;
})();
