var mysql = require("mysql");
var session = require('express-session');
var mysqlstore = require('express-mysql-session')(session);
var bcrypt = require('bcrypt');
var credentials = require('./credentials.js')

// var queries = {
// 	"SELECT * FROM scrambled_data WHERE ID_CLIENTE=",
// }

var dataBases = {
	sessions  : "sessions",
	usernames : "users"
};

var options = {
	connectionLimit : 10,
	host 			: 'localhost',
    user 			: 'root',
    password		: credentials.dbpassword,
    database 		: 'bedrock',
    debug 			: false
};
// Como crear una conexion con la database
var pool = mysql.createPool(options);

// Test connextion
pool.getConnection(function(err, connection){

	if(err) {

	   connection.release();
	   console.log("Error connecting database.");  

	} 

	connection.on('error', function(err) {
		console.log("Error connecting database.");  
	});

});

var sessionStore = new mysqlstore({}, pool);

var login = function(user, pw, on_finishing) {

	pool.getConnection(
	function(err, connection) {

		if(err) {

		  	connection.release();
		  	on_finishing("Error connecting to username database.", null);
		} 


		connection.query(
			"SELECT DISTINCT * FROM users WHERE User = ?;", [user],
		function(err, rows) {
			connection.release();
			if(!err && rows.length > 0) {
				var retrieved_user = rows[0];
				if(bcrypt.compareSync(pw, retrieved_user.Password)) {
					on_finishing("Welcome!", {
						user: retrieved_user.User,
						email: retrieved_user.Email,
						friends: retrieved_user.Friends
					});
				}
				
			} else if(rows.length == 0) {

				on_finishing("That username does not exist.", null);

			} else {

				on_finishing("Error retrieving your data, password or username incorrect.", null);

			}
		});

		
		connection.on('error', function(err) {
			on_finishing("Error connecting to username database.", null);  
		});

	});

};

var register = function(email, user, pw, on_finishing) {

	pool.getConnection(
	function(err, connection) {

		if(err) {

		  	connection.release();

		  	on_finishing("Error connecting to username table." + err, null);
		} 

		var insert = {
			Email: email,
			User: user,
			Password: bcrypt.hashSync(pw, credentials.salt),
			Verified: false,
			Friends:"[]"
		};

		connection.query(
			"SELECT DISTINCT User from users WHERE User=?;", [user],
		function(err, rows) {

			if(!err && rows.length == 0) {

				connection.query("INSERT INTO users SET ?;", insert,
				function(err, rows) {
						connection.release();
						if(!err) {

		  					on_finishing("Register sucessfull", true);

						}
						else {

							on_finishing("Failed adding new user", null);  
		  					
						}

						
				});

			} else if(rows.length != 0) {
				
		  		on_finishing("User with that username already exists", null);

			} else if(err) {

		  		on_finishing("Error with the database", null);

			}
				
		});
		
		connection.on('error', function(err) {
		  	on_finishing("Error with the databse", null);
		});


	});

	

};

var verify = function(email, on_finishing) {



};

exports.pool = pool;
exports.sessionStore =  sessionStore;

exports.register = register;
exports.login = login;