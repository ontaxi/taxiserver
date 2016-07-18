<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Pool</title>
<style>
body {
	font-family: sans-serif;
	font-size: 11pt;
	margin: 0;
	padding: 0;
}

table {
	width: 100%;
}
td {
	padding: 0.5em 1em;
}

tr:nth-child(odd) {
	background: #eee;
}
</style>
</head>
<body>

<script src="/res/lib/jquery.js"></script>
<script>

$(document).ready( function()
{
	var name = getName();
	createPoolWidget('/dx/driver/', name, '123');

	function getName()
	{
		return location.search.match( /\?name=([^&]*)(.*)?$/ )[1] || "qwerty";
	}

	function createPoolWidget( pref, login, pass )
	{
		auth( login, pass ).then( startUpdates );

		var token = null;
		var orders = [];
		var $out = $('<div></div>');

		function auth( login, pass )
		{
			var url = pref + 'auth';
			var data = {name: login, password: pass};
			return $.post(url, data);
		}

		function startUpdates(data)
		{
			if( data.errstr != "ok" ) {
				console.log( data.errstr );
				return;
			}
			token = data.token;
			update();
			setInterval(refresh, 500);
			$('body').append($out);
		}

		function update()
		{
			var url = pref + 'orders-pool?t=' + token;
			$.get(url).then(save).then(setTimeout.bind(window, update, 5000));
		}

		function save(data)
		{
			orders = data.list.sort( function(a, b) {
				return a.assignment_time - b.assignment_time;
			});
		}

		function refresh()
		{
			var s = '<table>';
			var vals = [
				'id', 'Адрес', 'Назначение', 'Комментарии',
				'Время прибытия', 'Время до принятия'
			];
			s += '<tr><th>' + vals.join('</th><th>') + '</th></tr>';
			var n = orders.length;
			for( var i = 0; i < n; i++ )
			{
				var o = orders[i];

				vals = [o.order_id, o.from_address, o.to_address,
					o.comments];

				if( o.arrival_time ) {
					vals.push( formatDate( o.arrival_time ) );
				}
				else {
					vals.push( 'Сейчас' );
				}

				if( o.assignment_time )
				{
					var dt = o.assignment_time - Math.round(Date.now()/1000);
					if( dt <= 0 ) {
						continue;
					}
					vals.push(dt);
				}
				else
				{
					vals.push( '&mdash;' );
				}

				s += '<tr><td>' + vals.join( '</td><td>' ) + '</td></tr>';

			}

			s += '</table>';

			$out.html(s);
		}

		function formatDate( time )
		{
			var d = new Date();
			d.setTime( time * 1000 );
			return d2( d.getDate() ) + '.' + d2( d.getMonth() + 1 )
				+ ' ' + d2( d.getHours() ) + ':' + d2( d.getMinutes() );
		}

		function d2( n ) {
			return n < 10 ? '0' + n : n.toString();
		}
	}

});

</script>
</body>
</html>
