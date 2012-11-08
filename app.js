var express = require('express');
var app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);

var port = 8080;
server.listen(port);
console.log('Listening on port '+port);

// Serve static files out of public
app.use(express.static('public'));

// Serve our home page
app.get('/', function(req, res){
	res.sendfile(__dirname + '/index.html');
});

// Accept websocket connections
io.sockets.on('connection', function(socket){
	socket.on('set_prefs', function(prefs){
		console.log(prefs);

		socket.emit('connected');
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