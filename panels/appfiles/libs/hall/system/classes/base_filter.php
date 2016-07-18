<?php

/* A typical problem for catalogs with complex item selectors (or
"filters") is to pass the selected parameters between pages. For
example, we could have a products page with a selector that allows the
user to show only red products with size between 10 and 20. The problems
are:
1) internal representation of different types of constraints,
2) serializing the constraints and passing them in URLs.

The constraints may be:
* equality (color = red),
* belonging to a set (color is one of {red, yellow, black}),
* inequalities (size < 20)
* range (size is in range [10, 20]).

We can reduce this set to two. First, equality can be replaced as a
belonging to a set of one item:

	"color = red" ~= "color in {red}".

Second, range is a combination of two inequalities. Therefore, if we
need an inequality, we can use an unfully-specified range or use extreme
value for one end:

	"size <= 20" ~= "size in [0, 20]" (provided that size is non-
	negative), or "size in [, 20]".

// TODO: comment functions and choose simpler names for them, like
// set_equality( $param, $value ) instead of set_option.

*/



class base_filter
{
	private $params = array();
	// For sets internal representation is a hash map.
	// For ranges - array( min, max ).

	function __construct( $string = '' )
	{
		$parts = array_filter( explode( '.', $string ) );
		foreach( $parts as $part )
		{
			$pos = strpos( $part, '~' );
			if( !$pos ){
				warning( "Malformed filter string: $string" );
				continue;
			}

			$param = substr( $part, 0, $pos );
			$values = substr( $part, $pos + 1 );

			switch( $values[0] )
			{
				case '{':
					$set = explode( ',', trim( $values, '{}' ) );
					foreach( $set as $value ){
						$this->add_option( $param, $value );
					}
					break;

				case '[':
					$range = explode( ',', trim( $values, '[]' ) );
					$this->set_range( $param, $range[0], $range[1] );
					break;

				default:
					$this->set_equality( $param, $values );
			}
		}
	}

	function __toString()
	{
		$parts = array();

		foreach( $this->params as $param => $constraint )
		{
			switch( $constraint['type'] )
			{
				case 'set':
					$values = array_keys( $constraint['values'] );
					$parts[] = "$param~".'{'.implode( ',', $values ).'}';
					break;
				case 'equality':
					$value = $constraint['value'];
					if( $value == '' ) break;
					$parts[] = "$param~$value";
					break;
				case 'range':
					$values = $constraint['values'];
					$parts[] = "$param~[".implode( ',', $values )."]";
					break;
				default:
					trigger_error( "Unknown constraint type: $constraint[type]" );
			}
		}

		return implode( '.', $parts );
	}


	function add_option( $param, $value )
	{
		if( isset( $this->params[$param] ) )
		{
			if( $this->params[$param]['type'] != 'set' ){
				trigger_error( "Constraint types mismatch" );
				return false;
			}

			$this->params[$param]['values'][$value] = true;
		}
		else
		{
			$this->params[$param] = array(
				'type' => 'set',
				'values' => array( $value => true )
			);
		}
		return true;
	}

	function set_options( $param, $values )
	{
		$this->params[$param] = array(
			'type' => 'set',
			'values' => array_fill_keys( $values, true )
		);
	}

	function has_option( $param, $value )
	{
		return isset( $this->params[$param]['values'][$value] );
	}

	function remove_option( $param, $value )
	{
		if( isset( $this->params[$param]['values'][$value] ) ){
			unset( $this->params[$param]['values'][$value] );
			return true;
		}
		return false;
	}

	function get_options( $param )
	{
		if( !isset( $this->params[$param]['values'] ) ){
			return null;
		}
		if( $this->params[$param]['type'] != 'set' ){
			trigger_error( "Constraint types mismatch" );
			return null;
		}

		return array_keys( $this->params[$param]['values'] );
	}

	function set_equality( $param, $value )
	{
		$this->params[$param] = array(
			'type' => 'equality',
			'value' => $value
		);
	}
	function get_equality( $param )
	{
		if( isset( $this->params[$param]['value'] ) ){
			return $this->params[$param]['value'];
		} else {
			return null;
		}
	}

	function set_range( $param, $min, $max )
	{
		$this->params[$param] = array(
			'type' => 'range',
			'values' => array( $min, $max )
		);
	}

	function get_range( $param )
	{
		return $this->params[$param]['values'];
	}
}

?>
