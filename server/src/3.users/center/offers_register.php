<?php

class offers
{
	const MAX_ID = 1000000;
	const OFFER_TIMEOUT = 60;

	private static $off_id = 0;
	private static $offers = array();
	static $size_warn = 100;

	/*
	 * Add an offer to the list of active offers.
	 */
	static function add( $offer )
	{
		if( self::$off_id == self::MAX_ID ) {
			self::$off_id = 1;
		}
		else {
			self::$off_id++;
		}

		$id = self::$off_id;
		$offer->id = $id;
		self::$offers[$id] = $offer;

		postpone( self::OFFER_TIMEOUT, 'offers::remove', $id );

		return $id;
	}

	static function remove( $id )
	{
		unset( self::$offers[$id] );
	}

	static function get( $id )
	{
		if( !isset( self::$offers[$id] ) ) {
			return null;
		}
		return self::$offers[$id];
	}

	static function assign( $offer_id, $order_id )
	{
		if( !isset( self::$offers[$offer_id] ) ) {
			return false;
		}
		self::$offers[$offer_id]->order_id = $order_id;
		return true;
	}

	static function find( $order_id, $driver_id )
	{
		if( count( self::$offers ) >= self::$size_warn ) {
			warning( "Offers table size has reached ".self::$size_warn );
			self::$size_warn += 200;
		}

		foreach( self::$offers as $offer ) {
			if( $offer->order_id == $order_id
				&& $offer->driver_id == $driver_id ) {
				return $offer;
			}
		}
		return null;
	}
}

?>
