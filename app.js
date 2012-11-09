var express = require('express');
var app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	irc = require('irc');

var client;

var port = 8080;
server.listen(port);
console.log('Listening on port '+port);

// Serve static files out of public
app.use(express.static('public'));

// Serve our home page
app.get('/', function(req, res){
	res.sendfile(__dirname + '/index.html');
});

// NODE_ENV=production node app.js
io.configure('production', function(){
	io.enable('browser client minification');  // send minified client
	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.enable('browser client gzip');          // gzip the file
	io.set('log level', 1);                    // reduce logging
	io.set('transports', [                     // enable all transports (optional if you want flashsocket)
		'websocket',
		'flashsocket',
		'htmlfile',
		'xhr-polling',
		'jsonp-polling'
	]);
});

// Accept websocket connections
io.sockets.on('connection', function(socket){
	socket.on('set_prefs', function(prefs){
		if (client){
			if (client.opt.server != prefs['hostname'] || client.opt.port != prefs['port'] || client.opt.password != prefs['serverPassword']){
				client.disconnect("Goodbye");

				client.opt.server = prefs['hostname'];
				client.opt.port = prefs['port'];
				client.opt.password = prefs['serverPassword'];

				client.opt.nick = prefs['nickname'];
				client.opt.realName = prefs['name'];

				client.connect();
			}
			else{
				if (client.opt.nick != prefs['nickname']) client.send("NICK", prefs['nickname']);

				// TODO: handle changing real name somehow?

				socket.emit('connected');
			}
		}
		else{
			client = new irc.Client(prefs['hostname'], prefs['nickname'], {
				userName: 'cloudirc',
				debug: true,

				port: prefs['port'],
				realName: prefs['name'],
				password: prefs['serverPassword']
			});

			// Listeners for events. Mostly we tell the socket about them
			client.addListener('error', function(message){
				console.log('error: ', message);
				socket.emit('error', message); // TODO: does this stomp on anything? should be irc_error?
			});

			client.addListener('connect', function(){
				console.log("Connected to IRC");
				socket.emit('connected');
			});

			client.addListener('registered', function(message){
				socket.emit('registered', message);
			});

			client.addListener('ping', function(message){
				socket.emit('ping', message);
			});

			client.addListener('notice', function(from, to, text, message){
				socket.emit('notice', {
					from: from,
					to: to,
					text: text,
					message: message
				});
			});

			client.addListener('+mode', function(who, nick, mode, user, message){
				socket.emit('+mode', {
					who: who, // TODO: What is this, really?
					nick: nick,
					mode: mode,
					user: user,
					message: message
				});
			});
			client.addListener('-mode', function(who, nick, mode, user, message){
				socket.emit('-mode', {
					who: who, // TODO: What is this, really?
					nick: nick,
					mode: mode,
					user: user,
					message: message
				});
			});

			client.addListener('nick', function(old_nick, new_nick, channels){
				socket.emit('nick', {
					old_nick: old_nick,
					new_nick: new_nick,
					channels: channels
				});
			});

			client.addListener('motd', function(motd){
				socket.emit('motd', motd);
			});

			client.addListener('topic', function(channel, topic, nick){
				socket.emit('topic', {
					channel: channel,
					topic: topic,
					nick: nick
				});
			});

			client.addListener('join', function(channel, nick, message){
				socket.emit('join', {
					channel: channel,
					nick: nick,
					message: message
				});
			});

			client.addListener('part', function(channel, nick, message){
				socket.emit('part', {
					channel: channel,
					nick: nick,
					message: message
				});
			});

			client.addListener('kick', function(channel, nick, by, message){
				socket.emit('kick', {
					channel: channel,
					nick: nick,
					by: by,
					message: message
				});
			});

			client.addListener('kill', function(nick, by, channels, message){
				socket.emit('kill', {
					nick: nick,
					by: by, // TODO: confirm this. Is message.args[1] in the docs
					channels: channels,
					message: message
				});
			});

			client.addListener('message', function(from, to, text, message){
				// If this is to us, discard, since 'pm' event below is also thrown
				if (to == client.opt.nick) return;

				socket.emit('message', {
					from: from,
					to: to,
					text: text,
					message: message
				});
			});

			client.addListener('pm', function(from, text, message){
				socket.emit('pm', {
					from: from,
					text: text,
					message: message
				});
			});

			client.addListener('invite', function(channel, from, message){
				socket.emit('invite', {
					channel: channel,
					from: from,
					message: message
				});
			});

			client.addListener('quit', function(who, reason, channels){
				socket.emit('quit', {
					who: who,
					reason: reason,
					channels: channels
				});
			});
		}
	});

	socket.on('chat', function(message){
		console.log('chat (in '+message.channel+'): '+message.message);
		if (client){
			var channel_split = message.channel.split("-", 2);
			var type, channel;
			if (channel_split[0] == 'channel'){
				type = 'channel';
				channel = '#'+channel_split[1];
			}
			else{
				type = channel_split[0];
				channel = channel_split[1];
			}

			if (message.message.substr(0, 1) == '/'){
				var words = message.message.split(" ");
				if (words[0] == '/join'){
					client.join(words[1], function(){
						socket.emit('channel_joined', words[1]);
					});
				}
				else if (words[0] == '/me'){
					client.action(channel, message.message.replace("/me "));
				}
				else{
					console.log("Unknown command: "+words[0]);
				}
			}
			else if (type != 'host'){
				client.say(channel, message.message);
			}
		}
	});

	socket.on('disconnect', function(){
		//if (client) client.disconnect("Goodbye"); // Obviously, in the future, we should persist this
	});
});

// 404 -- must come after all other routes
app.use(function(req, res, next){
	res.send(404, 'Sorry cant find that!');
});

// error handling
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});