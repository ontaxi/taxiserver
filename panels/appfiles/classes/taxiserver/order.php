<?php

class order extends BaseItem
{
	protected $table_name = 'taxi_orders';
	protected $table_key = 'order_id';

	function __toString() {
		return "($this->id) ".$this->src_addr();
	}
}

?>
