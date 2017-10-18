var SpaceGame = SpaceGame || {};

SpaceGame.PreloadGame = function(){};

var MapName = '';
SpaceGame.PreloadGame.prototype = {
	init: function(isHost, mapName) {
		MapName = this.mapName = mapName;
		
	},

	preload: function() {

		var MapDir = 'Content\/';
		this.load.tilemap(this.mapName, MapDir + this.mapName + '.json', null, Phaser.Tilemap.TILED_JSON);
		this.load.json(this.mapName, MapDir + this.mapName + '.json');
		this.load.onLoadComplete.add(loadSendMap);
			
	},

	create: function() {},
};

function loadSendMap() {

	var jsonMap = SpaceGame.game.cache.getJSON(MapName);

	var floorLayerData = {};
	var effectLayerData = {};
	var collisionLayerData = {};
	var error = false;
	if(jsonMap.layers[0].name === "floorLayer") {

	 	floorLayerData = jsonMap.layers[0].data;

	 	if(jsonMap.layers[1].name === "effectLayer") {

	 		effectLayerData = jsonMap.layers[1].data;
	 		collisionLayerData = jsonMap.layers[2].data;

	 	} else if(jsonMap.layers[1].name === "collisionLayer") {

	 		collisionLayerData = jsonMap.layers[1].data;
	 		effectLayerData = jsonMap.layers[2].data;

	 	} else error = true;

	} else if(jsonMap.layers[0].name === "effectLayer") {

		effectLayerData = jsonMap.layers[0].data;

		if(jsonMap.layers[1].name === "floorLayer") {

	 		floorLayerData = jsonMap.layers[1].data;
	 		collisionLayerData = jsonMap.layers[2].data;

	 	} else if(jsonMap.layers[1].name === "collisionLayer") {

	 		collisionLayerData = jsonMap.layers[1].data;
	 		floorLayerData = jsonMap.layers[2].data;

	 	} else error = true;


	}
	else if(jsonMap.layers[0].name === "collisionLayer") {

	    collisionLayerData = jsonMap.layers[0].data;

	    if(jsonMap.layers[1].name === "floorLayer") {

	 		floorLayerData = jsonMap.layers[1].data;
	 		effectLayerData = jsonMap.layers[2].data;

	 	} else if(jsonMap.layers[1].name === "effectLayer") {

	 		effectLayerData = jsonMap.layers[1].data;
	 		floorLayerData = jsonMap.layers[2].data;

	 	} else error = true;

	} else error = true;

	var width = jsonMap.layers[0].width;
	var height = jsonMap.layers[0].height;

	if(error) {
		SpaceGame.game.state.start('ErrorState', true, false, "Error with map format. Check if format is correct");
	}

	floorLayerData = new Uint8Array(floorLayerData);
	effectLayerData = new Uint8Array(effectLayerData);
	collisionLayerData = new Uint8Array(collisionLayerData);

	var b64encFLD = Uint8ToBase64(floorLayerData);
	var b64encELD = Uint8ToBase64(effectLayerData);
	var b64encCLD = Uint8ToBase64(collisionLayerData);

	socket.emit('mapDataUpload', 
	{
		Width: width,
		Height: height,
		FloorLayerData: b64encFLD,
		CollisionLayerData: b64encELD,
		EffectLayerData: b64encCLD

	}, doneUploading);
}

function doneDownloading(data) {

	//Little hack to add the data read.
	try {
		var jsonMap = SpaceGame.game.cache.getJSON('base');

		jsonMap.layers.forEach(function(layer) {

			layer.width = data.Width;
			layer.height = data.Height;

		});

		var FDL = Base64ToUint8(data.FloorLayerData);
		var EDL = Base64ToUint8(data.EffectLayerData);
		var CDL = Base64ToUint8(data.CollisionLayerData);

		jsonMap.layers[0].data = FDL;
		jsonMap.layers[1].data = EDL;
		jsonMap.layers[2].data = CDL;

		SpaceGame.game.load.tilemap('currentMap', null, jsonMap, Phaser.Tilemap.TILED_JSON);
		SpaceGame.game.state.start('Game', true, false, false, 'currentMap');
	} catch(err) {

		SpaceGame.game.state.start('ErrorState', true, false, "Error with downloaded map data.\n" + err.message);

	}
	//TODO: could be improved. I could see potencial bugs here
}

function doneUploading(ack){

	if(ack) SpaceGame.game.state.start('Game', true, false, ack, MapName);
	else SpaceGame.game.state.start('ErrorState', true, false, "This shouldn't happen. Probably server error?");

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