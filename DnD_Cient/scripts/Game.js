var SpaceGame = SpaceGame || {};

SpaceGame.Game = function(){};

SpaceGame.Game.prototype = {
	init: function(ishost, mapName) {

		this.isHost = ishost;
		this.mapName = mapName;
		this.editMap = false;
		this.hideMap = false;
		this.currentLayerID = 1;

	},

	preload: function(){},

	create: function() {	

		/// Map area ///
		/*
			A map is created with various layers for the game:

			* Floor layer. Description: basic map layer where the DND map is draw. Only editable by GM. 
			* Effect layer. Description: effect layer to shown attack AoE. Editable by everyone.
			* [OUTDATED]Shadow layer. Description: layer that hides NPCs, traps, etc. Editable only by GM.
			* Collision Layer: Physics collision and vision.

		*/

		this.map = this.game.add.tilemap(this.mapName);
		this.map.addTilesetImage('base', 'placeholderIMG');

		// ID : 0 //
		this.floorLayer = this.map.createLayer('floorLayer');

		// ID :  1 //
		this.effectLayer = this.map.createLayer('effectLayer');
		this.effectLayer.index = 1;

		// ID : 3 //
		this.collisionLayer = this.map.createLayer('collisionLayer');
		this.map.setCollisionBetween(1, 36, true, 'collisionLayer');
		this.collisionLayer.visible = true;

		// ID : 2 //
		this.enemyNPCs = this.game.add.group();
		this.enemyNPCs.z = 2;

		this.floorLayer.resizeWorld();


		/// Controls area ///
		/*
			Area where the controls are set with which buttons.
			Button:
			* Q (QM only): Hides all GM editable layers. 
			* E : Disables editing.
			* 1 (QM only): Edit floor layer.
			* 2 : Edit effect layer.
			* 3 (QM only): Edits enemies (WIP)
			* 4 (QM only): Edits collision layer.
		*/

		this.cursors = this.game.input.keyboard.createCursorKeys();
		this.game.input.addMoveCallback(this.updateMarker, this);

		if(this.isHost) {

			hideLayerKey = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
			floorLayerKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ONE);
			effectLayerKey = this.game.input.keyboard.addKey(Phaser.Keyboard.TWO);
			collisionLayerKey = this.game.input.keyboard.addKey(Phaser.Keyboard.THREE);
			npcLayerKey = this.game.input.keyboard.addKey(Phaser.Keyboard.FOUR);
			turnOffEditingKey = this.game.input.keyboard.addKey(Phaser.Keyboard.E);

			hideLayerKey.onDown.add(this.changeLayer, this);
			floorLayerKey.onDown.add(this.changeLayer, this);
			effectLayerKey.onDown.add(this.changeLayer, this);
			collisionLayerKey.onDown.add(this.changeLayer, this);
			npcLayerKey.onDown.add(this.changeLayer, this);
			turnOffEditingKey.onDown.add(this.changeLayer, this);

		} else {

			effectLayerKey = this.game.input.keyboard.addKey(Phaser.Keyboard.TWO);
			turnOffEditingKey = this.game.input.keyboard.addKey(Phaser.Keyboard.E);

			effectLayerKey.onDown.add(this.changeLayer, this);
			turnOffEditingKey.onDown.add(this.changeLayer, this);

		}

		/// Other players area ///

		this.totalPlayers = 0;
		this.players = {};
		this.otherPlayers = this.game.add.group();

		
		/// Player area ///
		/*
			Player icon within the map. Is drawn above everything. It is possible to drag it and it snaps to the grid.
		*/

		this.Player = this.game.add.sprite(this.game.world.width / 2, this.game.world.height / 2, 'placeholderSS');
		this.game.physics.arcade.enable(this.Player);
		this.Player.checkWorldBounds = true;
		this.Player.inputEnabled = true;
		this.Player.input.enableDrag(true);
		this.Player.input.enableSnap(32, 32);
		this.Player.events.onDragStop.add(this.updatePosition, this);


		/// Tiles selector area ///
		this.tileSelector = this.game.add.group();

		var tileSelectorBackground = this.game.make.graphics();
		tileSelectorBackground.beginFill(0x0000000, 0.5);
		tileSelectorBackground.drawRect(0, 0, 513, 34);
		tileSelectorBackground.endFill();

		this.tileSelector.add(tileSelectorBackground);


		this.tileStrip = this.tileSelector.create(33, 1, 'placeholderSS01', 0);
		this.tileStrip.inputEnabled = true;
		this.tileStrip.events.onInputDown.add(this.pickTile, this);

		this.tileSelector.fixedToCamera = true;

		/// Marker area ///
		this.marker = this.game.add.graphics();
		this.marker.lineStyle(2, 0xffffff, 1);
		this.marker.drawRect(0, 0, 32, 32);

		/// Shadow Mask and Lines area //
		this.shadowLayerLines = [];
		this.VISION = 6 * 32;
		this.MAXLINES = 32;

		var theta = 0;
		for(var i = 0; i <= this.MAXLINES; i++) {

			this.shadowLayerLines[i] = new Phaser.Line();
		}

		this.shadowMask = this.game.add.graphics(0, 0);
		this.shadowMask.beginFill(0xffffff);

		this.shadowMaskPolygon = new Phaser.Polygon();
		this.calculateShadowMask(this.Player);

		this.shadowMask.drawPolygon(this.shadowMaskPolygon);
		this.floorLayer.mask = this.shadowMask;
		this.otherPlayers.mask = this.shadowMask;
		this.shadowMask.endFill();

		/// Socket area ///
		/*
			Client side socket.io events.
		*/

		var socketGame = this;
		//Maps changes when the server says so.
		socket.on('gameMapUpdate', function(data) {

			

			switch(data.layerID) {

				case 0:
					socketGame.map.putTile(data.tileIndex, data.X, data.Y, socketGame.floorLayer);
					break;

				case 1:
					socketGame.map.putTile(data.tileIndex, data.X, data.Y, socketGame.effectLayer);
					break;

				case 3:
					
					break;

				case 2:
					socketGame.map.putTile(data.tileIndex, data.X, data.Y, socketGame.collisionLayer);
					break;
			}
		});

		socket.on('joined', function(data) {

			socketGame.totalPlayers++;
			var player = socketGame.otherPlayers.create(0, 0, 'placeholderSS');
			socketGame.players[data.socketId] = player;

		});

		socket.on('gameUpdatePosition', function(data) {

			socketGame.players[data.socketId].x = data.X;
			socketGame.players[data.socketId].y = data.Y;

		});

		socket.on('disconnect', function() {

			socketGame.game.state.start('ErrorState', true, false, "Disconnected from server.")

		});

		socket.on('playerDisconnected', function(data) {

			delete socketGame.players[data.Id];

		});

		if(!this.isHost) socket.emit('retrievePlayers', function(data) {

			var i = 0;
			for(i = 0; i < data.length; i++) {

				socketGame.totalPlayers++;
				var player = socketGame.otherPlayers.create(data[i].X, data[i].X, 'placeholderSS');
				socketGame.players[data[i].Id] = player;

			}

		});

	},

	update: function() {

		if (this.cursors.left.isDown)
	    {
	        this.game.camera.x -= 4;
	    }
	    else if (this.cursors.right.isDown)
	    {
	        this.game.camera.x += 4;
	    }

	    if (this.cursors.up.isDown)
	    {
	        this.game.camera.y -= 4;
	    }
	    else if (this.cursors.down.isDown)
	    {
	        this.game.camera.y += 4;
	    }

	},

	/// Description: changes marker location and if a click happens sends to the server the command to change the map.
	updateMarker: function() {

		this.marker.x = this.effectLayer.getTileX(this.game.input.activePointer.worldX) * 32;
		this.marker.y = this.effectLayer.getTileY(this.game.input.activePointer.worldY) * 32;

		if(this.game.input.mousePointer.isDown) {

			if(this.editMap)
				socket.emit('updateMap', 
				{
					tileIndex: this.currentTile,
					X: this.effectLayer.getTileX(this.marker.x),
					Y: this.effectLayer.getTileY(this.marker.y),
					layerID: this.currentLayerID
				});
		}

		
	},

	/// Description: changes editing layer and also manages all keyboard input.
	changeLayer: function(key) {

		if(this.isHost) {

			switch(key.keyCode) {

				case Phaser.Keyboard.Q:
					//TODO: Fix key, it does not work.
					if(this.effectLayer.alpha == 0.2) this.effectLayer.alpha = 1;
					else this.effectLayer.alpha = 0.2;

					if(this.collisionLayer.visible) this.collisionLayer.visible = false;
					else this.collisionLayer.visible = true;

					if(this.floorLayer.mask === null) this.calculateShadowMask(this.Player);
					else this.resetMask(null);

					break;

				case Phaser.Keyboard.ONE:

					this.currentLayerID = this.floorLayer.index;
					this.editMap =  true;

					break;

				case Phaser.Keyboard.TWO:

					this.currentLayerID = this.effectLayer.index;
					this.editMap = true;

					break;

				case Phaser.Keyboard.THREE:

					this.currentLayerID = 3;
					this.editMap = true;

					break;

				case Phaser.Keyboard.FOUR:

					this.currentLayerID = this.collisionLayer.index;
					this.editMap = true;

					break;

				case Phaser.Keyboard.E:

					this.editMap = false;

					break;
			}

		} else {

			switch(key.keyCode) {
				case Phaser.Keyboard.TWO:

					this.currentLayerID = this.effectLayer.index;
					this.editMap = true;

					break;

				case Phaser.Keyboard.E:

					this.editMap = false;

					break;
			}


		}

	},

	/// Description: Tile selector function.
	pickTile: function(sprite, pointer) {

		this.currentTile = this.game.math.snapToFloor(pointer.x - 32, 32) / 32;

	},

	updatePosition: function(sprite) {

		socket.emit('updatePosition', 
		{
			socketId: 5,
		 	X: sprite.x, 
		 	Y: sprite.y
		});

		this.calculateShadowMask(sprite);

	},

	calculateShadowMask: function(sprite) {

		var polyMaskPoints = [];
		var collLayer = this.collisionLayer;
		var tgame = this.game;
		var player = this.Player;

		//We also update shadowLayerLines
		var theta = 0;
		var spritePos = { x: sprite.x + (sprite.width / 2), y: sprite.y + (sprite.height / 2) };
		for(var i = 0; i <= this.MAXLINES; i++) {

			this.shadowLayerLines[i].start.set(sprite.x + (sprite.width / 2), sprite.y + (sprite.height / 2));
			this.shadowLayerLines[i].end.set(
				sprite.x + (sprite.width / 2) + this.VISION * Math.cos(theta), 
				sprite.y + (sprite.height / 2) + this.VISION * Math.sin(theta));

			theta += 2 * Math.PI / this.MAXLINES;

		}

		this.shadowLayerLines.forEach( function(line) {

			var tiles = collLayer.getRayCastTiles(line, 4, true, false);

			if(tiles.length > 0) {

				var distance = 0;
				var min = 1e8;
				var tile = new Phaser.Tile();
				for(var i = 0; i < tiles.length; i++) {

					distance = tgame.physics.arcade.distanceBetween(player, tiles[i]);	

					if(distance < min) {

						min = distance;
						tile = tiles[i];

					}

				}

				polyMaskPoints.push(new Phaser.Point(tile.x * 32 + 16, tile.y * 32 + 16));

			} else {

				polyMaskPoints.push(new Phaser.Point(line.end.x, line.end.y));

			}			

		});


		this.shadowMaskPolygon.setTo(polyMaskPoints);

		this.resetMask(this.shadowMaskPolygon);

	},

	//To change the mask we must clear it and repopulate it.
	resetMask: function(polygon) {

		this.shadowMask.clear();
		this.shadowMask.beginFill(0xffffff);

		this.shadowMask.drawPolygon(polygon);

		this.shadowMask.endFill();

	}
	
};
