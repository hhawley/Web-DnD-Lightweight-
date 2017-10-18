var SpaceGame = SpaceGame || {};

SpaceGame.Menu = function(){};

SpaceGame.Menu.prototype = {
	preload: function(){

		

	},

	create: function() {

		this.isHost = false;
		this.cursors = this.game.input.keyboard.createCursorKeys();

		var text = this.game.add.text(this.game.world.centerX, this.game.world.centerY, "Dungeons and Dragons", {
			font: "12px Arial",
			fill: "#ff0044",
			align: "center"
		});
		text.anchor.set(0.5);

		var createHost = this.game.add.button(this.game.world.centerX - 95, this.game.world.centerY, 'placeholderSS', this.startHost, this, 2, 1, 0);
		var joinGame = this.game.add.button(this.game.world.centerX + 95, this.game.world.centerY, 'placeholderSS', this.joinGame, this, 2, 1, 0);
	},


	update: function() {



	},

	startHost: function() {

		socket.emit('host', true, gameCreated);

	},

	joinGame: function() {

		data = { gameID: '::ffff:192.168.0.14' };
		socket.emit('join', data, gameCreated);
	},
};

function gameCreated(isHost) {

	SpaceGame.game.state.start("PreloadGame", true, false, isHost, 'test');

}