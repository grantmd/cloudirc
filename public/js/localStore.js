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
		if (!localStorage.prefs) localStore.reset();

		if (handler) handler();
	},
	reset: function(handler) {
		localStorage.prefs = JSON.stringify({});

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
	}
};