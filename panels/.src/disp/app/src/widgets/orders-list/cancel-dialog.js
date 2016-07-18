/*
 * Dialog for order cancelling.
 */
function showCancelDialog( order )
{
	var html = '<p>Отменить заказ?</p>'
		+ '<textarea placeholder="Причина отмены"></textarea>';
	if( order.taxi_id ) {
		html += '<div><label><input type="checkbox"> Восстановить в очереди</label></div>';
	}
	var $content = $( '<div>' + html + '</div>' );
	var $reason = $content.find( 'textarea' );
	var $restore = $content.find( 'input[type="checkbox"]' );

	var d = new Dialog( $content.get(0) );
	d.addButton( 'Отменить заказ', cancel, 'yes' );
	d.addButton( 'Закрыть окно', null, 'no' );
	d.show();

	function cancel()
	{
		var reason = $reason.val();
		var restore = $restore.is( ':checked' );

		var p = disp.cancelOrder( order.order_uid, reason );
		if( restore && order.taxi_id ) {
			p.then( function() {
				disp.restoreDriverQueue( order.taxi_id )
			});
		}
		this.close();
	}
}
