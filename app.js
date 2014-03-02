// Namespace
var app = app || { };

var test;

/**
 * Core contains the essentials
 */
app.core = {

	data : {
		limit : 50
	},

	setup : function() {

		this.soundcloud();
		this.soundmanager();
		this.startStream();

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

			defaultOptions: {
			    // set global default volume for all sound objects
			    // volume: 0
			}
		});
	},

	startStream : function() {

		test = app.stream({

			'uid'  : 2614244,
			'limit': this.data.limit,

			trackReady : function() {
				app.core.updateInterface(test.data);
				app.loading.hide();
			},
			trackFinish : function() {
				app.loading.show();
				test.playRandomTrack();
			}

		});

		test.setup();

		$('#refresh').on('click', function() {
			app.loading.show();
			test.playRandomTrack();
		});

	},

	updateInterface : function(data) {

		var user  = data.activeUser;
		var track = data.activeTrack;

		var artwork = track.artwork_url || track.user.avatar_url;
		
		$('#stream .currently').html('<a href="' + user.permalink_url + '" target="_blank">' + user.username + '</a>');
		$('#artist .currently').html('<a href="' + track.user.permalink_url + '" target="_blank">' + track.user.username + '</a>');
		$('#track .currently').html('<a href="' + track.permalink_url + '" target="_blank">' + track.title + '</a>');
		$('#artwork').css('background-image', 'url(' + artwork + ')');

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

		this.loop = setInterval(function() {
			self.randomCharacter();
		}, 50);

	},

	hide : function() {
		$('html').removeAttr('data-loading');
		clearInterval(this.loop);
	},

	setup : function() {
		this.$el = $('#loading');
		this.show();
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

		var height = this.getPercentage(0.05);
		var width  = this.getPercentage(0.7);
		var line   = this.getPercentage(0.002);

		if ( line < 1 ) {
			line = 1;
		}

		vein.inject('.currently', {
			'max-width' : width + 'px'
		});

		vein.inject('#toolbar > div', {
			'height'  : height + 'px',
			'width'   : height + 'px'
		});

		vein.inject('.option_line', {
			'margin-left'   : line * 4 + 'px',
			'height'        : line + 'px',
			'border-radius' : line / 2 + 'px'
		});

		$('.section').each(function() {
			var offset = $(this).find('.options .title').width();
			$(this).find('.option_line').css('left', offset);
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