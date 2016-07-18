function initQueueDragging( disp, table )
{
	table.initDragging( onDragStart, onDragEnd, onDragCancel );

	/*
	 * Original item's position.
	 */
	var qid1 = null;
	var pos1 = null;

	function onDragStart( event )
	{
		qid1 = event.qid;
		pos1 = event.pos;

		/*
		 * Mark queues forbidden for this driver.
		 */
		var allowed = allowedQueues( event.id );
		table.selectQueuesExcept( allowed, 'forbidden' );
		return true;
	}

	function onDragCancel( event ) {
		table.selectQueues( [], 'forbidden' );
	}

	function onDragEnd( event )
	{
		table.selectQueues( [], 'forbidden' );

		var qid2 = event.qid;
		var pos2 = event.pos;

		if( qid1 == qid2 && pos1 == pos2 ) {
			return false;
		}

		var id = event.id;
		var from = { qid: qid1, pos: pos1 };
		var to = { qid: qid2, pos: pos2 };

		/*
		 * Invalid destinations
		 */
		if( qid2 == table.NO_SESSION || qid2 == table.CITY ) {
			return false;
		}
		/*
		 * Invalid horizontal moves
		 */
		if( qid1 == qid2 && (qid1 == table.NONE || qid2 == table.BLOCKED ) ) {
			return false;
		}

		if( qid2 == table.BLOCKED ) {
			showBanDialog( id );
			return false;
		}

		if( qid1 == table.BLOCKED ) {
			showUnbanDialog( id );
			return false;
		}

		if( to.qid == table.NONE ) {
			return confirmKick( id, from, to );
		}

		if( disp.sessionRequired( id ) ) {
			toast( "Нельзя записывать в очередь не вышедших на смену" );
			return false;
		}

		return confirmMove( id, from, to );
	}

	//--

	function allowedQueues( driverId )
	{
		var driver = disp.getDriver( driverId );

		if( driver.blocked() ) {
			return [table.BLOCKED, table.NONE];
		}

		if( disp.sessionRequired( driverId ) ) {
			return [table.BLOCKED];
		}

		var ids = disp.allowedQueues( driverId );
		ids.push( table.BLOCKED );
		ids.push( table.NONE );
		return ids;
	}

	function confirmKick( id, from, to )
	{
		var taxi = disp.getDriver( id );
		var message = "Убрать водителя "+taxi.call_id+" из очереди?";
		var d = new Dialog( message );
		d.addButton( "Да", function() {
			disp.removeDriverQueue( id );
			this.close();
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}

	function confirmMove( id, from, to )
	{
		var pos = to.pos;
		var qid = to.qid;

		/*
		 * If the destination is forbidden, process group change.
		 */
		var allowed = disp.allowedQueues( id );
		if( allowed.indexOf( qid ) == -1  ) {
			processTransfer( id, from, to );
			return;
		}

		var taxi = disp.getDriver( id );

		var doConfirm = from.qid != to.qid;
		if( !doConfirm ) {
			moveDriver( taxi, qid, pos );
			return;
		}

		var q = disp.getQueue( qid );
		var message = "Переместить водителя " + taxi.call_id
			+ " в очередь &laquo;" + q.name + "&raquo; " + (pos+1) + "-м?";

		var d = new Dialog( message );
		d.addButton( "Да", function() {
			moveDriver( taxi, qid, pos );
			this.close();
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}

	//--

	function processTransfer( id, from, to )
	{
		var qid = to.qid;

		/*
		 * Find groups that have access to that queue.
		 */
		var groups = disp.getQueueGroups( qid );

		if( groups.length == 0 ) {
			toast( "В эту очередь нельзя записаться" );
			return;
		}

		var taxi = disp.getDriver( id );

		if( groups.length == 1 ) {
			confirmTransfer( taxi, to, groups[0] );
			return;
		}

		showTransferMenu( taxi, to, groups );
	}

	function confirmTransfer( taxi, to, group )
	{
		var q = disp.getQueue( to.qid );

		var msg = 'Чтобы водитель '+taxi.call_id+' мог записаться в очередь «'
			+ q.name + '», его нужно переназначить в группу «' + group.name + '». Переназначить?';

		var d = new Dialog( msg );
		d.addButton( "Да", function() {
			disp.changeDriverGroup( driver_id, group_id );
		}, "yes" );
		d.addButton( "Нет", null, "no" );
		d.show();
	}

	function showTransferMenu( taxi, to, groups )
	{
		var q = disp.getQueue( to.qid );
		var menu = 'Водитель '+taxi.call_id+' не может записаться в очередь «'+q.name+'» в его текущей группе. В какую группу его переназначить?';
		menu += '<div class="menu">';
		for( var i = 0; i < groups.length; i++ ) {
			menu += '<div data-gid="'+groups[i].group_id+'">' + groups[i].name + '</div>';
		}
		menu += '</div>';

		var $menu = $( '<div>' + menu + '</div>' );

		var buttons = [{title: "Отменить"}];
		var d = new Dialog( $menu.get(0) );
		d.addButton( "Отменить", null, "no" );
		d.show();
		$menu.on( 'click', '.menu > div', function( event )
		{
			var gid = $(event.target).data( 'gid' );
			disp.changeDriverGroup( driver_id, group_id );
			d.close();
		});
	}

	function moveDriver( driver, qid, pos )
	{
		if( disp.param( "queue_dialogs" ) == "1" && driver.is_fake != '1' )
		{
			if( !driver.online() ) {
				toast( "Водитель не на связи" );
			} else {
				disp.suggestQueue( driver.driver_id, qid, pos );
				toast( "Водителю отправлено сообщение" );
			}
			return;
		}

		disp.assignDriverQueue( driver.id, qid, pos );
	}
}
