pageFunc( "driver", function()
{
	/*
	 * When login input is edited, check if the login is taken.
	 */
	var dx = new DX( '/dx/service' );

	var $login = $( 'input[name="login"]' );
	var $takenSign = $( '<span class="error">Занят</span>' );
	$takenSign.insertAfter( $login ).hide();

	$login.on( 'change', function()
	{
		$takenSign.hide();
		dx.get( 'login-taken', {type: 'driver', login: this.value} )
		.then( function( taken ) {
			if( taken ) {
				$takenSign.show();
			}
		});
	});
});
