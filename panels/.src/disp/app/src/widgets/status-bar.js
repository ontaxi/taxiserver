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

	var $buttons = $c.find( '.buttons' );

	this.root = function() {
		return $c.get(0);
	};

	var _this = this;

	disp.on( "setting-changed", sync );
	function sync() {
		//this.show( 'no-sound', sound.vol() == 0 );
	}

	setInterval( function() {
		var rtt = disp.RTT();
		_this.set( 'rtt', rtt + ' мс' );
		_this.show( 'no-ping', rtt > 5000 );
	}, 1000 );

	this.show = function( className, visible )
	{
		if( visible ) {
			$c.find( '.' + className ).removeClass( 'hidden' );
		} else {
			$c.find( '.' + className ).addClass( 'hidden' );
		}
	};

	this.set = function( className, html ) {
		$c.find( '.' + className ).html( html );
	};

	this.addButton = function( className, title ) {
		var $button = $( '<button type="button" class="'+className+'">'+title+'</button>' );
		$buttons.append( $button );
		return $button;
	};
}
