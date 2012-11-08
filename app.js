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
				password: prefs['serverPassword'],

				channels: ['#cloudirc']
			});

			client.addListener('error', function(message){
				console.log('error: ', message);
			});

			client.addListener('connect', function(){
				console.log("Connected to IRC");
				socket.emit('connected');
			});
		}
	});

	socket.on('disconnect', function(){
		if (client) client.disconnect("Goodbye"); // Obviously, in the future, we should persist this
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