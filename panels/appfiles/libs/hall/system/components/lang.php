<?php
/*
 * Gettext turned out to be too complicated and unreliable on one
 * hosting. This is a simpler alternative.
 */
class lang
{
	static $lang = null;
	private static $dicts = array();

	static function set_default_language( $lang ) {
		self::$lang = $lang;
	}

	static function get_default_language() {
		return self::$lang;
	}

	static function get_message( $msgid, $lang = null )
	{
		if( !$lang ) $lang = self::$lang;
		if( !$lang ) {
			return $msgid;
		}

		if( !isset( self::$dicts[$lang] ) ) {
			self::load_dict( $lang );
		}

		if( array_key_exists( $msgid, self::$dicts[$lang] ) ) {
			return self::$dicts[$lang][$msgid];
		}

		return $msgid;
	}

	static function have_lang( $lang )
	{
		if( !self::valid( $lang ) ) {
			return false;
		}
		$lang = strtolower( $lang );
		$path = append_path( APPLICATION_PATH, 'lang', $lang );
		return file_exists( $path );
	}

	private static function valid( $lang )
	{
		/*
		 * Someone bad could pass $lang='../{...}../etc/whatever', so
		 * we assert that $lang can be only in the form of HTTP
		 * accept-language: 1*8ALPHA *( "-" 1*8ALPHA).
		 */
		$lang = strtolower( $lang );
		if( !preg_match( '/[a-z]{1,8}(-[a-z]{1,8})*/', $lang ) ) {
			return false;
		}
		return true;
	}

	private static function load_dict( $lang )
	{
		if( !self::valid( $lang ) ) {
			warning( "Invalid requested language: $lang" );
			self::$dicts[$lang] = array();
			return;
		}

		$dict = array();

		$path = append_path( APPLICATION_PATH, 'lang', $lang );
		if( file_exists( $path ) )
		{
			$lines = array_map( 'trim', file( $path ) );
			$n = count( $lines );

			$i = 0;
			while( $i < $n - 1 )
			{
				$msgid = $lines[$i++];
				$text = $lines[$i++];
				$dict[$msgid] = $text;

				if( $i >= $n ) break;

				if( $lines[$i++] ) {
					warning( "Empty line expected at file $path, line ".($i+1) );
					break;
				}
			}
		}
		self::$dicts[$lang] = $dict;
	}
}

?>
