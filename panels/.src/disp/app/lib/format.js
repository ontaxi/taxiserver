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
 * Replaces decimal point with locale equivalent.
 */
function formatNumber( n )
{
	return n.toString().replace( '.', ',' );
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

/*
 * Format a number of seconds as a time period.
 */
function formatSeconds( sec )
{
	var min = Math.floor( sec / 60 );
	sec %= 60;

	var hour = Math.floor( min / 60 );
	min %= 60;

	var values = [ hour, min, sec ];
	var units = [ "ч", "мин.", "с" ];

	if( !values[0] ) {
		values.shift();
		units.shift();
	}

	var s = [];
	for( var i = 0; i < values.length; i++ ) {
		s.push( values[i] + ' ' + units[i] );
	}
	return s.join( ' ' );
}

function formatNumber( n, thousandsSep )
{
	if( n == 0 ) return '0';
	if( typeof thousandsSep == "undefined" ) {
		thousandsSep = " ";
	}

	var minus = n < 0;
	if( minus ) n *= -1;

	var groups = [];
	while( n > 0 )
	{
		var lastThree = (n % 1000).toString();
		n = Math.floor( n / 1000 );

		if( n > 0 ) {
			while( lastThree.length < 3 ) {
				lastThree = '0' + lastThree;
			}
		}
		groups.unshift( lastThree );
	}
	var s = minus ? '-' : '';
	return s + groups.join( thousandsSep );
}
