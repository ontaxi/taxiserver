var Tabs = ( function() {

var ids = 0;

/*
 * Tabbed widget constructor. 'container' is a reference to the DOM
 * element which will be converted to the widget.
 */
function Tabs( container )
{
	var _this = this;
	/*
	 * Page "bundles".
	 * Each bundle has fields "$body", "$head" and "obj".
	 */
	var pages = [];

	/* Index of currently visible page. */
	var currentPageIndex = undefined;

	/* Array of "change" callbacks. */
	var changeListeners = [];

	var $container = $( container );
	$container.addClass( 'w-tabs' );

	var $headsContainer = $( '<div class="w-tabs-heads"></div>' );
	var $bodiesContainer = $( '<div class="w-tabs-bodies"></div>' );

	init( $container );

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

	function initEvents()
	{
		$headsContainer.on( 'click', '.w-tabs-head', function( event )
		{
			var index = getTabIndex( this );
			if( index < 0 ) {
				return;
			}
			event.preventDefault();
			setCurrentPage( index );
			triggerChange( index );
		});
	}

	function triggerChange( index )
	{
		var n = changeListeners.length;
		for( var i = 0; i < n; i++ ) {
			changeListeners[i].call( _this, index );
		}
	}

	function setCurrentPage( index )
	{
		if( index < 0 || index >= pages.length ) {
			return;
		}

		if( pages[index].disabled ) {
			return;
		}

		if( currentPageIndex >= 0 )
		{
			var page = pages[currentPageIndex];
			page.$head.removeClass( 'current' );
			page.$body.hide();
		}

		currentPageIndex = index;
		var page = pages[currentPageIndex];
		page.$head.addClass( 'current' );
		page.$body.show();
	}

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

		ids++;
		var id = '-w-tabs-id-' + ids;

		/*
		 * Create head and body
		 */
		var $head = $( '<a href="#'+id+'" class="w-tabs-head"></a>' );
		$head.html( title );
		var $body = $( '<div class="w-tabs-body" id="'+id+'"></div>' );
		if( container ) {
			$body.append( container );
		}

		var page = {
			$head: $head,
			$body: $body,
			obj: new Page( $head, $body ),
			disabled: false
		}

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

		$body.hide();
		if( typeof currentPageIndex == "undefined" ) {
			setCurrentPage( 0 );
		}
		return page.obj;
	};

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

	/*
	 * Returns number of currently selected page.
	 */
	function getCurrentPage() {
		return currentPageIndex;
	}

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

	function disablePage( index )
	{
		if( index < 0 || index >= pages.length ) {
			return;
		}

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

		var page = pages[index];
		page.disabled = true;
		page.$head.addClass( 'disabled' );
		page.$body.addClass( 'disabled' );
	}

	function enablePage( index )
	{
		if( index < 0 || index >= pages.length ) {
			return;
		}

		var page = pages[index];
		page.$head.removeClass( 'disabled' );
		page.$body.removeClass( 'disabled' );
		page.disabled = false;
	}

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

	function Page( $head, $body )
	{
		this.setContent = function( html ) {
			$body.html( html );
		};
	}

	this.onChange = function( func ) {
		changeListeners.push( func );
	};

	this.addPage = addPage;
	this.setCurrentPage = setCurrentPage;
	this.getCurrentPage = getCurrentPage;
	this.count = function() {
		return pages.length;
	};

	this.getPageAt = getPageAt;
	this.disablePage = disablePage;
	this.enablePage = enablePage;
}

return Tabs;

})();
