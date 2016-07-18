<?php

class offer {
	public $id;
	public $order_id;

	/*
	 * Order draft which will be saved if the offer is taken.
	 */
	public $order;
	/*
	 * Driver that would take the order.
	 */
	public $driver_id;
	/*
	 * The conn_user record of the center server.
	 */
	public $user;

	function __construct( $order, $driver_id, $user ) {
		$this->order = $order;
		$this->driver_id = $driver_id;
		$this->user = $user;
	}

	function __toString() {
		return "offer #$this->id (driver #$this->driver_id)";
	}
}

?>
