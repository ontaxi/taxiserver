function romanNumeral( n )
{
	if( n == 0 || n >= 5000 ) {
		return n;
	}

	var positions = ["IVX", "XLC", "CDM", "M??"];
	var parts = [];
	for( var i = 0; i < positions.length; i++ )
	{
		parts.unshift( pos( n % 10, positions[i] ) );
		n = Math.floor( n / 10 );
		if( !n ) break;
	}

	function pos( num, digits )
	{
		if( !num ) return '';
		var one = digits.charAt(0),
			five = digits.charAt(1),
			ten = digits.charAt(2);

		if( num < 4 ) {
			return one.repeat( num );
		}
		if( num == 4 ) {
			return one + five;
		}
		if( num < 9 ) {
			return five + one.repeat( num - 5 );
		}
		if( num == 9 ) return one + ten;
		return "?";
	}

	return parts.join('');
}
