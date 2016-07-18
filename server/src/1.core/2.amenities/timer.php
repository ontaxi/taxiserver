<?php

class _timer {
	static $times = array();

	static function in() {
		self::$times[] = self::ms();
	}

	static function out( $desc ) {
		if( empty( self::$times ) ) {
			trigger_error( "timeout without timein" );
			return;
		}
		$dt = self::ms() - array_pop( self::$times );
		debmsg( "$dt ms: $desc" );
	}

	private static function ms() {
		return (int) ( microtime( true ) * 1000 );
	}
}

?>
