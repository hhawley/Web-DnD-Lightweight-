var socket = require('socket.io');
var io = {};

exports.set = set;
exports.startListening = startListening;

function set(http) {

	io = socket(http);

}

var clientPlayers = {};
var clients = {};
var hosts = {};

var maps = {};
var players = {};

var logDir = './log.txt';

function log(msg, type) {

	if(type == undefined) {

		console.log("[Unknown message]: " + msg);
		fs.writeFile(logDir, "[Unknown message]: " + msg);

	} else if(type == 'l') {

		console.log("[LOG]: " + msg);
		fs.writeFile(logDir, "[LOG]: " + msg);

	} else if(type == 'e') {

		console.error("[ERROR]: " + msg);
		fs.writeFile(logDir, "[ERROR]: " + msg);

	} else if(type == 'w') {

		console.warn("[WARNING]: " +  msg);
		fs.writeFile(logDir, "[WARNING]: " +  msg);

	}


}

function sendErrr(msg, socket, room) {

	try {

		if(room != undefined) socket = socket.to(room);
		socket.emit('errorMsg', { msg: msg });

	} catch (ex) {

		log(ex, 'e');

	}

}

function socketsInRoom(room) {
        if (io == undefined) {
            log("io is undefined :\\", 'e');
        }

        if (io.nsps["/"] == undefined) {
            log("/ Namespace is undefined :\\", 'e');
        }

        if (io.nsps["/"].adapter == undefined) {
            log("Adapter is undefined :\\", 'e');
        }

        if (io.nsps["/"].adapter.rooms == undefined) {
            log("Rooms is undefined :\\", 'e');
        }

        var r = io.nsps["/"].adapter.rooms[room];
        if (typeof r === 'object') {
            return Object.keys(r);
        }
        else return [];
        
}

function getSocketsIdInRoom(room) {

	if (io == undefined) {
            log("io is undefined :\\", 'e');
        }

        if (io.nsps["/"] == undefined) {
            log("/ Namespace is undefined :\\", 'e');
        }

        if (io.nsps["/"].adapter == undefined) {
            log("Adapter is undefined :\\", 'e');
        }

        if (io.nsps["/"].adapter.rooms == undefined) {
            log("Rooms is undefined :\\", 'e');
        }

        var r = io.sockets.adapter.rooms[room];
        if (typeof r === 'object') {
            return r;
        }
        else return [];

}

function btoa(data) {

	return new Buffer(data).toString('base64');

}

function atob(data) {

	return new Buffer(data, 'base64').toString('binary');

}

//http://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string
function Uint8ToBase64(u8Arr){
	var CHUNK_SIZE = 0x8000; //arbitrary number
	var index = 0;
	var length = u8Arr.length;
	var result = '';
	var slice;
	while (index < length) {
		slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length)); 
		result += String.fromCharCode.apply(null, slice);
		index += CHUNK_SIZE;
	}
	return btoa(result);
}

function Base64ToUint8(base64) {

	return new Uint8Array(atob(base64).split("").map(function(c) {

			return c.charCodeAt(0);

	}));

}

function startListening() {
	io.on('connection', function(socket){
		console.log('User connected');
		
		socket.on('disconnect', function(){

			console.log('User disconnected');

			delete clientPlayers[socket.id];
			delete players[socket.id];

			var room = clients[socket.id];
			if(hosts[socket.id]) {
				
				var users = getSocketsIdInRoom(room);

				for(var user in users) {

					io.sockets.connected[user].disconnect();

				}

				delete hosts[socket.id];
				delete maps[room];

			} else {

				socket.broadcast.to(room).emit('playerDisconnected', { Id: socket.id });

			}

			delete clients[socket.id];


		});

		socket.on('host', function(data, ack) {

			var clientIP = socket.request.connection.remoteAddress;

			socket.join(clientIP, function(err) {

				if(!err) {

					clientPlayers[socket.id] = 0;
					clients[socket.id] = clientIP;
					hosts[socket.id] = true;
					players[socket.id] = { x: 0, y: 0 };

					log('New Host, ' + socket.id + ", on new game IP: " + clientIP, 'l');
					ack(true);
					//socket.emit('gameCreated', 0);

				} else {

					log(err, 'e');

				}

			});

		});

		socket.on('join', function(data, ack) {

			var game = data.gameID;
			if(io.nsps["/"].adapter.rooms[game] != undefined) {

				socket.join(game, function(err) {

					if(!err) {

						clients[socket.id] = game;
						var players = socketsInRoom(game);
						clientPlayers[socket.id] = players.length - 1;
						players[socket.id] = { x: 0, y: 0 };

						//ack({ playersCount: players.length });
						log('New player: ' + socket.id + " on " + game, 'l');
						socket.broadcast.to(game).emit('joined', 
						{ 
							socketId: socket.id 
						});

						ack(false);

					} else {

						log(err, 'e');
						sendErrr("Can't join room", socket);

					}


				});

			} else {

				log("Someone tried to join a room that doesn't exists", 'w');
				sendErrr("That room doesn't exist", socket);

			}

		});

		socket.on('mapDataUpload', function(data, ack) {

			var game = clients[socket.id];

			//Data comes encoded as base64 to compact and save data traffic
			var FLD = Base64ToUint8(data.FloorLayerData);
			var ELD = Base64ToUint8(data.EffectLayerData);
			var CLD = Base64ToUint8(data.CollisionLayerData);

			//We save it normally as an array because later it is easier to just change a tile
			//otherwise changing a tile in the map would require more work.
			maps[game] = {
				Width: data.Width,
				Height: data.Height,
				FloorLayerData: FLD,
				CollisionLayerData: ELD,
				EffectLayerData: CLD
			};

			ack(true);

		});

		socket.on('downloadMapData', function(ack) {

			var game = clients[socket.id];
			var map = maps[game];

			var b64encMap = {

				Width: map.Width,
				Height: map.Height,
				FloorLayerData: Uint8ToBase64(map.FloorLayerData),
				CollisionLayerData: Uint8ToBase64(map.CollisionLayerData),
				EffectLayerData: Uint8ToBase64(map.EffectLayerData)

			};

			ack(b64encMap);


		});

		socket.on('retrievePlayers', function(ack) {

			var game = clients[socket.id];
			var playersSockets = getSocketsIdInRoom(game);

			var playersToSend = [];
			for(var id in playersSockets) {
				if(id !== socket.id) {
					playersToSend.push({
						Id: id,
						X: players[id].x,
						Y: players[id].y
						//Todo: add icon name
					});
				}

			}

			ack(playersToSend);

		});

		socket.on('updatePosition', function(data) {

			var game = clients[socket.id];
			data.socketId = socket.id;
			players[socket.id] = { x: data.X, y: data.Y };
			socket.broadcast.to(game).emit('gameUpdatePosition', data);

		});

		socket.on('updateMap', function(data) {

			var game = clients[socket.id];
			//TODO: add new tile in map
			io.in(game).emit('gameMapUpdate', data);

		});

	});
}
