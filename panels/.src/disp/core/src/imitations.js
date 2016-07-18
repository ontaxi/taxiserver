function initImitations( conn, listeners, data )
{
	this.setDriverOnline = function( driver_id, online ) {
		return conn.send( 'set-imitation-online', {
			taxi_id: driver_id,
			online: online? 1 : 0
		})
	};

	this.imitationsEnabled = function() {
		return data.service_options.imitations == "1";
	};
}
