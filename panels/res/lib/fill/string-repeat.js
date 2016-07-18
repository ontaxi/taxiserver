String.prototype.repeat = function( count ) {
	var s = "";
	while( count > 0 ) {
		count--;
		s += this;
	}
	return s;
}
