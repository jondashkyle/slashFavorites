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
				$(document).trigger('likesReady');
			}

		});

	},

	getRandomLike : function() {
		var like = app.api.likes[Math.floor(Math.random() * app.api.likes.length)];
		return like;
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
			$('#favorite .currently').html('<a href="' + user.permalink_url + '" target="_blank">' + user.username + '</a>');
			$('#artist .currently').html('<a href="' + like.user.permalink_url + '" target="_blank">' + like.user.username + '</a>');
			$('#track .currently').html('<a href="' + like.permalink_url + '" target="_blank">' + like.title + '</a>');

		});

		// console.log(like);

	},

	interface : function() {

		$('#refresh').click(function() {
			app.sound.makeRandom();
		}).click();

	},

	setup : function() {

		// Cache
		app.sound.$embed = $('iframe');
		app.sound.player = SC.Widget(app.sound.$embed[0]);

		// Bind events to the player
		app.sound.player.bind(SC.Widget.Events.READY, function() {

			app.sound.player.play();
			app.sound.player.setVolume(100);

			app.sound.player.bind(SC.Widget.Events.FINISH, function() {
		        app.sound.makeRandom();
		    });

	    });

		// Setup the interface
		$(document).on('likesReady', this.interface);

	}

};

app.typography = {

	setFontSize : function() {

		var fontSize = Math.floor($(window).width() / 25);

		if ( fontSize < 8 ) {
			fontSize = 8;
		} else if ( fontSize > 40 ) {
			fontSize = 40;
		}

		$('body, #active_stream input').css({
	    	'font-size' : fontSize + 'px'
	    });

	},

	setup : function() {
		$(window).on('resize', this.setFontSize).resize();
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