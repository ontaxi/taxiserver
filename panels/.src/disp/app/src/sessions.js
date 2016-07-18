function initSessions( disp, tabs )
{
	var sessions = new SessionsWidget( disp );
	tabs.addTab( "Смены", sessions.root() );

	initSessionRequests( disp );
}

function initSessionRequests( disp )
{
	/*
	 * Driver id => dialog.
	 */
	var dialogs = {};

	var sound = sounds.track( "/res/dispatcher/phone.ogg" );

	disp.on( 'session-requested', function( event ) {
		var r = event.data;
		showDialog( r.driver_id, r.odometer );
	});

	function showDialog( driver_id, odometer )
	{
		/*
		 * Don't show the dialog twice.
		 */
		if( driver_id in dialogs ) {
			return;
		}

		var d = disp.getDriver( driver_id );
		var msg = "Водитель " + d.call_id + " желает открыть смену.";

		var dialog = new Dialog( msg );
		dialogs[driver_id] = dialog;

		var b1 = dialog.addButton( "Разрешить", function()
		{
			sound.stop();
			b1.disabled = true;
			b2.disabled = true;

			disp.openSession( driver_id, odometer )
			.catch( function( error ) {
				/*
				 * If the error is that the session already exists,
				 * consume it and treat the request as successful.
				 */
				if( error == "open" ) {
					return null;
				}
				/*
				 * If not, pass the error along.
				 */
				throw error;
			})
			.then( function() {
				dialog.close();
				delete dialogs[driver_id];
			})
			.catch( function( error ) {
				Dialog.show( sessionError( error ) );
				b1.disabled = false;
				b2.disabled = false;
			});

		}, "yes" );

		var b2 = dialog.addButton( "Игнорировать", function() {
			sound.stop();
			this.close();
			delete dialogs[driver_id];
		}, "no" );

		dialog.show();
		sound.play();
	}

	disp.on( 'session-opened', function( event )
	{
		var s = event.data;
		var driver_id = s.driver_id;
		if( driver_id in dialogs ) {
			dialogs[driver_id].close();
			sound.stop();
			delete dialogs[driver_id];
		}
	});
}

/*
 * Returns text description of a session-related error code.
 */
function sessionError( code ) {
	var messages = {
		"open": "Смена уже открыта",
		"no_car": "Водителю не назначена машина"
	};
	if( code in messages ) return messages[code];
	return "Ошибка: " + code;
}
