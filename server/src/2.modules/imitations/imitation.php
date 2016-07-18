<?php
/*
 * This class represents a single fake driver.
 */
class imitation
{
	public $taxi_id = null;
	/*
	 * The buffer and popdata are all made to mock the driver's
	 * messages. When there is need to simulate the driver
	 * sending data to the server, that data is put in the buffer from
	 * which it is then extracted by the fake connection.
	 */
	private $buf = '';

	function popdata()
	{
		$str = $this->buf;
		if( strlen( $str ) > 0 ) {
			$this->buf = '';
		}
		return $str;
	}

	function process_message( $message )
	{
		if( $message->command == 'new-order' )
		{
			$order_id = $message->data( 'order_id' );
			$data = array( 'order_id' => $order_id );
			$m = new message( 'accept-order', $data );
			$this->reply( $m );
			return true;
		}
		else if( $message->command == 'order-accepted' )
		{
			$order_id = $message->data( 'order_id' );
			$data = array( 'order_id' => $order_id );
			$m1 = new message( 'order-started', $data );
			$data['price'] = 0;
			$m2 = new message( 'order-finished', $data );
			$this->reply( $m1 );
			$this->reply( $m2 );
			return true;
		}
		return false;
	}

	private function reply( $message ) {
		$this->buf .= $message->to_json() . "\n";
	}
}

?>
