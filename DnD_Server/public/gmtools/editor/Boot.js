var SpaceGame = SpaceGame || {};

SpaceGame.Boot = function(){};

SpaceGame.Boot.prototype = {
	
	preload: function() {},

	create: function() {
		this.scale.pageAlignHorizontally = true;
    	this.scale.pageAlignVertically = true;
 
    	this.game.physics.startSystem(Phaser.Physics.ARCADE);
    	this.game.physics.arcade.gravity.y = 0;
    	this.state.start('Preload');
	}
};

SpaceGame.ErrorState = function(){};

SpaceGame.ErrorState.prototype = {
	init:  function(errMsg){ this.errMsg = errMsg; },
	preload:  function(){},
	create: function(){

		this.game.world.resize(800, 600);
		var text = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 90, this.errMsg, {
			font: "14px Arial",
			fill: "#ff0000",
			align: "center"
		});
		var continueBtn = this.game.add.button(this.game.world.centerX, this.game.world.centerY, 'placeholderSS', this.continue, this, 2, 1, 0);

	},
	continue: function() { this.state.start("Menu"); }

};