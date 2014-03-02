/**
 * Collection
 */

var app = app || { };

app.stream = function(options) {

	var events = { };
	var self   = {

		options: $.extend({

			// Options
            'uid'   : null,
            'debug' : true,
            'limit' : 50,

            // Plugin callbacks
            onReady : function() { },

            // Track callbacks
            trackConnect : function() { },
            trackReady   : function() { },
            trackPlay    : function() { },
            trackPause   : function() { },
            trackFinish  : function() { },

        }, options),

		// Data
        data : {
        	activeUser  : { },
        	activeTrack : { },
        	'offset'    : 0,
        },

        sound       : { }, // Sound Manager sound
        favorites   : [ ], // All of the favorites
        history     : [ ], // Played favorites

		setup : function() {

			// Events
			$(events)
				// Initialize
				.on('userReady', self.setFavorites)
				// Methods
				.on('playTrack', self.playTrack)
				// Track events
				.on('trackConnect', self.trackConnect)
				.on('trackReady', self.trackReady)
				.on('trackPause', self.trackPause)
				.on('trackPlay', self.trackPlay)
				.on('trackFinish', self.trackFinish)
				// Start by playing a random track
				.on('favoritesReady', self.playRandomTrack);

			// Start
			self.setUser();

		},

		setUser : function() {
			SC.get('/users/' + self.options.uid, function(user){
				self.data.activeUser = user;
				$(events).trigger('userReady');
			});
		},

		setFavorites : function() {
			SC.get('/users/' + self.options.uid + '/favorites', { 
				limit: self.options.limit, 
				offset: self.data.offset 
			}, function(tracks) {

				// Add each track to the favorites array
				for (var i = tracks.length - 1; i >= 0; i--) {
					self.favorites.push(tracks[i]);
				};

				// Check to see if we're done constructing the favorites
				if ( self.favorites.length > (self.data.activeUser.public_favorites_count - self.options.limit) ) {
					$(events).trigger('favoritesReady');
				} else {
					self.data.offset = self.data.offset + self.options.limit;
					self.setFavorites();
				}

			});
		},

		playRandomTrack : function() {
			self.data.activeTrack = self.getRandomFavorite();
			$(events).trigger('playTrack');
		},

		playTrack : function() {

			// Destruct and fade out previous sound
			if ( ! $.isEmptyObject(self.sound) ) {

				self.fadeOut();

				$(events).on('fadeOutComplete', function() {
					self.sound.destruct();
					self.openStream();
				});

			} else {
				self.openStream();
			}

		},

		openStream : function() {
			// Open the new stream
			SC.stream('/tracks/' + self.data.activeTrack.id, {
				onconnect : function() {
					$(events).trigger('trackConnect');
				},
				onload : function() {
					$(events).trigger('trackReady');
				},
				onplay : function() {
					$(events).trigger('trackPlay');
				},
				onpause : function() {
					$(events).trigger('trackPause');
				},
				onfinish : function() {
					$(events).trigger('trackFinish');
				}
			}, function(sound) {
				self.sound = sound;
				self.sound.play();
			});
		},

		fadeOut : function() {

			var volume = 100,
				fade;

			fade = setInterval(function() {

				volume -= 5;

				if ( volume > 1 ) {
					self.sound.setVolume(volume);
				} else {
					self.sound.setVolume(0);
					$(events).trigger('fadeOutComplete');
					clearInterval(fade);
				}

			}, 50);

		},

		trackConnect : function() {
			self.options.trackConnect();
		},

		trackReady : function() {
			self.options.trackReady();
		},

		trackPlay : function() {
			self.options.trackPlay();
		},

		trackPause : function() {
			self.options.trackPause();
		},

		trackFinish : function() {
			// - Add to history
			// - Play new track

			// Callbacks
			self.options.trackFinish();

		},

		getRandomFavorite : function() {
			return self.favorites[Math.floor(Math.random() * self.favorites.length)];
		},

	};

	return {

		// Data
		options : self.options,
		data    : self.data,

		// States
		favorites : self.favorites,
		history   : self.history,

		// Public methods
		setup           : self.setup,
		playRandomTrack : self.playRandomTrack

	}

};