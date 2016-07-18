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

	if( !settings ) settings = {};
	for( var k in defaults ) {
		if( !(k in settings) ) {
			settings[k] = defaults[k];
		}
	}

	/*
	 * There are three states that we work with: (1) no dragging,
	 * (2) preparing to drag, and (3) dragging.
	 */
	var NONE = 0, PREPARING = 1, DRAGGING = 2;
	var state = NONE;

	var $window = $( window );

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

	/*
	 * Dragging the mouse in the 'dragging' state will do the actual
	 * moving.
	 */
	$window.on( "mousemove", function( event )
	{
		if( state != DRAGGING ) return;
		drag( event );
	});

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

	//--

	var $dragElement = null;
	var startVec = [0, 0];
	var originalPos = "static";
	var originalLeft = "auto";
	var originalTop = "auto";

	function init( event )
	{
		var $t = $( event.target );
		$dragElement = $t;
		originalPos = $dragElement.css( "position" );
		originalLeft = $dragElement.css( "left" );
		originalTop = $dragElement.css( "top" );
		startVec = [event.pageX, event.pageY];
	}

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

		return true;
	}

	/*
	 * Returns square of the distance between points 'vec' and 'pos'.
	 */
	function dist2( vec, pos ) {
		var dx = vec[0] - pos[0];
		var dy = vec[1] - pos[1];
		return dx * dx + dy * dy;
	}

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

	var parentVec = [0, 0];

	/*
	 * Start the dragging.
	 */
	function start( event )
	{
		var $parent = $dragElement.offsetParent();
		var pos = $parent.offset();
		parentVec = [pos.left, pos.top];

		$dragElement.css( "position", "absolute" );
		$container.addClass( "dragging" );
		$dragElement.addClass( "dragged" );
	}

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

		$dragElement.css({
			"left": vec[0] + "px",
			"top": vec[1] + "px"
		});
	}

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

	function finish( event )
	{
		var $t = $( event.target );
		if( $t.get(0) == $dragElement.parent().get(0) ) {
			cancel( event );
			return;
		}

		if( !$t.is( settings.landsSelector ) ) {
			$t = $t.parents( settings.landsSelector ).eq(0);
		}

		var ok = true;
		if( settings.onDragEnd ) {
			ok = settings.onDragEnd( $dragElement.get(0), $t.get(0) );
		}

		if( ok ) {
			$t.append( $dragElement );
		}

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
