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

	var $container = $( '<div class="w-dialog"></div>' );
	var $title = $( '<div class="title"></div>' );
	var $content = $( '<div class="content"></div>' );
	if( content ) {
		$content.append( content );
	}
	var $buttons = $( '<div class="buttons"></div>' );
	var $yesButton = null;
	var $noButton = null;

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

		$b.on( 'click', onclick.bind( this ) );
		$buttons.append( $b );

		switch( keytype ) {
			case 'yes':
				$yesButton = $b;
				break;
			case 'no':
				$noButton = $b;
				break;
		}

		return $b.get(0);
	};

	this.setTitle = function( title ) {
		$title.html( title );
	};

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

		if( $yesButton ) listenKeys( this, 13, $yesButton ); // enter
		if( $noButton ) listenKeys( this, 27, $noButton ); // escape

		layer.onBlur( function() {
			callListeners( 'blur' );
		});
		layer.onFocus( function() {
			callListeners( 'focus' );
		});
	};

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

	this.isOpen = function() {
		return layer != null;
	};

	this.focus = function() {
		layer.focus();
	};

	var listeners = {
		"focus": [],
		"blur": [],
		"close": []
	};

	function callListeners( type ) {
		for( var i = 0; i < listeners[type].length; i++ ) {
			listeners[type][i]();
		}
	}

	this.on = function( type, func ) {
		if( !(type in listeners) ) {
			throw "Unknown event type: " + type;
		}
		listeners[type].push( func );
	};
}

Dialog.show = function( msg ) {
	(new Dialog( msg )).show();
};
