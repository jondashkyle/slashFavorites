(function(){
	var location = window.location;
		location = location.toString();

	if ( location.indexOf('soundcloud.com') > 0 ) {

		location = location.replace('http://soundcloud.com/', '');
		location = location.replace('https://soundcloud.com/', '');
		location = location.replace('www.soundcloud.com/', '');
		location = location.replace('soundcloud.com/', '');
		location = location.split('/')[0];

		if ( location == 'stream' ) {
			alert('Only works on artist pages, not the stream!')
		} else {
			window.open('http://localhost:8000/#' + location);
		}

	} else {
		alert('This only functions on Soundcloud artist pages ;)');
	}

})();