var db = require("../database.js");
var bcrypt = require('bcrypt');
var credentials = require('../credentials.js');
var types = require('./data.js');



var createCampaing = function(user, name, data, on_finishing) {

	db.pool.getConnection(
	function(err, connection) {

		if(err) {

		  	connection.release();

		  	on_finishing("Error connecting to campaing table." + err, null);
		  	return;

		} 

		connection.query(
		"SELECT Name from campaings WHERE Name=\'" + name + "\' AND User=\'" + user + "\';", 
		function(err, rows) {
			
			if(!err && rows.length == 0) {

				connection.query("INSERT INTO campaings SET ?;", 
				{
					Name : name,
					User : user,
					CurrentMap : "",
					Data : data
				},
				function(err, rows) {
					
					connection.release();
					if(!err) {

	  					on_finishing("Created new campaing sucessfully", true);

					}
					else {

						on_finishing("Failed adding new campaing", null);  
	  					
					}

						
				});

			} else if(rows.length != 0) {
				
		  		on_finishing("Campaing with that name already exists", null);

			} else if(err) {

		  		on_finishing("Error with the database" + err, null);

			}
				
		});
		
		connection.on('error', function(err) {
		  	on_finishing("Error with the databse" + err, null);
		});


	});

};

var saveCampaing = function(user, name, data, on_finishing) {

	db.pool.getConnection(
	function(err, connection){

		if(err) {

			connection.release();
			on_finishing("Error connecting to username database", null);

		}

		var insert = {
			User : user,
			Name : name,
			Data : data
		};

		connection.query(
			"UPDATE campaings SET Data=? WHERE Name=? AND User=?;",
			insert,
			function(err) { 
				connection.release();

				if(err) {

					on_finishing("Error saving database. Please try again.", null);

				} else {

					on_finishing("Updated your campaing", true);

				}
		});

		connection.on('error', function(err) {
		  	on_finishing("Error with the databse", null);
		});

	});

};

var loadCampaings = function(user, on_finishing) {

	db.pool.getConnection(
	function(err, connection){

		if(err) {

			connection.release();
			on_finishing("Error connecting to username database", null);

		}

		connection.query(
			"SELECT Name, Data FROM campaings WHERE User=?;",
			[user],
			function(err, rows) { 
				connection.release();

				if(!err && rows.length != 0) {

					on_finishing("", rows);

				} else {

					on_finishing("No info.", rows);

				}
		});

		connection.on('error', function(err) {
		  	on_finishing("Error with the databse", null);
		});

	});

};

exports.saveCampaing =  saveCampaing;
exports.loadCampaings = loadCampaings;
exports.createCampaing =  createCampaing;