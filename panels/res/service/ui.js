$( '.ui-onload' ).css( 'opacity', '0.0' );

$(document).ready( function()
{
	var $window = $( window );

	$( '.ui-tabs' ).each( function()
	{
		var $t = $(this);
		var opt = {
			sectionSelector: $t.data( 'section-selector' ),
			headSelector: $t.data( 'head-selector' )
		};
		var t = new Tabs( this );
		t.onChange( function() {
			$window.trigger( 'resize' );
		});
	});

	$( '.ui' ).each( function()
	{
		var $t = $(this);
		var ph = $t.data( 'placeholder' );
		if( ph && $.trim( $t.html() ) == '' ) {
			$t.html( ph );
		}

		if( $t.is( 'input[type="checkbox"]' ) )
		{
			var sw = $t.data( 'switch' );
			if( sw )
			{
				var $div = $( '#' + sw );
				function fix()
				{
					if( $t.is( ':checked' ) ) {
						$div.removeClass( 'disabled' );
						$div.find( 'input, textarea, button, select' ).prop( 'disabled', false );
					}
					else {
						$div.addClass( 'disabled' );
						$div.find( 'input, textarea, button, select' ).prop( 'disabled', true );
					}
				}
				fix();
				$t.on( 'change', fix );
			}
		}
	});

	$( 'legend' ).each( function()
	{
		$( '<div class="legend">' + this.innerHTML + '</div>' ).insertAfter( this );
		this.remove();
	});

	$( '[required]' ).each( function()
	{
		var $req = $( '<div class="ui-required-mark"></div>' );
		$req.insertAfter( this );
	});

	$( 'table.ui-compactable' ).each( function()
	{
		var $t = $( this );
		var $p = $t.parent();

		var columns = [];
		var hidden = 0;

		var $cells = $t.find( 'tr' ).eq(1).find( 'td' );
		if( !$cells.length ) {
			return;
		}

		$cells.each( function( i )
		{
			/*
			 * Don't touch first few columns.
			 */
			if( i < 3 ) return;
			/*
			 * Don't touch columns with important elements inside.
			 */
			var $t = $(this);
			if( $t.find( 'a, button' ).length > 0 ) return;
			columns.push( i );
		});

		var right, maxRight;

		fit();
		$window.on( 'resize', fit );

		function fit()
		{
			if( !$t.is( ':visible' ) ) {
				return;
			}

			maxRight = $p.offset().left + $p.width();
			right = $t.offset().left + $t.outerWidth( true );
			if( right > maxRight ) {
				shrink();
			}
			else {
				expand();
			}
		}

		function shrink()
		{
			while( right > maxRight && hidden < columns.length )
			{
				hidden++;
				var pos = columns[columns.length - hidden];
				hide( pos );
			}
		}

		function expand()
		{
			while( right < maxRight && hidden > 0 )
			{
				var pos = columns[columns.length - hidden];
				show( pos );
				if( right > maxRight ) {
					hide( pos );
					break;
				}
				hidden--;
			}
		}

		function hide( pos ) {
			$t.find( 'td:nth-child('+pos+'), th:nth-child('+pos+')' ).hide();
			right = $t.offset().left + $t.outerWidth( true );
		}

		function show( pos ) {
			$t.find( 'td:nth-child('+pos+'), th:nth-child('+pos+')' ).show();
			right = $t.offset().left + $t.outerWidth( true );
		}
	});

	$( ".delete" ).on( "click", function()
	{
		return confirm( "Удалить?" );
	});

	$( '.ui-onload' ).css( 'opacity', '1.0' );
});
