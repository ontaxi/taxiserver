/*
 * Some operations on objects.
 */
var obj = (function()
{
	var obj = {};

	obj.merge = function( _args_ )
	{
		var o = {};
		for( var i = 0; i < arguments.length; i++ )
		{
			var add = arguments[i];
			for( var k in add ) {
				o[k] = add[k];
			}
		}
		return o;
	};

	obj.subset = function( o, fields )
	{
		var s = {};
		var n = fields.length;
		var k;
		for( var i = 0; i < n; i++ ) {
			k = fields[i];
			s[k] = o[k];
		}
		return s;
	};

	obj.copy = function( o ) {
		return JSON.parse( JSON.stringify( o ) );
	};

	obj.toArray = function( o ) {
		var a = [];
		for( var k in o ) {
			a.push( o[k] );
		}
		return a;
	};

	obj.keys = function( o ) {
		var keys = [];
		for( var k in o ) keys.push( k );
		return keys;
	};

	/*
	 * Returns a map of array indexed by values of
	 * their keyname field.
	 */
	obj.index = function( array, keyname )
	{
		var index = {};
		var n = array.length;
		for( var i = 0; i < n; i++ )
		{
			var item = array[i];
			var key = item[keyname];
			if( !key ) continue;
			index[key] = item;
		}
		return index;
	};

	/*
	 * Returns first element matching to the filter, from the array.
	 */
	obj.find = function( array, filter )
	{
		var r = [];
		var n = array.length;
		for( var i = 0; i < n; i++ ) {
			if( this.match( array[i], filter ) ) {
				r.push( array[i] );
			}
		}
		return r;
	};

	/*
	 * Returns first element matching to the filter, from the array.
	 */
	obj.findOne = function( array, filter )
	{
		var n = array.length;
		for( var i = 0; i < n; i++ ) {
			if( this.match( array[i], filter ) ) {
				return array[i];
			}
		}
		return null;
	};

	/*
	 * Returns true if filter is a matching subset of item.
	 */
	obj.match = function( item, filter )
	{
		for( var k in filter )
		{
			if( !(k in item) || (item[k] != filter[k]) ) {
				return false;
			}
		}
		return true;
	};

	obj.column = function( items, key )
	{
		var list = [];
		for( var i = 0; i < items.length; i++ ) {
			var item = items[i];
			list.push( item[key] );
		}
		return list;
	};

	/*
	 * Returns true if the given object is empty.
	 */
	obj.isEmpty = function( item )
	{
		for( var k in item ) return false;
		return true;
	};

	obj.unique = function( array )
	{
		var set = {};
		var vals = [];

		for( var i = 0; i < items.length; i++ ) {
			var i = array[i];
			if( i in set ) continue;
			set[i] = true;
			vals.push( i );
		}

		return vals;
	};

	return obj;
})();
