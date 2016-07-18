<?php

/*
 * Takes address parts (a map with keys 'place', 'street', 'house',
 * 'building', 'entrance') and returns the address as string in the
 * standard form.
 */
function write_address( $arr )
{
	$keys = array( 'house', 'building', 'entrance', 'apartment' );
	foreach( $keys as $key ) {
		if( !array_key_exists( $key, $arr ) ) {
			$arr[$key] = '';
		}
	}

	$addr = new address();
	$addr->set_place( $arr['place'] );
	$addr->set_street( $arr['street'] );
	$addr->set_house( $arr['house'] );
	$addr->set_building( $arr['building'] );
	$addr->house_entrance = $arr['entrance'];
	$addr->apartment = $arr['apartment'];
	return $addr->format_std();
}

/*
 * Takes address string in the standard form and returns parts as a map
 * with keys 'place', 'street', 'house', 'building', 'entrance',
 * 'apartment'.
 */
function parse_address( $str )
{
	$addr = address::parse_std( $str );
	return array(
		'place' => $addr->place,
		'street' => $addr->format_street(),
		'house' => $addr->house_number,
		'building' => $addr->house_building,
		'entrance' => $addr->house_entrance,
		'apartment' => $addr->apartment
	);
}

class address
{
	static function parse_std( $str )
	{
		$addr = new address();

		$parts = explode( ", ", $str );

		$part = array_shift( $parts );
		if( $part && strpos( $part, "г. " ) === 0 ) {
			$addr->place = substr( $part, strlen( "г. " ) );
			$part = array_shift( $parts );
		}

		if( $part ) {
			$addr->set_street( $part );
			$part = array_shift( $parts );
		}

		if( $part && strpos( $part, "д. " ) === 0 ) {
			$addr->house_number = substr( $part, strlen( "д. " ) );
			$part = array_shift( $parts );
		}

		if( $part && strpos( $part, "к. " ) === 0 ) {
			$addr->house_building = substr( $part, strlen( "к. " ) );
			$part = array_shift( $parts );
		}

		if( $part && strpos( $part, "под. " ) === 0 ) {
			$addr->house_entrance = substr( $part, strlen( "под. " ) );
			$part = array_shift( $parts );
		}

		if( $part && strpos( $part, "кв. " ) === 0 ) {
			$addr->apartment = substr( $part, strlen( "кв. " ) );
			$part = array_shift( $parts );
		}
		return $addr;
	}

	public static $street_types = array(
		'улица' => 'ул.',
		'проспект' => 'просп.',
		'переулок' => 'пер.',
		'проезд' => 'пр.',
		'площадь' => 'пл.',
		'бульвар' => 'б-р',
		'тракт' => 'тр.'
	);

	public $country = 'Беларусь';
	public $place = 'Минск';
	public $region_district = ''; // e.g. Минский район
	public $street_type = 'улица';
	public $street_name = '';
	public $street_number = '';
	public $house_number = '';
	public $house_building = '';
	public $house_entrance = '';
	public $apartment = '';

	/* examples
	The most clear one:
		г. Минск, ул. Васнецова, д. 2, к. 1

	The number defaults to the house number:
		г. Минск, ул. Щорса, 1

	The house number with a letter. The letter should be
	cyrillic, but latin will often be typed by mistake.
		г. Минск, пер. Корженевского, 8а

	The house number with a slash. Normally, slash means that
	the house has two numbers (when it belongs to two streets),
	but the slash is often mistakenly used as a building number
	separator. In this example, the house number is 123
	and the building number is 2:
		г. Минск, ул. Тимирязева, 123/2

	Street names can have more than one word:
		г. Минск, ул. Лили Карастояновой, 32

	Street type can be at the end:
		г. Минск, Карастояновой ул., 32

	Street names can have numbers:
		Велосипедный 1-й пер.
		1-й Велосипедный пер.
	*/

	private $construct_string;

	function __construct( $string = '' )
	{
		$this->construct_string = $string;

		$s = mb_strtolower( $string );
		$parts = array_filter(
			array_map( 'trim', preg_split( '/[, ]/', $string ) )
		);

		$part_type = null;
		$unknown_parts = array();

		foreach( $parts as $part )
		{
			// Token marker?
			if( $part == 'д.' ){
				$part_type = 'house';
				continue;
			}

			if( $part_type )
			{
				//msg( "$part should be a $part_type" );
				if( $part_type == 'house' ){
					$this->set_house( $part );
				}
				$part_type = null;
				continue;
			}

			// Street type?
			foreach( self::$street_types as $full => $short )
			{
				if( $part == $short || $part == $full )
				{
					//msg( "$part - street type" );
					$this->street_type = $full;
					continue 2;
				}
			}

			// Street number?
			if( $pos = strpos( $part, '-я' ) || $pos = strpos( $part, '-й' ) ){
				//msg( "$part - street number" );
				$num = substr( $part, 0, $pos );

				// If the num is too big, then it is most likely a part
				// of the name.
				if( $num < 10 ) {
					$this->street_number = $num;
					continue;
				}
			}

			// Building number?
			if( strpos( $part, 'к' ) === 0 ){
				//msg( "$part - building number" );
				$part = str_replace( 'к', '', $part );
				$this->house_building = trim( $part, '. ' );
				continue;
			}

			// House number with a letter?
			if( preg_match( '@^\d+[абвгде]$@u', $part ) ){
				//msg( "$part - house number" );
				$this->house_number = $part;
				continue;
			}

			// House number with a building number separated by
			// slash?
			if( strpos( $part, '/' ) )
			{
				//msg( "$part - house and building" );
				list( $house, $building ) = explode( '/', $part, 2 );
				$this->house_number = trim( $house );
				$this->house_building = trim( $building );
				continue;
			}

			// House number with a building number?
			if( preg_match( '@^(\d+) к(\d)$@u', $part, $m ) )
			{
				//msg( "$part - house and building" );
				$this->house_number = $m[1];
				$this->house_building = $m[2];
				continue;
			}

			//msg( "Unknown address part: '$part'" );
			$unknown_parts[] = $part;
		}

		if( !empty( $unknown_parts ) ){
			$part = implode( ' ', $unknown_parts );
			//msg( "Maybe, $part is a street name" );
			$this->street_name = $part;
		}
	}

	function set_street( $name )
	{
		/*
		 * If the second letter is uppercase, we are given an all-caps.
		 */
		$c2 = mb_substr( $name, 1, 1 );
		if( $c2 != mb_strtolower( $c2 ) )
		{
			$c1 = mb_substr( $name, 0, 1 );
			$rest = mb_substr( $name, 1 );
			$name = $c1 . mb_strtolower( $rest );
		}

		foreach( self::$street_types as $full => $short )
		{
			if( strpos( $name, $full ) !== false ){
				$this->street_type = $full;
				$name = trim( str_replace( $full, '', $name ) );
				break;
			}

			if( strpos( $name, $short ) !== false ){
				$this->street_type = $full;
				$name = trim( str_replace( $short, '', $name ) );
				break;
			}
		}
		return $this->set_street_name( $name );
	}

	function set_place( $place )
	{
		// "Юхновка (Минский район)
		if( preg_match( '/^(.*?) \((.*?)\)$/u', $place, $m ) ) {
			$this->place = $m[1];
			$this->region_district = $m[2];
		}
		else {
			$this->place = $place;
		}
	}

	function set_street_name( $name )
	{
		/* Here we try to catch street number, if it is there. Typical
		uses are:
			"1-й переулок ..."
			"1й переулок ..." (wrong)
			"1 переулок ..."
			"... Велосипедный 1-й"
			"... Велосипедный 1й"
			"... Велосипедный 1".
		But! There are cases like this:
			"... 1 Мая" - detect by month keyword
		*/
		$tokens = explode( ' ', $name );
		$num_match = null;
		$not_num = false;
		$months = array( 'января', 'февраля', 'марта', 'апреля', 'мая',
			'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября',
			'декабря' );
		foreach( $tokens as $tok )
		{
			if( preg_match( '/(\d)\-?[йя]/', $tok, $m ) ) {
				if( $m[1] < 10 ) {
					$min_match = $m;
					continue;
				}
			}

			if( in_array( mb_strtolower( $tok ), $months ) ) {
				$not_num = true;
				break;
			}
		}

		if( $num_match && !$not_num )
		{
			$this->street_number = $num_match[1];
			$this->street_name = trim( str_replace( $num_match[0], '', $name ) );
		} else {
			$this->street_name = $name;
			$this->street_number = null;
		}
	}

	function set_house( $number )
	{
		$pos = strpos( $number, 'к' );
		if( $pos ){
			$building = trim( substr( $number, $pos + strlen( 'к' ) ), '. ' );
			$number = trim( substr( $number, 0, $pos ) );
		}
		else if( $pos = strpos( $number, '/' ) ) {
			$building = trim( substr( $number, $pos+1 ) );
			$number = trim( substr( $number, 0, $pos ) );
		}
		else {
			$building = null;
		}

		$this->house_building = $building;
		$this->house_number = mb_strtoupper( $number );
	}

	function set_building( $building )
	{
		if( $this->house_building ) {
			return;
		}

		$this->house_building = $building;
	}

	function format_street()
	{
		if( !$this->street_name ) {
			return '';
		}

		return $this->format( '$Name[ $Rank] $type' );
	}

	function format_full()
	{
		$str = $this->format( '$City, $Name[ $Rank] $type[, д. $House][, к. $Building]' );
		$str = trim( $str, " ," );
		return $str;
	}

	function format_std()
	{
		$s = "г. " . $this->place . ", "
			. $this->format( '$type $Name[ $Rank][, д. $House][, к. $Building]' );

		if( $this->house_number )
		{
			if( $this->house_entrance ) {
				$s .= ", под. " . $this->house_entrance;
			}
			if( $this->apartment ) {
				$s .= ", кв. " . $this->apartment;
			}
		}
		return $s;
	}

	// REV: nested braces, to make [ house [building]] possible.
	function format( $format = '$type $Name[ $Rank][, д. $House][, к. $Building]' )
	{
		/*
		Example:
			Переулок Велосипедный 2-й, д. 12A, к. 3
		Tokens:
			$Type = Переулок
			$type = пер.
			$Name = Велосипедный
			$Rank = 2-й
			$rank = 2
			$House = 12A
			$Building = 3
		*/

		$tokens = array();


		$abr = self::$street_types;
		if( $this->street_name )
		{
			$tokens['Type'] = $this->street_type;
			if( !$this->street_type ) {
				warning( "Empty street type at address.php" );
				$tokens['type'] = '';
			} else {
				$tokens['type'] = $abr[$this->street_type];
			}
		}
		else
		{
			$tokens['type'] = $tokens['Type'] = '';
		}

		//
		// Name, Rank and rank
		//
		$tokens['Name'] = $this->street_name;
		if( $this->street_number )
		{
			$tokens['rank'] = $this->street_number;
			if( $this->street_type == 'улица' ){
				$tokens['Rank'] = "$tokens[rank]-я";
			} else {
				$tokens['Rank'] = "$tokens[rank]-й";
			}
		}
		else {
			$tokens['Rank'] = null;
			$tokens['rank'] = null;
		}
		$tokens['Name'] = mb_ucfirst( $tokens['Name'] );

		$tokens['House'] = $this->house_number;
		$tokens['Building'] = $this->house_building;

		// City and Country
		$tokens['Place'] = $this->place;
		$tokens['City'] = $this->place;
		$tokens['Country'] = $this->country;

		preg_match_all( '@\[(.*?)\]@', $format, $m );
		foreach( $m[0] as $i => $optional )
		{
			preg_match( '@\$(\w+)@', $optional, $v );
			$varname = $v[1];
			if( $tokens[$varname] )
			{
				$replacement = str_replace( $v[0], $tokens[$varname], $m[1][$i] );
				if( $replacement ) {
					$format = str_replace( $optional, $replacement, $format );
				} else {
					$format = str_replace( $optional, '', $format );
				}
			} else {
				$format = str_replace( $optional, '', $format );
			}
		}

		preg_match_all( '@\$(\w+)@', $format, $m );
		foreach( $m[0] as $i => $tok )
		{
			$varname = $m[1][$i];
			if( !isset( $tokens[$varname] ) ) {
				warning( "Uknown token: $varname in address->format($format)." );
				continue;
			}
			$format = str_replace( $tok, $tokens[$varname], $format );
		}

		return $format;
	}

	function __toString(){
		return $this->format( '[$type ]$Name[ $Rank][, д. $House][, к. $Building]' );
	}
}

?>
