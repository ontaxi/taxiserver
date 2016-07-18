<?php

function service_log( $sid, $template, $_args_ = null )
{
	$args = func_get_args();
	$args = array_slice( $args, 2 );
	service_logs::msg( $sid, $template, $args );
}

class service_logs
{
	static function msg( $sid, $template, $args = array() )
	{
		if( !service_option( $sid, 'service_logs' ) ) {
			return;
		}

		preg_match_all( '/{([^}]+)}/', $template, $m );
		$str = $template;
		foreach( $m[1] as $i => $var )
		{
			if( empty( $args ) ) {
				break;
			}
			$val = self::get_val( $var, $args[0] );
			if( $val === null ) {
				continue;
			}
			array_shift( $args );
			$str = self::replace_once( $m[0][$i], $val, $str );
		}

		$text = date( 'H:i:s' ).': '.$str;

		DB::insertRecord( 'taxi_logs', array(
			'service_id' => $sid,
			'text' => $text
		));
		disp_broadcast( $sid, null, 'service-log', array(
			'text' => $text
		));
	}

	private static function get_val( $var, $arg )
	{
		switch( $var )
		{
			case 'd':
				$disp = new taxi_account( $arg, 'call_id' );
				return 'диспетчер ' . $disp->call_id();
			case 'o':
				return 'заказ № '. $arg;
			case 'o`а':
				return 'заказа № '. $arg;
			case '?':
				return $arg;
			case 'O':
				$order = $arg;
				$addr = $order->src_addr();
				return 'заказ № '. $order->id() . " ($addr)";
			case 't':
				$call_id = get_taxi_call_id( $arg );
				return 'водитель '. $call_id;
			case 't`ю':
				$call_id = get_taxi_call_id( $arg );
				return 'водителю '. $call_id;
			case 't`я':
				$call_id = get_taxi_call_id( $arg );
				return 'водителя '. $call_id;
			case 'p':
				$pos = get_taxi_position( $arg );
				if( !$pos ) {
					return 'нет координат';
				}
				$posstr = str_replace( '.', ',',
					sprintf( '(%.6f;%.6f)', $pos->lat, $pos->lon ) );
				$addr = point_address( $pos->lat, $pos->lon );
				return "$posstr ($addr)";

			default:
				return null;
		}
	}

	/*
	 * Replaces not more that one occurence of $find with $replace.
	 */
	private static function replace_once( $find, $replace, $source )
	{
		$start = strpos( $source, $find );
		if( $start === false ) return $source;

		return substr_replace( $source, $replace, $start, strlen( $find ) );
	}
}

?>
