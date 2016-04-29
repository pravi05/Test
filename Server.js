var express = require("express");
var mysql = require("mysql");
var bodyParser = require("body-parser");
var md5 = require('MD5');
var fs = require('fs');
var rest = require("./Rest.js");
var cors = require('cors')
var app = express();
app.use(cors())

function REST() {
    var self = this;
    self.connectMysql();
};

REST.prototype.connectMysql = function() {
    var self = this;
    var pool = mysql.createPool({
        connectionLimit: 100,
        host: 'localhost',
        user: 'root',
        password: 'root',
        port: 3306,
        database: 'local_tentkotta',
		multipleStatements : 'Allow',
        debug: false
    });
    pool.getConnection(function(err, connection) {
        if (err) {
            self.stop(err);
        } else {
            self.configureExpress(connection);
        }
    });
}

/*
REST.prototype.connectMysql = function() {
    var self = this;
    var pool = mysql.createPool({
        connectionLimit: 100,
		waitForConnections : true,
        host: '104.238.80.141',
        user: 'tent_net',
        password: 'YceVGfu8pCBe',
        port: 3306,
        database: 'tent_net',
		multipleStatements : 'Allow',
		wait_timeout : 28800,
        connect_timeout :10
        debug: false
    });
	 self.configureExpress(connection);
   
}*/

REST.prototype.configureExpress = function(connection) {
    var self = this;
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    var router = express.Router();
    app.use('/tkapi/v1', router);
    var rest_router = new rest(router, connection, md5);
    self.startServer();
}

REST.prototype.startServer = function() {
    /*app.listen(3000, function() {
        console.log("All right ! I am alive at Port 3000");
    });*/
	require('https').createServer({
		key: fs.readFileSync('./utils/Certs/domain.key').toString(),
		cert: fs.readFileSync('./utils/Certs/4eb4c878bb5f36c1.crt').toString(),
		ca: fs.readFileSync('./utils/Certs/gd_bundle-g2-g1.crt').toString()
	}, app).listen(3000);
}

REST.prototype.stop = function(err) {
    console.log("ISSUE WITH MYSQL n" + err);
    process.exit(1);
}

new REST();