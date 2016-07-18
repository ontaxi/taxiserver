window.sounds = (function()
{
	var sounds = {};

	/*
	 * Overall volume.
	 */
	var generalVolume = 0.5;
	/*
	 * List of allocated sounds.
	 */
	var tracks = [];

	sounds.vol = function( newVolume )
	{
		if( typeof newVolume == "undefined" ) {
			return generalVolume;
		}
		generalVolume = clip( newVolume );

		tracks.forEach( function( t ) {
			t.sound.volume = t.volume * generalVolume;
		});
	};

	/*
	 * Created and returns a "sound track".
	 */
	sounds.track = function( url, volume )
	{
		if( typeof volume == "undefined" ) {
			volume = 1.0;
		} else {
			volume = clip( volume );
		}

		var s = new Audio();
		s.preload = "auto";
		s.src = url;
		s.volume = volume * generalVolume;

		var track = {
			sound: s,
			volume: volume
		};

		tracks.push( track );
		return new SoundTrack( track );
	};

	function SoundTrack( track )
	{
		var s = track.sound;

		this.play = s.play.bind( s );
		this.stop = function() {
			s.pause();
			s.currentTime = 0;
		};
		this.vol = function( newVol )
		{
			if( typeof newVol == "undefined" ) {
				return track.volume;
			}
			newVol = clip( newVol );
			track.volume = newVol;
			track.sound.volume = track.volume * generalVolume;
		};
	};

	function clip( volume ) {
		if( volume < 0.0 || volume > 1.0 ) {
			console.warn( "The volume must be between 0.0 and 1.0,", volume, "given" );
			if( volume < 0.0 ) volume = 0.0;
			else if( volume > 1.0 ) volume = 1.0;
		}
		return volume;
	}

	return sounds;
})();
