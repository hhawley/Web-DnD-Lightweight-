var socketio = require('socket.io');
var io;

var set = function(http) {
	io = socketio(http);
}

var logic = function(app, pool) {

	// Parte de conexion servidor-cliente
	io.on('connection', function(socket){

		socket.on('sendData', function(data){
			console.log(data);

			pool.query('INSERT INTO test_table VALUES (' + data.name + ',' + data.number + ');');
		});

	});
}

exports.set = set;
exports.logic = logic;