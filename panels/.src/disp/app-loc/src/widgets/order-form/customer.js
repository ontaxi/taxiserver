function CustomerSection( $container )
{
	var ids = Date.now();
	var s = '<div><label for="id1">Телефон клиента</label>'
		+ '<input type="tel" id="id1"></div>'
		+ '<div><label for="id2">Имя клиента</label><input id="id2"><button class="history" type="button" title="Адреса">Адреса</button>';
	s = s.replace( 'id1', '--id-cust-' + (++ids) );
	s = s.replace( 'id2', '--id-cust-' + (++ids) );
	var $s = $( s );
	$container.append( $s );

	var $phone = $s.find( "input" ).eq(0);
	var $name = $s.find( "input" ).eq(1);
	var $button = $s.find( "button" ).eq(0);
	$button.prop( "disabled", true );

	this.get = function() {
		return {
			customer_phone: getPhone(),
			customer_name: $name.val()
		};
	};

	var addresses = [];
	var onAddress = null;

	this.onAddress = function( func ) {
		onAddress = func;
	};

	$button.on( "click", function() {
		var s = '<div class="menu">';
		addresses.forEach( function( addr, i ) {
			s += '<div data-id="'+i+'">'+addr.format()+'</div>';
		});
		s += '</div>';

		var $c = $( s );
		var d = new Dialog( $c.get(0) );
		d.setTitle( "Адреса клиента" );
		d.addButton( "Закрыть", null, "no" );
		d.show();

		$c.on( "click", "div", function() {
			var i = $(this).data( "id" );
			if( typeof i == "undefined" ) return;
			if( onAddress ) onAddress( addresses[i] );
			d.close();
		});
	});

	$phone.on( "change", function() {
		var phone = getPhone();
		$name.addClass( "wait" );
		$button.prop( "disabled", true );
		disp.findCustomer( phone ).then( function( customer ) {
			$name.val( customer.name );
			$name.removeClass( "wait" );
			addresses = customer.addresses;
			if( addresses.length > 0 ) {
				$button.prop( "disabled", false );
			}
		})
		.catch( function() {
			// No such customer
			$name.removeClass( "wait" );
		});
	});

	function getPhone()
	{
		var n = $phone.val().replace( /[\s]/g, '' );
		/*
		 * If there is not enough digits even for bare number, return
		 * whatever is there.
		 */
		if( n.length < 7 ) return n;
		/*
		 * If it's a bare number, add default area code.
		 * Also add country code if it's not there.
		 */
		if( n.length == 7 ) {
			n = "29" + n;
		}
		if( n.length == 9 ) {
			n = "+375" + n;
		}
		return n;
	}

	this.set = function( order )
	{
		var phone = order.customer_phone;
		var name = order.customer_name;
		if( phone ) {
			$phone.val( formatPhone( phone ) );
		}
		$name.val( name );
	};
}
