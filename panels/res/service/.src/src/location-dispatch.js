function initLocationDispatch()
{
	/*
	 * Make stage selectors "behave".
	 */
	var $types = $( 'select[name^="dispatch_type"]' );
	var $queues = $( 'select[name^="dispatch_queue"]' );
	var $brigs = $( 'select[name^="dispatch_brig"]' );
	var $modes = $( 'select[name^="dispatch_mode"]' );

	var $checks = $();
	$( 'input[name^="dispatch_importance"]' ).each( function() {
		$checks = $checks.add( $(this).parent() );
	});

	function sync()
	{
		$types.each( function( i ) {

			var $b = $brigs.eq(i);
			var $q = $queues.eq(i);
			var $m = $modes.eq(i);
			var $c = $checks.eq(i);

			switch( this.value ) {
				case 'queue':
					$b.val('').hide();
					$q.show();
					$m.show();
					$c.show();
					break;
				case 'brigade':
					$b.show();
					$q.val('').hide();
					$m.val('').hide();
					$c.show();
					break;
				case 'all':
					$b.val('').hide();
					$q.val('').hide();
					$m.val('').hide();
					$c.show();
					break;
				default:
					$b.val('').hide();
					$q.val('').hide();
					$m.val('').hide();
					$c.find( 'input' ).attr( 'checked', false );
					$c.hide();

			}
		});
	}

	$types.on( 'change', sync );
	sync();
}
