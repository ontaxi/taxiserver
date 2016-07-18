<?php
/*
 * A stream of cars of a given queue. Returns only cars corresponding
 * to the order's options.
 */
class queue_stream
{
	private $cars;
	private $order;

	function __construct( $qid, $order, $except = array() )
	{
		$this->order = $order;
		$qid = intval( $qid );

		$cond = taxi_search::order_conditions( $order );
		if( !empty( $except ) ) {
			$except = array_map( 'intval', $except );
			$cond .= " AND driver.acc_id NOT IN (".implode( ", ", $except ).")";
		}

		$this->cars = DB::getRecords("
			SELECT driver.acc_id
			FROM taxi_drivers driver
			JOIN taxi_accounts acc USING (acc_id)
			JOIN taxi_queue_drivers a
			JOIN taxi_cars car
			WHERE driver.acc_id = a.driver_id
			AND driver.car_id = car.car_id
			AND a.queue_id = $qid
			AND $cond
			ORDER BY a.pos
		");
		debmsg( count( $this->cars )." cars in queue #$qid" );
	}

	function get_cars( $n )
	{
		$cars = array();
		while( $n-- > 0 ) {
			$car = $this->get_car();
			if( !$car ) break;
			$cars[] = $car;
		}
		return $cars;
	}

	function get_car()
	{
		$sid = $this->order->service_id();
		while( !empty( $this->cars ) )
		{
			$car = array_shift( $this->cars );
			if( !$car ) break;
			$taxi_id = $car['acc_id'];

			if( get_taxi_lag( $taxi_id ) === null ) {
				logmsg( "#$taxi_id is offline", $sid, $taxi_id );
				continue;
			}

			if( session_needed( $taxi_id ) ) {
				logmsg( "#$taxi_id needs a session", $sid, $taxi_id );
				continue;
			}

			logmsg( "Adding #$taxi_id to the squad", $sid, $taxi_id );
			$car = array( 'taxi_id' => $taxi_id );
			return $car;
		}

		return null;
	}
}
?>
