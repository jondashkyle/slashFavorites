var app = app || { };

/**
 * API handles everything with SoundCloud
 * @type {Object}
 */
app.api = {

	// Notes
	// Pagination: &limit=1000&offset=20

	data : {
		uid   : '2614244',
		key   : 'b4aede257e54e309f8806921476260e6',
		limit : 100,
		offset: 0
	},

	// Cache
	user     : { },
	likes    : [ ],
	current  : { },
	listened : [ ],

	getUser : function() {

		var data = app.api.data;

		$.ajax({
			url : 'http://api.soundcloud.com/users/' + data.uid + '.json?client_id=' + data.key
		})
		.done(function(result) {
			app.api.user = result;
			$(document).trigger('userReady');
		});

	},

	getLikes : function() {

		var data  = app.api.data;
		var likes = app.api.likes;

		// Make the request
		$.ajax({
			url : 'http://api.soundcloud.com/users/' + data.uid + '/favorites.json?client_id=' + data.key + '&limit=' + data.limit + '&offset=' + data.offset,
		})
		.done(function(result) {

			var offset = data.offset + data.limit;

			// Add each like to the object
			for (var i = result.length - 1; i >= 0; i--) {
				var like = result[i];
				likes.push(like);
			};

			// Loop again if there are still likes
			if ( result.length == data.limit ) {
				data.offset = offset;
				app.api.getLikes();
			} else {
				if ( likes.length > 0 ) {
					$(document).trigger('likesReady');
				} else {
					alert('none');
					$('html').removeAttr('data-loading');
				}
			}

		});

	},

	getRandomLike : function() {
		var like = app.api.likes[Math.floor(Math.random() * app.api.likes.length)];
		return like;
	},

	reset : function() {

		this.user     = { };
		this.likes    = [ ];
		this.listened = [ ];

		$('html').attr('data-loading', '');

	},

	setup : function() {

		// Init
		this.getUser();

		// Chain
		$(document).on('userReady', this.getLikes);

	}

};

/**
 * Interface
 */
app.sound = {

	$embed : '',
	player : '',

	allofem : function() {
		for (var i = app.api.likes.length - 1; i >= 0; i--) {
			console.log(i, app.api.likes[i].title);
		};
	},

	makeRandom : function() {

		var like    = app.api.getRandomLike();
		var user    = app.api.user;
		var artwork = like.artwork_url || like.user.avatar_url;

		// Loading
		$('html').attr('data-loading', '');

		// Load the new sound
		app.sound.player.load(like.permalink_url);

		// Play the sound
		app.sound.player.bind(SC.Widget.Events.READY, function() {

			app.sound.player.play();
			app.sound.player.setVolume(100);

			// Update the interface
			$('html').removeAttr('data-loading');
			$('#stream .currently').html('<a href="' + user.permalink_url + '" target="_blank">' + user.username + '</a>');
			$('#artist .currently').html('<a href="' + like.user.permalink_url + '" target="_blank">' + like.user.username + '</a>');
			$('#track .currently').html('<a href="' + like.permalink_url + '" target="_blank">' + like.title + '</a>');
			$('#artwork').css('background-image', 'url(' + artwork + ')');

		});

		// Update the data
		app.api.current = like;

	},

	play : function() {
		alert('play');
	},

	pause : function() {
		alert('pause');
	},

	toggle : function() {
		app.sound.player.toggle();
	},

	interface : function() {

		$('#refresh').click(function() {
			app.sound.makeRandom();
		}).click();

		$('#playpause').click(function() {
			app.sound.toggle();
		});

		$("#switch").click(function() {
			app.api.data.uid = app.api.current.user.id;
			app.api.reset();
			app.api.getUser();
		});

	},

	setup : function() {

		// Cache
		app.sound.$embed = $('iframe');
		app.sound.player = SC.Widget(app.sound.$embed[0]);

	    app.sound.player.bind(SC.Widget.Events.FINISH, function() {
	        app.sound.makeRandom();
	    });

	    app.sound.player.bind(SC.Widget.Events.PLAY, function() {
	        app.sound.play();
	    });

	    app.sound.player.bind(SC.Widget.Events.PAUSE, function() {
	        app.sound.pause();
	    });

		// Setup the interface
		$(document).on('likesReady', this.interface);

	}

};

app.resize = {

	$el : {

	},

	setCache : function() {
		this.$el.window = $(window);
		this.$el.navigation = $('#navigation');
		this.$el.drop_link = $('.drop_link');

	},

	setFontSize : function() {

		var winWidth = this.$el.window.width();
		var fontSize = Math.floor(winWidth / 40);

		if ( fontSize < 18 ) {
			fontSize = 18;
		} else if ( fontSize > 40 ) {
			fontSize = 40;
		}

		// Font size
		vein.inject('body, #navigation input', {
			'font-size' : fontSize + 'px'
		});

	},

	setNavPad : function() {

		var height  = this.getPercentage(0.05);

		vein.inject('#toolbar > div', {
			'height'  : height + 'px',
			'width'   : height + 'px'
		});

	},

	getPercentage : function(percent) {
		return Math.floor(this.$el.window.width() * percent);
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

// Initialize modules
$(function() {
	for (var key in app) {
		if ( app[key].setup !== undefined ) {
			app[key].setup();
		}
	}
});