function initSettings( conn, listeners, data )
{
	var settings = {};

	try {
		var s = JSON.parse( data.who.settings );
		settings = obj.merge( settings, s );
	} catch( e ) {
		console.warn( "Could not parse saved settings:", e );
	}

	this.getSetting = function( name, def ) {
		if( name in settings ) return settings[name];
		return def;
	};

	this.changeSetting = function( name, val ) {
		if( settings[name] == val ) return;
		settings[name] = val;
	};

	this.saveSettings = function() {
		return conn.dx().post( 'prefs', {prefs: JSON.stringify( settings )} );
	};
}
