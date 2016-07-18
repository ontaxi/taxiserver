var AnnounceDialog = ( function() {

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

	$reset.on( "click", function() {
		input.clear();
	});

	$phrases.on( "click", function() {
		phrases.toggle();
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

	function send()
	{
		var str = input.get();
		if( str == "" ) return;

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

	function disable()
	{
		output.disable();
		input.disable();
		$buttons.prop( "disabled", true );
	}

	function enable()
	{
		output.enable();
		input.enable();
		$buttons.prop( "disabled", false );
	}

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
		var s = fmt( '<article class="dispatcher-broadcast"><p><time>%s</time> %s</p></article>',
			formatTime( time.local( message.utc ) ),
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

return AnnounceDialog;
})();
