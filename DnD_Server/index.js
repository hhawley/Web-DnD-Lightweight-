// Dependencias de node.js
// sirven estilo: 
// * namespaces de C#
// * includes de C/C++
// * packages de Java
// * import de python						//fs es para escribir y leer en archivos
	//el servidor http para socket.io			//base de datos relacionales con mysql
// var io = require('socket.io')(http);		//comunicacion servidor-cliente

var router = require('./node_scripts/router.js');
var communication = require('./node_scripts/communication.js');
var database = require('./node_scripts/database.js');
var gamerouter = require('./node_scripts/Game/gamerouter.js');

// IGNORAR
// start HTTPS
// var options =  {
// 	key: fs.readFileSync('key.pem'),
// 	cert: fs.readFileSync('cert.pem')
// };

// https.createServer(options, app).listen(3000);
// end HTTPS
function startServer() {

	var http = require('http').Server(router.app);	
	http.listen(3000, function(){

		console.log('Express started in ' + router.app.get('env') + 
			' mode on http://localhost:' + router.app.get('port') + 
			'; press Ctr-C to terminate');

	});

	// Parte de conexion servidor-cliente
	communication.set(http);
	communication.logic(router.app, database.pool);

	gamerouter.set(http);
	gamerouter.startListening();
}

if(require.main == module) {
	startServer();
} else {
	module.exports = startServer;
}