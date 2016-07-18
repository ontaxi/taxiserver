"use strict";

$( document ).ready( function()
{
	var car_id = $( 'input[name="car_id"]' ).val();

	function initMap()
	{
		var $map = $( "#map" );
		var $w = $( window );

		var map = new Map( $map.get(0) );

		$map.css({
			width: "400px",
			height: "300px"
		});

		var offset = $map.offset();

		function fitMap()
		{
			$map.css({
				width: $w.width() - offset.left - $( "#messages" ).outerWidth(true),
				height: $w.height() - offset.top - 40
			});

			map.leaflet.invalidateSize();
		}

		fitMap();

		$w.on( 'resize', fitMap );


		map.setZoom( 15 );
		var url = "/dx/dispatcher/car-position?car_id="+car_id;

		function updatePosition()
		{
			$.get( url ).success(function( src )
			{
				src = src.data;
				map.setMarker( "car", src.lat, src.lon );
				map.panTo( src.lat, src.lon );
			});
		}

		setInterval( updatePosition, 10000 );
		setTimeout( updatePosition, 1000 );
	}

	function initMessages()
	{
		var $m = $( "#messages" );
		var $input = $m.find( "textarea" );
		var $button = $m.find( "button" );
		var $notices = $( "#notices" );
		var url = "/index.php?action=send_dispatcher_message&ajax=1";

		var timeout = null;
		function cleanNotices()
		{
			$notices.html('');
		}

		function notify( msg )
		{
			$notices.html( msg );
			timeout = setTimeout( cleanNotices, 5000 );
		}

		function ok()
		{
			clearTimeout( timeout );
			$input.val('');
			notify( "Сообщение отправлено" );
		}

		$button.on( "click", function()
		{
			var message = $.trim( $input.val() );
			if( !message ) {
				return false;
			}
			$.post( url, {
				"cars[]": car_id,
				message: message
			}).success( ok );
		});
	}

	initMap();
	initMessages();
});