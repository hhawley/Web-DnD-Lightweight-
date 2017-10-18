var express = require('express')
var app = express();				//Express es el framework para paginas web
var formidable =  require('formidable');
var fs = require('fs-extra');
var database = require('./database.js');
var gamedb = require('./Game/gamedatabase.js');

app.use(express.static('public'));

app.use(require('body-parser')());

//Session and cookie area
var credentials = require('./credentials.js');
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({ store: database.sessionStore }));
app.use(function(req, res, next) {

	var isLogInUser = req.session.userName;

	res.locals.userName = req.session.userName;
	res.locals.campaingNames = req.session.campaingNames;
	res.locals.friends = req.session.friends;

	if(isLogInUser) {

		if(!req.session.campaingNames) {

			gamedb.loadCampaings(req.session.userName,
			function(msg, data) {
				res.locals.campaingNames = data;
				req.session.campaingNames = data;
				
				next();
			});

		} else {
			next();
		}
		
	} else {

		next();
	}
	
})
/////////////////////////

// View Engine area
var handlebars = require('express3-handlebars').create({
	defaultLayout: 'main',
	helpers: {
		section: function(name, options) {
			if(!this._sections) this._sections={};
			this._sections[name] = options.fn(this);
			return null;
		}
	}
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
///////////////////

// Cuando la 'homepage' es requerida, express puede realizar codigo y/o mandar un archivo
app.get('/', function(req, res){

	res.render('home'); //HTML document here

});

var checkIfLogIn = function(req, res, next) {
	// if(!req.session.userName) {
	// 	res.redirect(303, '/');
	// }

	next();
}

app.get('/msg', function(req, res){

	var message = req.session.msg;
	delete req.session.msg;
	res.render('message',  {message: message});


});

app.get('/register', function(req, res){
	res.render('register');
});

app.get('/login', function(req, res){
	res.render('login');
});

app.get('/gmtools/loadresource', function(req, res){
	res.render('loadresource');
});

app.get('/gmtools/campaingmanager', function(req, res) {

	res.render('campaingmanager');
});

app.get('/play', function(req, res) {

	res.render('game');

});

app.get(function(req, res, next) {
	res.status(404);
	res.render('404');
});

app.post('/upload', checkIfLogIn, 
function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if(err) {
			return res.redirect(303, '/loadpicture');
		}
		res.redirect(303, '/loadpicture');
	});

	form.on('end', function(fields, files){

		var path = this.openedFiles[0].path;
		var fileName = this.openedFiles[0].name;

		fs.copy(path, "./public/photos/" + req.session.userName + "/" +fileName, function(err) {
			if(err){
				return console.log(err);
			} 

		});

		fs.remove(path, function(err) {
			if(err){
				return console.log(err);
			} 
		})

	});
	
});

app.post('/signup', 
function(req, res) {

	database.register(req.body.email, req.body.user, req.body.password, function(msg, data) {
		console.log(msg);

			req.session.msg = msg;
			res.redirect(303, '/msg');
		
	});

});


app.post('/SignOut', 
function(req, res) {

	delete req.session.userName;
	// delete req.local.userName;
	delete req.session.friends;
	// delete req.local.friends;
	req.session.msg = "Successfully sign out";
	res.send({redirect:'/msg'});

});

app.post('/login', checkIfLogIn, function(req, res) {
	database.login(req.body.user, req.body.password, 
	function(msg, data) {
		console.log(msg);
		if(data) {

			req.session.userName = data.user;
			req.session.friends = data.friends;

		} 

		req.session.msg = msg;
		res.redirect(303, '/msg');

	});

});

app.post('/SaveCampaing', checkIfLogIn, function(req, res) {

	gamedb.saveCampaing(req.session.userName, req.body.campaingName, req.body.data, 
	function(msg, data) {
		console.log(msg);

		req.session.msg = msg;
		res.send( { redirect : '/msg' } );

		
	});

});

app.post('/CreateCampaing', checkIfLogIn, function(req, res) {

	gamedb.createCampaing(req.session.userName, req.body.campaingName, req.body.data, 
	function(msg, data) {
		console.log(msg);

		req.session.msg = msg;
		res.send( { redirect : '/msg' } );

	});

});

app.post('/Campaings', function(req, res) {

	res.json(req.session.campaingNames);

});

app.post('/UserName', function(req, res) {

	res.send( { UserName : req.session.userName });

});

app.use(function(err, req, res, next) {

	console.error(err.stack);
	res.status(500);
	res.render('500');

});

exports.app = app;
