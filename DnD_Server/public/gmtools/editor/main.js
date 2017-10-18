var CurrentMapToEdit = {};
var UserName = {};

var SpaceGame = SpaceGame || {};

SpaceGame.game = new Phaser.Game(800, 600, Phaser.Auto, '');

SpaceGame.game.state.add('Boot', SpaceGame.Boot);
SpaceGame.game.state.add('Preload', SpaceGame.Preload);
SpaceGame.game.state.add('ErrorState', SpaceGame.ErrorState);
SpaceGame.game.state.add('PreloadGame', SpaceGame.PreloadGame);
SpaceGame.game.state.add('Game', SpaceGame.Game);


$(document).ready(function(){
	$.post('/UserName').done(function(data) {
		
		UserName = data.UserName;

	});

	$.post('/Campaings').done(function(data) {

		var curr_cmpg = $("#campaing_dropbox option:selected").val();
		var curr_map = $("#maps_dropbox option:selected").val();

		data.forEach(function(campaing, i) {
						
			if(campaing.Name == curr_cmpg) {
				CurrentMapToEdit = campaing[curr_map];
			}

		});


		SpaceGame.game.state.start('Boot');

	});


}