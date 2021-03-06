<?php

class car extends BaseItem {
	protected $table_name = 'taxi_cars';
	protected $table_key = 'car_id';
}

class taxi_account extends BaseItem {
	protected $table_name = 'taxi_accounts';
	protected $table_key = 'acc_id';
}

class customer extends BaseItem {
	protected $table_name = 'taxi_customers';
	protected $table_key = 'customer_id';
}

class car_group extends BaseItem {
	protected $table_name = 'taxi_car_groups';
	protected $table_key = 'group_id';
}

class driver_group extends BaseItem {
	protected $table_name = 'taxi_driver_groups';
	protected $table_key = 'group_id';
}

class taxi extends BaseItem {
	protected $table_name = 'taxi_drivers';
	protected $table_key = 'driver_id';
}

class fare extends BaseItem {
	protected $table_name = 'taxi_fares';
	protected $table_key = 'fare_id';
}

class work_session extends BaseItem {
	protected $table_name = 'taxi_works';
	protected $table_key = 'id';
}

class taxi_location extends baseitem {
	protected $table_name = 'taxi_locations';
	protected $table_key = 'loc_id';
}

class order extends BaseItem
{
	protected $table_name = 'taxi_orders';
	protected $table_key = 'order_id';

	function __toString() {
		return sprintf( "(%d) %s (%.7f, %.7f)",
			$this->id, $this->src_addr(),
			$this->latitude(), $this->longitude() );
	}
}

?>
