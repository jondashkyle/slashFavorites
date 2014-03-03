// Namespace
var app = app || { };

var test;

// Store the streams
app.streams = [ ];

/**
 * Core contains the essentials
 */
app.core = {

	data : {
		limit : 50
	},

	setup : function() {

		var self = this;

		this.soundcloud();
		this.soundmanager();

		$(window).hashchange( function() {

			var hash = location.hash.replace('#', '');

			if ( hash !== '') {
				// Check for a user
				self.lookupUser('http://soundcloud.com/' + hash)
			} else {
				// Start as featured
				app.browsing.show();
			}

		}).hashchange();

	},

	soundcloud : function() {
		SC.initialize({
			client_id: app.config.key,
			redirect_uri: "http://example.com/callback.html",
		});
	},

	soundmanager : function() {
		soundManager.setup({
			url: '/_libraries/soundmanager/swf/',
			flashVersion: 9, // optional: shiny features (default = 8)
			preferFlash: false,
			debugMode : false,

			defaultOptions: {
			    // set global default volume for all sound objects
			    volume: 100
			}
		});
	},

	startStream : function(uid) {

		// Loading indicator
		app.loading.show();

		// Disable all the other streams
		for (var i = app.streams.length - 1; i >= 0; i--) {
			app.streams[i].disable();
		};

		// Setup the stream
		var stream = app.stream({

			'uid'  : uid,
			'limit': this.data.limit,

			userReady : function() {
				app.ui.updateStream(stream.data.activeUser);
			},
			trackReady : function() {
				app.loading.initialized();
				app.ui.updateTrack(stream.data.activeTrack);
				// Give the image some time to load
				setTimeout(function() {
					$('html').attr('data-streaming', '');
					app.loading.hide();
				}, 200);
			},
			trackPlay : function() {
				$('.playpause').text('pause');
			},
			trackPause : function() {
				$('.playpause').text('play');
			},
			trackFinish : function() {
				app.loading.show();
				stream.streamRandomTrack();
			},
			noTracks : function() {
				app.ui.noTracks();
			}

		});

		// Initialize
		stream.setup();

		// Add to the array of streams
		app.streams.push(stream);

	},

	getURL : function() {

		var hash = window.location.hash,
			name = false;

		// If there is a name, grab it
		if ( hash && hash !== '' ) {
			name = hash.replace('#', '');
		}

		return name;

	},

	setURL : function(user) {
		window.location.hash = user;
	},

	lookupUser : function(url) {
		var self = this;
		SC.get('/resolve', { url: url }, function(user) {
			if ( user.public_favorites_count > 2) {
				self.startStream(user.id);
			} else {
				app.ui.noTracks();
			}
		});
	}

};

app.ui = {

	setup : function() {

		$('body')
			.on('click', '[data-skip]', function(event) {
				app.loading.show();
				app.streams[app.streams.length - 1].streamRandomTrack();
				event.preventDefault();
			})
			.on('click', '[data-togglepause]', function(event) {
				app.streams[app.streams.length - 1].togglePause();
				event.preventDefault();
			})
			.on('click', '[data-swap]', function(event) {
				app.loading.show();
				app.core.setURL(app.streams[app.streams.length - 1].data.activeTrack.user.permalink);
				event.preventDefault();
			});
			// .on('click', '[data-permalink]', function(event) {
			// 	app.loading.show();
			// 	app.core.setURL($(this).attr('data-permalink'));
			// });

	},

	updateStream : function(user) {
		$('#stream')
			.addClass('active')
			.find('.currently')
			.html('<a href="' + user.permalink_url + '" target="_blank">' + user.username + '</a> (' + user.public_favorites_count +')');
	},

	updateTrack : function(track) {

		var artist_favorites_count = track.user.public_favorites_count;

		if ( artist_favorites_count > 2 ) {
			$('#artist .currently').html('<a href="' + track.user.permalink_url + '" target="_blank">' + track.user.username + '</a> (<a class="swap" data-swap>' + track.user.public_favorites_count + '</a>)');
		} else {
			$('#artist .currently').html('<a href="' + track.user.permalink_url + '" target="_blank">' + track.user.username + '</a> (0)');
		
		}
		
		$('#track .currently').html('<a href="' + track.permalink_url + '" target="_blank">' + track.title + '</a>');
		$('#artwork').css('background-image', 'url(' + (track.artwork_url || track.user.avatar_url) + ')');

	},

	noTracks : function() {
		$('html').attr('data-notracks', '');
		setTimeout(function() {
			app.loading.hide();
		}, 100);
	}

};

app.navigation = {

	show : function() {
		$('html').attr('data-navigation', '');
	},

	hide : function() {
		$('html').removeAttr('data-navigation');
	},

	toggle : function() {
		if ( $('html').is('[data-navigation') ) {
			this.hide();
		} else {
			this.show();
		}
	},

	setup : function() {

		var self = this;

		$('#nav_link')
			.on('mouseenter', function() {
				self.show();
			})
			.on('click', function() {
				self.toggle();
			})

		$('#navigation').on('mouseleave', function() {
			self.hide();
		});

	}

};

app.loading = {

	characters : ['&#9786;', '&#9786;', '&#9787;', '&#9785;', '&#9788;', '&#9730;', '&#9731;', '&#9883;', '&#9990;', '&#63743;', '&#8984;', '&#8679;', '&#10017;', '&#9773;', '&#9756;', '&#9758;', '&#9757;', '&#9759;', '&#9996;', '&#10004;', '&#9733;', '&#9850;', '&#9992;', '&hearts;', '&#9834;', '&#9835;', '&#9836;', '&#9792;', '&#9794;', '&#9890;', '&#9891;', '&#10006;', '&infin;', '&yen;', '&euro;', '&#36;', '&cent;', '&pound;', '&copy;', '&reg;', '&#64;'],
	loop       : null,
	$el        : null,

	randomCharacter : function() {
		var character = this.characters[Math.floor(Math.random() * this.characters.length)];
		this.$el.html(character);
	},

	show : function() {

		var self = this;

		$('html').attr('data-loading', '');
		$('html').removeAttr('data-notracks data-streaming');

		if ( self.loop == null ) {
			this.loop = setInterval(function() {
				self.randomCharacter();
			}, 50);
		}

	},

	hide : function() {
		var self = this;
		$('html').removeAttr('data-loading');
		clearInterval(self.loop);
		self.loop = null;
	},

	initialized : function() {
		$('html').removeAttr('data-initializing');
	},

	setup : function() {
		this.$el = $('#loading');
	}

};

app.resize = {

	$el : {

	},

	setCache : function() {
		this.$el.container = $('#container');
	},

	setFontSize : function() {

		var winWidth = this.$el.container.width();
		var fontSize = Math.floor(winWidth / 40);

		if ( fontSize < 18 ) {
			fontSize = 18;
		} else if ( fontSize > 40 ) {
			fontSize = 40;
		}

		// Font size
		vein.inject('body, #browse_search input', {
			'font-size' : fontSize + 'px'
		});

	},

	setNavPad : function() {

		var margin = this.getPercentage(0.03);
		var height = this.getPercentage(0.05);
		var width  = this.getPercentage(0.7);
		var line   = this.getPercentage(0.0015);

		if ( line < 1 ) {
			line = 1;
		}

		vein.inject('#stream, #controls, #nav_link', {
			'margin' : margin + 'px ' + margin + 'px ' + (margin * 0.75) + 'px'
		});

		vein.inject('#nav_link', {
			'width' : Math.floor(height / 2) + 'px',
		});

		vein.inject('#nav_link div', {
			'border-radius' : Math.floor(height / 10) / 2 + 'px',
			'height' : Math.floor(height / 10) + 'px',
			'margin-bottom' : Math.floor(height / 20) + 'px'
		});

		vein.inject('.currently', {
			'max-width' : width + 'px'
		});

		vein.inject('#toolbar > div', {
			'height'  : height + 'px',
			'width'   : height + 'px'
		});

		vein.inject('.option_line', {
			'margin-left'   : line * 10 + 'px',
			'height'        : line + 'px',
			'border-radius' : line / 2 + 'px'
		});

		$('.section').each(function() {
			var offset = $(this).find('.options .title').width();
			$(this).find('.option_line').css('left', offset);
		});

	},

	getPercentage : function(percent) {
		return Math.floor(this.$el.container.width() * percent);
	},

	setup : function() {

		var self = this;

		self.setCache();

		$(window).on('resize', function() {
			self.setFontSize();
			self.setNavPad();
		}).resize();

	}

};

app.shortcuts = {

	setup : function() {
		$(document).on('keydown', function(event) {
			if ( ! $('html').is('[data-browsing]') ) {
				app.shortcuts.events(event);
			}
		});
	},

	events : function(event) {
		var key = event.which;

		// Pause toggle by space
		if ( key == 32) {
			app.streams[app.streams.length - 1].togglePause();
			event.preventDefault();

		// Skip by left arrow
		} else if ( key == 39 || key == 82 ) {
			app.loading.show();
			app.streams[app.streams.length - 1].streamRandomTrack();
			event.preventDefault();

		// Swap by up arrow
		} else if ( key == 38 ) {
			app.loading.show();
			app.core.setURL(app.streams[app.streams.length - 1].data.activeTrack.user.permalink);
			event.preventDefault();
		}
	}

};

app.browsing = {

	setup : function() {

		var self = this;

		// Populate with streams
		$.ajax({
			url: "featured.json",
			type: "GET"
		}).done(function(data) {

			var $browse = $('#browse_streams');

			for (var i = data.length - 1; i >= 0; i--) {

				var stream  = data[i];
				var $stream = $('<div/>')
					.addClass('browse_stream')
					.text(stream.name)
					.attr('data-permalink', stream.permalink);

				$stream.prependTo($browse);

			};


		});

		// Listen to submit
		$('#browse_search form').on('submit', function(event) {
			var permalink = $(this).find('input').val();
				permalink = permalink.toString();
				permalink = permalink.toLowerCase();

			// Remove the soundcloud url
			permalink = permalink.replace('http://soundcloud.com/', '');
			permalink = permalink.replace('https://soundcloud.com/', '');
			permalink = permalink.replace('www.soundcloud.com/', '');
			permalink = permalink.replace('soundcloud.com/', '');

			app.core.setURL(permalink);
			app.browsing.hide();
			app.loading.show();
			event.preventDefault();
		});

		// Listen to clicks
		$('body')
			.on('click', '[data-browse]', function() {
				if ( $('html').is('[data-browsing]') ) {
					self.hide();
				} else {
					self.show();
				}
			})
			.on('click', '#browse_close', function() {
				self.hide();
			})
			.on('click', '.browse_stream', function() {
				$(this).addClass('visited');
				$('#browse_search input')
					.val('')
					.on('autotyped', function() {
						$('#browse_search form').submit();
					})
					.autotype($(this).attr('data-permalink') + '{{enter}}', {delay: 100});
			})
			.on('focus', '#browse_search input', function() {
				$(this).val('');
			})

	},

	show : function() {
		$('#browse').addClass('active');
		setTimeout(function() {
			$('html').attr('data-browsing', '');
		}, 10);
	},

	hide : function() {
		$('html').removeAttr('data-browsing', '');
		setTimeout(function() {
			$('#browse').removeClass('active');
		}, 500);
	}

};

// Initialize modules
$(function() {

	for (var key in app) {
		if ( app[key].setup !== undefined ) {
			app[key].setup();
		}
	}

});