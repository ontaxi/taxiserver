function DriversTableWidget( disp )
{
	var $table;

	this.root = function() {
		return $table.get(0);
	};

	var s = '<table class="items">';
	s += '<tr><th>Позывной</th><th>Имя</th><th>Телефон</th><th>Автомобиль</th><th>Номер</th><th>Цвет</th></tr>';
	var rt = '<tr>' + '<td>?</td><td>?</td><td>?</td>'
		+ '<td>?</td><td>?</td><td>?</td>' + '</tr>';
	disp.drivers().forEach( function( d ) {
		var c = disp.getCar( d.car_id );
		if( !c ) c = {name: "", plate: "", color: ""};
		s += tpl( rt,
			d.call_id, d.name, d.phone,
			c.name, c.plate, c.color );
	});
	s += '</table>';
	$table = $( s );
}
