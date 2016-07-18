function initChat( disp, qw )
{
	var sound = sounds.track( "/res/dispatcher/chat.ogg" );
	var dialogs = {};

	/*
	 * Mark drivers for which there are unread messages in the queues
	 * widget.
	 */
	disp.drivers().forEach( function( driver )
	{
		if( disp.haveNewMessages( driver ) ) {
			qw.addSelection( driver.id, "chat" );
		}
	});

	disp.on( "chat-message-received", function( event ) {
		sound.play();

		var msg = event.data.message;
		var driver = disp.getDriver( msg.from ) || disp.getDriver( msg.to );
		if( !driver ) {
			return;
		}
		/*
		 * If there is an open chat with the driver, put the message
		 * there.
		 */
		var d = dialogs[driver.id];
		if( d ) {
			/*
			 * If the message has been displayed, mark it as read.
			 */
			if( d.addMessage( msg ) && disp.getDriver( msg.from ) ) {
				disp.markChatMessages( driver.id, msg.id );
			}
		}
	});

	disp.on( "chat-front-changed", function( event )
	{
		var driver = event.data.driver;
		if( event.data.unread > 0 ) {
			qw.addSelection( driver.id, "chat" );
		} else {
			qw.removeSelection( driver.id, "chat" );
		}
	});

	qw.on( "driver-click", function( event ) {
		if( event.data.button != 2 ) return;
		var driver = event.data.driver;
		if( driver.is_fake == '1' ) {
			return;
		}
		openChat( driver );
	});

	function openChat( driver )
	{
		if( driver.id in dialogs ) {
			dialogs[driver.id].focus();
			return;
		}
		var d = new ChatDialog( disp, driver );
		dialogs[driver.id] = d;
		d.show();
		d.on( "close", function() {
			delete dialogs[driver.id];
		});
	}
}
