function initSettings( disp, statusBar )
{
	var dialog = null;
	applySettings();

	function applySettings() {
		sounds.vol( disp.getSetting( "sound-volume", 0.5 ) );
	}

	var $b = statusBar.addButton( 'settings', 'Настройки' );
	$b.on( "click", function()
	{
		if( dialog ) {
			dialog.focus();
			return;
		}

		var $c = $( '<div></div>' );
		$c.append( soundSection() );

		var saveButton;
		dialog = new Dialog( $c );
		dialog.setTitle( "Настройки" );
		saveButton = dialog.addButton( "Сохранить", function()
		{
			saveButton.disabled = true;
			disp.saveSettings().then( function() {
				toast( "Сохранено" );
				dialog.close();
				dialog = null;
			})
			.catch( function( err ) {
				Dialog.show( err );
				saveButton.disabled = false;
			});

		}, "yes" );
		dialog.addButton( "Отменить", null, "no" );
		dialog.on( "close", function() {
			dialog = null;
		});
		dialog.show();
	});

	var testSound = sounds.track( "/res/dispatcher/phone.ogg" );
	function soundSection()
	{
		var s = '<div>\
			<label>Громкость звуков</label>\
			<input type="range" min="0.0" max="1.0"\
				step="0.01">\
			<button type="button">Проверка</button>\
		</div>';
		var $c = $( s );

		var $range = $c.find( 'input' );
		var $button = $c.find( 'button' );

		var vol = disp.getSetting( "sound-volume", 0.5 )
		$range.val( vol );
		$range.on( "change", function() {
			sounds.vol( this.value );
			disp.changeSetting( "sound-volume", this.value );
		});

		$button.on( "click", function() {
			var b = this;
			b.disabled = true;
			testSound.play();
			setTimeout( function() {
				testSound.stop();
				b.disabled = false;
			}, 3000 );
		});
		return $c;
	}
}
