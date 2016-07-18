function TabsWidget()
{
	var p = document.createElement( 'div' );
	var tabs = new Tabs( p );

	tabs.onChange( function() {
		$( window ).trigger( "resize" );
	});

	this.count = tabs.count.bind( tabs );
	this.setPage = function( index ) {
		tabs.setCurrentPage( index );
		$( window ).trigger( "resize" );
	};

	this.next = function() {
		var i = tabs.getCurrentPage() + 1;
		tabs.setCurrentPage( i % tabs.count() );
		$( window ).trigger( "resize" );
	};

	this.root = function() {
		return p;
	};

	this.addTab = tabs.addPage.bind( tabs );
}
