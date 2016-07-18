function ServiceLogWidget( disp )
{
	var $container = $( '<div id="events-log"></div>' );

	this.root = function() {
		return $container.get(0);
	};

	var MAX_LENGTH = 30;
	var length = 0;

	dx.get( 'service-log', {n: MAX_LENGTH} )
	.then( function( src )
	{
		var n = src.length;
		if( !n ) return;
		length = n;

		var s = '';
		for( var i = 0; i < n; i++ ) {
			s = '<p>' + html.escape( src[i].text ) + '</p>' + s;
		}
		$container.html( s );
	});

	disp.on( 'service-log', function( event )
	{
		if( length >= MAX_LENGTH ) {
			$container.children().last().remove();
		}
		else {
			length++;
		}
		$container.prepend( '<p>' + html.escape( event.data.text ) + '</p>' );
	});

	function update( done )
	{
		dx.get( 'service-log-update', {id: lastMessageId} )
		.then( done ).then( pushMessages )
	}

	function pushMessages( src )
	{
		var n = src.length;
		if( !n ) return;

		for( var i = 0; i < n; i++ )
		{
			var msg = src[i];
			if( length >= MAX_LENGTH ) {
				$container.children().last().remove();
			}
			else {
				length++;
			}
			$container.prepend( '<p>' + html.escape( msg.text ) + '</p>' );
		}
		lastMessageId = src[n-1].message_id;
	}
}
