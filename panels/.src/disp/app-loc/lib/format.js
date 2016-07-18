/*
 * Takes raw phone number string and formats it nicely.
 * The format is "+375 <code> <3d>-<2d>-<2d>".
 */
function formatPhone( str )
{
	if( !str ) return str;
	var original = str;
	if( str.indexOf( "+375" ) == 0 ) {
		str = str.substr( 4 );
	}

	str = str.replace( /[^\d]/g, '' );

	var parts = [
		str.substr( 0, 2 ),
		str.substr( 2, 3 ),
		str.substr( 5, 2 ),
		str.substr( 7 )
	];

	if( parts[3] == '' || parts[3].length > 2 ) return original;

	var s = '+375 ' + parts.shift();
	if( parts.length > 0 ) {
		s += ' ' + parts.join( '-' );
	}

	return s;
}

/*
 * Formats time as hour:minute. The argument is UTC seconds.
 */
function formatTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );
	return fmt( "%02d:%02d", d.getHours(), d.getMinutes() );
}

/*
 * Formats unixtime as "day.month.year hours:minutes".
 */
function formatDateTime( time )
{
	var d = new Date();
	d.setTime( time * 1000 );

	return fmt( "%02d.%02d.%d %02d:%02d",
		d.getDate(),
		d.getMonth() + 1,
		d.getFullYear(),
		d.getHours(),
		d.getMinutes()
	);
}
