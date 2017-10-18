var SpaceGame = SpaceGame || {};

SpaceGame.Preload = function(){};

SpaceGame.Preload.prototype = {
	
	preload: function() {

		//Game core Images
		var ImageDir = 'GameContent\/';
		this.load.spritesheet('placeholderSS', ImageDir + 'TileSet.png', 32, 32);
		this.load.spritesheet('placeholderSS01', ImageDir + 'TileSet.png', 512, 32);
		this.load.image('placeholderIMG', ImageDir + 'TileSet.png');

		//Game core TileMaps
		var MapDir = 'GameContent\/';
		this.load.tilemap('base', MapDir + 'base.json', null, Phaser.Tilemap.TILED_JSON);


		//Other jsons
		var JsonDir = 'GameContent\/';
		this.load.json('base', MapDir + 'base.json');

	},

	create: function() {

		this.state.start('Menu');
		
	}
};

