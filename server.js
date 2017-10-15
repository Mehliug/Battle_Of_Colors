const spawn = require('threads').spawn;
const thread = spawn(function(input, done){
	console.log("serveur en attente port 3000");
	ServeMe = require('serve-me')();
	ServeMe.start(3000);
});

thread.send();

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

console.log("Server lancé ...");

wss.on('connection', function connection(ws) {
	console.log("connection OK !");

  	ws.on('message', function incoming(data) {
    	wss.clients.forEach(function each(client) {
      		if (client !== ws && client.readyState === WebSocket.OPEN)
      			client.send(data);
    	});
	});
});