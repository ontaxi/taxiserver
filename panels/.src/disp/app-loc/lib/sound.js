window.sound = (function()
{
	var s = new Audio();
	s.preload = 'auto';
	s.src = '/content/phone.ogg';

	var sound = {};

	sound.play = function() {
		s.play();
	};

	sound.stop = function() {
		s.pause();
		s.currentTime = 0;
	};

	sound.vol = function( newVol ) {
		if( typeof newVol == "undefined" ) {
			return s.volume;
		}
		s.volume = newVol;
	};

	return sound;
})();
