function ImitationsWidget( disp )
{
	var $button = $( '<button type="button">Добавить имитацию</button>' );
	$button.on( "click", openAddDialog );

	this.root = function() {
		return $button.get(0);
	};

	var dialog = null;

	/*
	 * Shows a dialog with cars that are not yet "online".
	 */
	function openAddDialog()
	{
		if( dialog ) {
			dialog.focus();
			return;
		}

		/*
		 * Get all fake drivers that are offline.
		 */
		var list = disp.drivers().filter( function( d ) {
			return d.is_fake == 1 && !d.online();
		});

		if( list.length == 0 ) {
			toast( "Все имитации уже в таблице" );
			return;
		}

		var s = '<div class="menu">';
		list.forEach( function( driver ) {
			s += '<div data-id="' + driver.id +'">'+driver.call_id+'</div> ';
		});
		s += '<p>Удалить водителя из таблицы можно нажав правую кнопку мыши.</p>';
		s += '</div>';
		var $s = $( s );

		dialog = new Dialog( $s.get(0) );
		dialog.setTitle( "Добавление имитации" );
		dialog.addButton( "Отменить", function() {
			dialog.close();
			dialog = null;
		}, "no" );
		$s.on( 'click', 'div', function( event )
		{
			event.preventDefault();
			var id = $( this ).data( 'id' );
			disp.setDriverOnline( id, true ).catch( function( error ) {
				Dialog.show( "Ошибка: " + error );
			});
			dialog.close();
			dialog = null;
		});
		dialog.show();
	}
}
