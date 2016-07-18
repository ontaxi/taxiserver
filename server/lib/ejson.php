<?php
/*
 * JSON with comments: multiline comments (/*) are allowed anywhere,
 * and single-line comments (//) are allowed at the beginning of a
 * line (spaces and tabs are ignored).
 */
class ejson
{
	static function parse( $str, $assoc = true )
	{
		$json = self::remove_comments( $str );
		return json_decode( $json, $assoc );
	}

	private static function remove_comments( $str )
	{
		$json = '';
		$lines = explode( "\n", $str );
		while( ($line = array_shift( $lines )) !== null )
		{
			/*
			 * If this is a line starting with '//', skip it.
			 */
			$line = trim( $line );
			if( substr( $line, 0, 2 ) == '//' ) continue;

			/*
			 * If there is no '/*', add this line and go to the next
			 * one.
			 */
			$pos = strpos( $line, '/*' );
			if( $pos === false ) {
				$json .= $line;
				continue;
			}

			/*
			 * If this line has also the closing marker, cut the
			 * comment, add the remainder, and go to the next line.
			 */
			if( $pos2 = strpos( $line, '*/' ) )
			{
				$line = substr_replace( $line, '', $pos, $pos2 + 2 - $pos );
				$json .= $line;
				continue;
			}

			/*
			 * Otherwise add the part before the marker.
			 */
			$line = substr( $line, 0, $pos );
			$json .= $line;
			/*
			 * Skip lines until one with the closing marker appears.
			 */
			while( ($line = array_shift( $lines )) !== null ) {
				$pos = strpos( $line, '*/' );
				if( $pos !== false ) break;
			}
			if( $line === null ) {
				trigger_error( "Unterminated multiline comment" );
				return $json;
			}
			/*
			 * Add part of the line after the marker.
			 */
			$line = substr( $line, $pos + 2 );
			$json .= $line;
		}
		return $json;
	}
}

?>
