<?php
lib( 'geo' );
class taxi_tracks
{
	static function get_positions_report( $service_id, $taxi_id, $t1, $t2 )
	{
		$service_id = intval( $service_id );
		$taxi_id = intval( $taxi_id );
		$t1 = intval( $t1 );
		$t2 = intval( $t2 );

		$sid = DB::getValue( "SELECT service_id FROM taxi_accounts
			where acc_id = $taxi_id" );
		if( $sid != $service_id ) {
			return null;
		}

		$P = DB::getRecords("
			SELECT UNIX_TIMESTAMP(t) AS t,
				lat AS latitude,
				lon AS longitude
			FROM taxi_log_positions
			WHERE t BETWEEN FROM_UNIXTIME($t1) AND FROM_UNIXTIME($t2)
			AND driver_id = $taxi_id
			ORDER BY t
		");

		$state = array(
			't' => 0,
			'lat' => 0,
			'lon' => 0,
			'addr' => '',
			'speed' => 0,
			'dr' => 0,
			'dt' => 0,
			'event' => 'begin'
		);
		$addr_pos = array( 0, 0 );

		$states = array();
		$pos = -1;

		foreach( $P as $i => $p )
		{
			$t = $p['t'];
			$lat = $p['latitude'];
			$lon = $p['longitude'];

			/* Skip rows without coordinates. */
			if( !$lat || !$lon ) {
				continue;
			}

			$dt = $t - $state['t'];
			$dr = haversine_distance( $state['lat'], $state['lon'], $lat, $lon );
			$speed = ($dt > 0) ? $dr / $dt * 3.6 : 0;

			$state['t'] = $t;
			$state['lat'] = $lat;
			$state['lon'] = $lon;
			$state['dt'] = $dt;
			$state['dr'] = $dr;
			$state['speed'] = $speed;
			$state['event'] = '';
			$state['addr'] = '';

			if( empty( $states ) )
			{
				$addr = point_addr( $lat, $lon );
				$addr_pos = array( $lat, $lon );
				$state['dt'] = 0;
				$state['addr'] = (string) $addr;
				$state['speed'] = 0;
				$state['dr'] = 0;
				$state['event'] = 'begin';
				$states[] = $state;
				continue;
			}

			if( $dt > 120 )
			{
				// Insert a "disconnect" event before.
				$ns = $state;
				$ns['lat'] = $ns['lon'] = null;
				$ns['t'] -= $dt;
				$ns['dt'] = $dt;
				$ns['event'] = 'disconnect';
				$ns['speed'] = $ns['dr'] = null;
				$ns['addr'] = '';
				$states[] = $ns;

				$state['dt'] = 0;
				$state['dr'] = 0;
				$state['speed'] = 0;
			}

			if( $speed > 130 )
			{
				// Mark this as a "GPS error";
				$state['event'] = 'gps_error';
				//$state['speed'] =
				$state['dr'] = 0;
			}
			else if( round($dr) == 0 )
			{
				$state['event'] = 'idle';
			}

			if( $state['event'] == 'idle' )
			{
				$pos = count($states)-1;
				if( $states[$pos]['event'] == 'idle' )
				{
					$states[$pos]['dt'] += $dt;
					if( $states[$pos]['dt'] > 300
					&& $states[$pos]['addr'] === '' )
					{
						$addr = point_addr( $lat, $lon );
						$addr_pos = array( $lat, $lon );
						$states[$pos]['addr'] = $addr ? (string)$addr : null;
					}
					continue;
				}
			}

			if( haversine_distance( $addr_pos[0], $addr_pos[1], $lat, $lon ) > 1000 )
			{
				$addr = point_addr( $lat, $lon );
				$addr_pos = array( $lat, $lon );
				$state['addr'] = (string) $addr;
			}

			$states[] = $state;
		}
		return $states;
	}
}

?>
