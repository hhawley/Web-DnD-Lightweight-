var token = function Token() {
	this.name = "";
	this.resource = "";
	this.isStatic = false;
	this.isPlayer = false;
	this.isVisible = true;
	this.playerUser = "";
	this.isLightSource = false;
	this.lightRange = 0;
	this.position.x = 0;
	this.position.y = 0;
};

var map = function Map() {
	this.name = "";
	this.resource = "";
	this.isTiledMap = false;
	tokens = [];
};

var campaing = function Campaing() {
	this.name = "";
	this.currentMap= "";
	this.maps = [];
};

exports.token = token;
exports.map = map;
exports.campaing = campaing;
// var token = {
// 	name 		 	: "",
// 	resource 		: "",
// 	isStatic 		: false,
// 	isPlayer 		: false,
// 	playerUser 		: "",
// 	isLightSource 	: false,
// 	position		: [0, 0]
// };

// var map = {
// 	name 			: "",
// 	resource		: "",
// 	isTiledMap 		: false,
// 	tokens			: []
// };

// var campaing {
// 	name 			: "",
// 	maps 			: [] 
// };