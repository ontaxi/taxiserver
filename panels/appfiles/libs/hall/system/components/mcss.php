<?php
/*
Marco-CSS processor. Converts MCSS to CSS. Example of MCSS:

$include mcss/subsheet.mcss
$(
	foo = bar;
	font_size = 12px;
	color = #eee;
	width = 12;
	height = 100;
	N = 4;
)
html {
	font-size: $(font_size);
}
body {
	color: $(color);
}
h1 {
	font-size: $(font_size * 2);
}
div.area {
	width: $( N * (width + 4) )px;
	height: $(height)px;
}
*/

class mcss
{
	private static $vars = array();

	static function convert( $src, $dir = './' )
	{
		$src .= "\n";
		if( $dir && substr( $dir, -1 ) != '/' ) {
			$dir .= '/';
		}

		while( ($pos = strpos( $src, '$include ' )) !== false )
		{
			$pos2 = strpos( $src, "\n", $pos );
			$code = substr( $src, $pos, $pos2 - $pos + 1 );
			$path = trim( substr( $code, strpos( $code, ' ' ) ) );
			$sub = file_get_contents( $dir . $path );
			$src = str_replace( $code, $sub, $src );
		}
		while( ($pos = strpos( $src, '$(' )) !== false )
		{
			$brace = 1;
			$code = '$(';
			$pos += 2;
			$n = strlen( $src );
			while( $brace > 0 && $pos < $n )
			{
				$ch = $src[$pos++];

				if( $ch == ')' ) {
					$brace--;
				}
				else if( $ch == '(' ) {
					$brace++;
				}

				$code .= $ch;
			}

			$src = str_replace( $code, self::run_code( $code ), $src );
		}

		return $src;
	}

	private static function run_code( $code )
	{
		$code = substr( $code, 2, -1 );
		$parts = array_filter( array_map( 'trim', explode( ';', $code ) ) );
		$out = '';

		foreach( $parts as $part )
		{
			// <var> = <value>
			if( strpos( $part, '=' ) )
			{
				list( $name, $value ) = array_map( 'trim', explode( '=', $part ) );
				self::$vars[$name] = $value;
			}
			else
			{
				// expression like "width * height" or "12 + (margin + 12) * N"
				$out .= self::evaluate( $part );
			}
		}
		return $out;
	}

	private static function is_alpha( $ch )
	{
		return strpos( 'abcdefghijklmnopqrstuvwxyz'.
			'_ABCDEFGHIJKLMNOPQRSTUVWXYZ', $ch ) !== false;
	}

	private static function get_tokens( $expr )
	{
		$i = 0;
		$n = strlen( $expr );
		$state = '';
		$buf = '';
		$unit = '';
		$tokens = array();

		// A trick to allow the loop to get 2 characters out of bounds.
		$expr .= '$$';

		while( $i < $n )
		{
			$ch = $expr[$i++];

			/* Skip spaces. */
			while( $ch == ' ' ) {
				$ch = $expr[$i++];
			}

			/* Operator? */
			if( $ch == '*' || $ch == '-' || $ch == '/' || $ch == '+' )
			{
				$tokens[] = array(
					'type' => 'operator',
					'value' => $ch
				);
				continue;
			}

			/* Number? */
			while( is_numeric( $ch ) )
			{
				$buf .= $ch;
				$ch = $expr[$i++];
			}

			if( $buf )
			{
				$value = $buf;
				$buf = '';
				$unit = '';
				/* Is it followed by a unit? */
				if( $ch == 'p' && $expr[$i] == 'x' ) {
					$i++;
					$unit = 'px';
				}
				else if( $ch == 'p' && $expr[$i] == 't' ) {
					$i++;
					$unit = 'pt';
				}
				else {
					$i--;
					$unit = 1;
				}

				$tokens[] = array(
					'type' => 'measure',
					'value' => $value,
					'unit' => $unit
				);
				continue;
			}

			//trigger_error( __LINE__ );
			return null;
		}

		return $tokens;
	}

	private static function parse_calc( $expr )
	{
		$tokens = self::get_tokens( $expr );
		$n = count( $tokens );
		while( $n > 1 )
		{
			/* Find the highest priority operator. */
			$tok_i = 0;
			$tok_p = 0;
			foreach( $tokens as $i => $t )
			{
				if( $t['type'] == 'operator' )
				{
					switch( $t['value'] )
					{
					case '*':
					case '/':
						$p = 2;
						break;
					default:
						$p = 1;
					}
					if( $p > $tok_p ) {
						$tok_p = $p;
						$tok_i = $i;
					}
				}
			}

			$op = $tokens[$tok_i];

			if( $op['type'] != 'operator' )
			{
				trigger_error( __LINE__ );
				return null;
			}

			$v1 = $tokens[$tok_i - 1];
			$v2 = $tokens[$tok_i + 1];
			$op = $op['value'];

			$u1 = $v1['unit'];
			$u2 = $v2['unit'];
			$unit = '?';

			if( $op == '*' )
			{
				if( $u1 != 1 && $u2 != 1 )
				{
					trigger_error( "Can't multiply '$u1' and '$u2'" );
					return null;
				}

				$unit = ( $u1 == 1 ) ? $u2 : $u1;

				$result = array(
					'type' => 'measure',
					'value' => $v1['value'] * $v2['value'],
					'unit' => $unit
				);
			}
			else if( $op == '/' )
			{
				if( $u1 == $u2 ) {
					$unit = 1;
				}
				else if( $u2 == 1 ) {
					$unit = $u1;
				}
				else {
					trigger_error( "Can't delete '$u1' by '$u2'" );
					return null;
				}

				$result = array(
					'type' => 'measure',
					'value' => $v1['value'] / $v2['value'],
					'unit' => $unit
				);
			}
			else if( $op == '+' )
			{
				if( $u1 != $u2 ) {
					trigger_error( "Can't add '$u1' and '$u2'" );
					return null;
				}
				$unit = $u1;

				$result = array(
					'type' => 'measure',
					'value' => $v1['value'] + $v2['value'],
					'unit' => $unit
				);
			}
			else if( $op == '-' )
			{
				if( $u1 != $u2 ) {
					trigger_error( "Can't subtract '$u1' and '$u2'" );
					return null;
				}
				$unit = $u1;

				$result = array(
					'type' => 'measure',
					'value' => $v1['value'] - $v2['value'],
					'unit' => $unit
				);
			}

			array_splice( $tokens, $tok_i - 1, 3, array( $result ) );
			$n -= 2;
		}

		if( $n == 1 )
		{
			$t = $tokens[0];
			if( $t['unit'] != 1 ) {
				return $t['value'].$t['unit'];
			}
			else {
				return $t['value'];
			}
		}
		return null;
	}

	private static function evaluate( $expr )
	{
		$new = '';
		$state = '';
		$i = 0;
		$n = strlen( $expr );
		$buf = '';

		while( $i < $n )
		{
			$ch = $expr[$i++];
			switch( $state )
			{
				case '':
					if( self::is_alpha( $ch ) )
					{
						/* Any alphabetic symbol starts name accumulation. */
						$state = 'name';
						$buf = $ch;
					}
					else {
						/* Any other symbol goes without changes. */
						$new .= $ch;
					}
				break;

				case 'name':
					/* Any non-alphanumeric symbol stops the
					accumulation. */
					if( !self::is_alpha( $ch ) && !is_numeric( $ch ) )
					{
						$new .= self::$vars[$buf];
						$buf = '';
						$state = '';
						$i--;
					}
					else $buf .= $ch;
				break;

				default:
					trigger_error( __LINE__ );
			}
		}

		if( $buf ) {
			switch( $state )
			{
				case 'name': $new .= self::$vars[$buf]; break;
				default: $new .= $buf;
			}
		}


		/* Try to calculate as units expression. */
		$v = self::parse_calc( $new );
		if( $v ) return $v;

		/* Try to eval as just math. */
		if( !preg_match( '/[^\d\-+*\/\s\(\)]/', $new ) ) {
			$new = '$a = '.$new.';';
			eval( $new );
			//putv( "$expr -> $a" );
			return $a;
		}

		/* If nothing, return as is. */
		return $new;
	}
}
?>
