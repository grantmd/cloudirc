var localStore = {
	supported: function(handler) {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		}
		catch(e) {
			return false;
		}
	},
	setup: function(handler) {
		if (!localStorage.prefs) localStore.resetPrefs();
		if (!localStorage.channels) localStore.resetChannels();

		if (handler) handler();
	},
	resetPrefs: function(handler) {
		localStorage.prefs = JSON.stringify({});

		if (handler) handler();
	},
	resetChannels: function(handler) {
		localStorage.channels = JSON.stringify({});

		if (handler) handler();
	},

	setPref: function(prefName, prefValue, handler) {
		var prefs = JSON.parse(localStorage.prefs);

		prefs[prefName] = prefValue;
		localStorage.prefs = JSON.stringify(prefs);

		if (handler) handler();
	},
	getPref: function(prefName, handler) {
		var prefs = JSON.parse(localStorage.prefs);
		
		handler(prefs[prefName]);
	},
	getAllPrefs: function(handler) {
		var prefs = JSON.parse(localStorage.prefs);
		
		handler(prefs);
	},
	countPrefs: function(handler) {
		var prefs = JSON.parse(localStorage.prefs);

		var size = 0, key;
		for (key in prefs){
			if (prefs.hasOwnProperty(key)) size++;
		}

		handler(size);
	},

	addChannel: function(channelName, channelType, handler) {
		var channels = JSON.parse(localStorage.channels);

		channels[channelName] = channelType;
		localStorage.channels = JSON.stringify(channels);

		if (handler) handler();
	},
	removeChannel: function(channelName, handler) {
		var channels = JSON.parse(localStorage.channels);

		delete channels[channelName];
		localStorage.channels = JSON.stringify(channels);

		if (handler) handler();
	},
	getAllChannels: function(handler) {
		var channels = JSON.parse(localStorage.channels);
		
		handler(channels);
	},
	countChannels: function(handler) {
		var channels = JSON.parse(localStorage.channels);

		var size = 0, key;
		for (key in channels){
			if (channels.hasOwnProperty(key)) size++;
		}

		handler(size);
	}
};