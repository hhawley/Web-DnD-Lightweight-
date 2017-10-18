var socket = io();

socket.on('errorMsg', function(data) {

	console.error(data.msg);

});

var SpaceGame = SpaceGame || {};

SpaceGame.game = new Phaser.Game(800, 600, Phaser.Auto, '');

SpaceGame.game.state.add('Boot', SpaceGame.Boot);
SpaceGame.game.state.add('Preload', SpaceGame.Preload);
SpaceGame.game.state.add('ErrorState', SpaceGame.ErrorState);
SpaceGame.game.state.add('Menu', SpaceGame.Menu);
SpaceGame.game.state.add('PreloadGame', SpaceGame.PreloadGame);
SpaceGame.game.state.add('Game', SpaceGame.Game);

SpaceGame.game.state.start('Boot');