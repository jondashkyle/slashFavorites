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
            onReady   : function() { },
            userReady : function() { },
            noTracks  : function() { },

            // Track callbacks
            trackConnect : function() { },
            trackReady   : function() { },
            trackPlay    : function() { },
            trackPause   : function() { },
            trackFinish  : function() { },

            // Misc
            artistFavoritesReady : function() { }

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
				.on('userReady', self.userReady)
				.on('streamTrack', self.streamTrack)
				.on('trackConnect', self.trackConnect)
				.on('trackReady', self.trackReady)
				.on('trackPause', self.trackPause)
				.on('trackPlay', self.trackPlay)
				.on('trackFinish', self.trackFinish)
				.on('favoritesReady', self.favoritesReady)
				.on('noTracks', self.noTracks);

			// Start
			self.setUser();

		},

		/**
		 * TODO : CLEAN THIS UP W/ FADEOUT
		 */
		disable : function() {
			
			var volume = 100,
				fade;

			fade = setInterval(function() {

				volume -= 5;

				if ( volume > 1 ) {
					self.sound.setVolume(volume);
				} else {
					self.sound.setVolume(0);
					self.sound.destruct();
					clearInterval(fade);
				}

			}, 50);

		},

		setUser : function() {
			SC.get('/users/' + self.options.uid, function(user) {

				// Make sure we have some favorites
				if ( user.public_favorites_count > 2 ) {
					self.data.activeUser = user;
					$(events).trigger('userReady');
					self.options.userReady();
				} else {
					$(events).trigger('noTracks');
				}

			});
		},

		userReady : function() {
			self.setFavorites();
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

					// Update the offset
					self.data.offset = self.data.offset + self.options.limit;

					// Rate limiting
					if (self.data.offset > 200 ) {
						$(events).trigger('favoritesReady');
						setTimeout(self.setFavorites, 1000);
					} else {
						self.setFavorites();
					}

				}

			});
		},

		streamRandomTrack : function() {

			var track = self.getRandomFavorite();

			// Check against the history
			if ( self.favorites.length > 0 ) {

				// Try again if we got the same track
				if ( track.id == self.data.activeTrack.id ) {
					self.streamRandomTrack();
					return false;
				}

				// Add to history
				self.history.push(track);

				// Remove from favorites
				for (var i = self.favorites.length - 1; i >= 0; i--) {
					if (self.favorites[i].id === track.id) {
				    	self.favorites.splice(i,1);
				    	break;
					}
				};

				// Set it as the active track
				self.data.activeTrack = track;

			} else {
				self.favorites = self.history;
				self.history   = [ ];
			}

			$(events).trigger('streamTrack');

		},

		streamTrack : function() {

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
					// $(events).trigger('trackReady');
				},
				onplay : function() {
					$(events).trigger('trackPlay');
				},
				onresume : function() {
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
				SC.get('/users/' + self.data.activeTrack.user.id, function(user) {
					if ( user.public_favorites_count > 2 ) {
						self.data.activeTrack.user.public_favorites_count = user.public_favorites_count;
					}
					$(events).trigger('trackReady');
				});
			});

		},

		togglePause : function() {
			self.sound.togglePause();
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
					self.sound.destruct();
					$(events).trigger('fadeOutComplete');
					clearInterval(fade);
				}

			}, 50);

		},

		favoritesReady : function() {
			self.streamRandomTrack();
			$(events).off('favoritesReady');
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
			self.options.trackFinish();
		},

		noTracks : function() {
			self.options.noTracks();
		},

		artistFavoritesReady : function() {
			self.options.artistFavoritesReady();
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
		setup             : self.setup,
		disable           : self.disable,
		streamRandomTrack : self.streamRandomTrack,
		togglePause       : self.togglePause

	}

};