var geo = ( function() {

	/*
	 * Earth approximate radius in meters (WGS-84).
	 */
	var RADIUS = 6378137;

	var geo = {};

	/*
	 * Returns distance between two points.
	 * Uses Haversine formula.
	 */
	geo.distance = function( from, to )
	{
		var lat1 = from[0];
		var lon1 = from[1];
		var lat2 = to[0];
		var lon2 = to[1];

		var d2r = Math.PI / 180;
		var dLat = (lat2 - lat1) * d2r;
		var dLon = (lon2 - lon1) * d2r;

		lat1 *= d2r;
		lat2 *= d2r;
		var sin1 = Math.sin(dLat / 2);
		var sin2 = Math.sin(dLon / 2);

		var a = sin1*sin1 + sin2*sin2*Math.cos(lat1)*Math.cos(lat2);
		var d = RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return d;
	};

	return geo;

})();
