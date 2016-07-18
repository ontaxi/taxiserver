<?php
class cast
{
	private static $nuls = array(
		'int' => 0,
		'flt' => 0.0,
		'str' => ''
	);

	static function table( &$table, $specs )
	{
		foreach( $table as $i => $row ) {
			self::row( $row, $specs );
			$table[$i] = $row;
		}
	}

	static function row( &$row, $specs )
	{
		foreach( $specs as $name => $type ) {
			$row[$name] = self::val( $type, $row[$name] );
		}
	}

	static function val( $type, $val )
	{
		if( substr( $type, -1 ) == '?' ) {
			$null_ok = true;
			$type = substr( $type, 0, -1 );
		}
		else $null_ok = false;

		if( $val === null ) {
			if( $null_ok ) return $val;
			return self::$nuls[$type];
		}

		switch( $type )
		{
			case 'int':
				return intval( $val );
			case 'str':
				return (string) $val;
			case 'flt':
				return floatval( $val );
			default:
				trigger_error( "Unknown type: $type" );
				return $val;
		}
	}
}
?>
