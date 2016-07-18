<?php
/*
 * Sending job, specifies a taxi "squad" - a set of groups of cars.
 */
class cars_squad
{
	public $order_id;
	/*
	 * Array of cars_group objects.
	 */
	public $groups;
	/*
	 * Current group pointer (index).
	 */
	public $current_group;

	function __construct( $order_id = null )
	{
		$this->order_id = $order_id;
		$this->groups = array();
		$this->current_group = -1;
	}

	/*
	 * Add a group to the job. Cars is an array of dicts each of which
	 * must have the "taxi_id" key. Other data is arbitrary, the job
	 * just stores it.
	 */
	function add_group( $cars, $timeout )
	{
		if( empty( $cars ) ) {
			return;
		}
		if( !$timeout ) {
			warning( "Timeout not defined for add_group" );
			$timeout = 20;
		}
		$jcars = array();
		foreach( $cars as $car )
		{
			$taxi_id = $car['taxi_id'];
			$jcars[$taxi_id] = new job_car( $taxi_id, $car );
		}
		$this->groups[] = new cars_group( $jcars, $timeout );
	}

	function add_car( $car, $timeout )
	{
		$cars = array( $car );
		$this->add_group( $cars, $timeout );
	}

	/*
	 * Returns total number of cars in all groups.
	 */
	function get_cars_number()
	{
		$i = 0;
		foreach( $this->groups as $group ) {
			$i += count( $group->cars );
		}
		return $i;
	}

	/*
	 * Returns list of all driver identifiers in the job.
	 */
	function get_cars_list()
	{
		$a = array();
		foreach( $this->groups as $group ) {
			foreach( $group->cars as $car ) {
				$a[] = $car->taxi_id;
			}
		}
		return $a;
	}

	/*
	 * Returns sum of all group timeouts.
	 */
	function get_total_time()
	{
		$t = 0;
		foreach( $this->groups as $group ) {
			$t += $group->timeout;
		}
		return $t;
	}

	/*
	 * Returns current group, the cars_group object.
	 */
	function get_current_group()
	{
		return $this->groups[ $this->current_group ];
	}

	/*
	 * Returns the job_car object with given taxi_id, or null.
	 */
	function get_car( $taxi_id )
	{
		foreach( $this->groups as $group )
		{
			if( isset( $group->cars[$taxi_id] ) ) {
				return $group->cars[$taxi_id];
			}
		}
		return null;
	}

	function __toString()
	{
		if( count( $this->groups ) == 0 ) {
			return "{ empty job }";
		}
		return send_machine::print_job( $this );
	}
}

class cars_group
{
	public $timeout;
	public $finish_time;
	public $cars;

	function __construct( $cars, $timeout )
	{
		$this->cars = $cars;
		$this->timeout = $timeout;
		$this->finish_time = null;
	}
}

class job_car
{
	public $taxi_id;
	public $skipped;
	public $data;

	function __construct( $taxi_id, $data = array() )
	{
		$this->skipped = null;
		$this->taxi_id = $taxi_id;
		$this->data = $data;
	}

	function get_data( $key )
	{
		if( isset( $this->data[$key] ) ) {
			return $this->data[$key];
		}
		return null;
	}
}
?>
