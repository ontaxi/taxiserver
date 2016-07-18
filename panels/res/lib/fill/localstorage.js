/*
 * Defines localStorage where it is not present or not working.
 */
(function(){

	if( supported() ) {
		return;
	}
	fill();

	/*
	 * Returns true if localStorage is supported.
	 */
	function supported()
	{
		try {
			var val = 42;
			localStorage.setItem( "test-support", val );
			var stored = localStorage.getItem( "test-support" );
			localStorage.removeItem( "test-support" );
			return stored == val;
		}
		catch( whatever ) {
			return false;
		}
	}

	function fill()
	{
		var data = {};

		Storage.prototype.setItem = function( key, value ) {
			data[key] = value;
		};

		Storage.prototype.getItem = function( key ) {
			if( key in data ) {
				return data[key];
			}
			return null;
		};

		Storage.prototype.removeItem = function( key ) {
			delete data[key];
		};

		Storage.prototype.clear = function() {
			data = {};
		};
	}

})();
