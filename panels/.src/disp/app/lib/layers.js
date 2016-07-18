var Layers = (function() {
	var Layers = {};

	var CLASS = 'w-layer';
	var $win = $( window );

	var layers = [];

	Layers.create = function( contentNode, coords )
	{
		var $l = $( '<div class="'+CLASS+'"></div>' );
		$l.css({
			"position": "absolute"
		});
		$(document.body).append( $l );

		if( contentNode ) {
			$l.append( contentNode );
		}

		/*
		 * Fix the layer's width to avoid reflowing at screen edges.
		 */
		var w = $l.width();
		if( w ) {
			$l.width( w );
		}

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

		/*
		 * Move focus to the new layer.
		 */
		moveFocus( $l );

		var removeListeners = [];
		function remove() {
			removeListeners.forEach( function( f ) {
				f();
			});
			removeListeners = null;
			removeLayer( $l );
		}

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

	function defaultCoords( $l )
	{
		var w = $l.outerWidth();
		var h = $l.outerHeight();
		var W = $win.width();
		var H = $win.height();

		var x = $win.scrollLeft() + (W - w) / 2;
		var y = $win.scrollTop() + (H - h) / 2;

		/*
		 * Shift the layer if there are others.
		 */
		var delta = 20 * layers.length;
		x += delta;
		y += delta;

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

		return [x, y];
	}

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

	/*
	 * When a layer is clicked, move the focus to it.
	 */
	$win.on( 'mousedown', function( event )
	{
		var $l = targetLayer( event );
		if( !$l ) return;
		moveFocus( $l );
	});

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

	/*
	 * Dragging.
	 */
	var $drag = null;
	var dragOffset = [0, 0];

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

		event.preventDefault();
		var off = $t.offset();

		dragOffset = [
			event.pageX - off.left,
			event.pageY - off.top
		];
		$drag = $t;
		$drag.addClass( "dragging" );
	});

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

	$win.on( 'mouseup', function() {
		if( !$drag ) return;
		$drag.removeClass( "dragging" );
		$drag = null;
	});

	return Layers;
})();
