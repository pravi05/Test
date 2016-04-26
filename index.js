var mysql = require("mysql");

var devConnectionConfig = {
    connectionLimit: 100,
    host: 'tkdevmachine.cloudapp.net',
    user: 'root',
    password: 'vvmFAe7DLKkvUYy',
    port: 3306,
    database: 'TentkottaSep',
    multipleStatements : 'Allow',
    debug: false
};
var prodConnectionConfig = {
    connectionLimit: 100,
    host: 'tkdevmachine.cloudapp.net',
    user: 'root',
    password: 'vvmFAe7DLKkvUYy',
    port: 3306,
    database: 'TentkottaSep',
    multipleStatements : 'Allow',
    debug: false
};

var pool = null;

/**
 * Handle all events from AMAZON api GATEWAY.
 */
exports.handler = function(event, context)  {
    console.log('event: '+JSON.stringify(event, null, '  '));
    console.log('context: '+JSON.stringify(context, null, '  '));
    var isProd = event["stage-variables"].stage == 'prod';
    var connectionConfig = isProd ? prodConnectionConfig : devConnectionConfig;
    if(pool == null) {
        // Pool will be reused if lambda instance is getting re-used.
        pool = mysql.createPool(connectionConfig);
    }
    pool.getConnection(function(err, connection) {
        if (err) {
            console.log('connnection error:'+err);
            context.fail({
                "error": true,
                "errorCode": 503,
                "message": "DB connection was lost. Please try again."
            });
            return;
        } else {
            handleRequest(event, context, connection);
        }
    });
}

/**
 * Function to handle all requests after creating connection.
 */
function handleRequest(event, context, connection) {
    var resourcePath = event.context["resource-path"];
    if(resourcePath.startsWith('/v1/search')) {
        search(event, context, connection);
    }
}

/**
 * Function to handle search request.
 */
function search(event, context, connection) {
    var result = [];
    var searchTerm = event.params.path.searchTerm;
    var searchQuery;
    if (searchTerm != undefined) {
        searchQuery = "SELECT video_id, video_title, video_key, language_id FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_title LIKE '%" + searchTerm + "%' AND category_status= 1 and  video_status = 1 and expiry_date>=" + Math.floor(Date.now() / 1000).toString() + " ORDER BY video_order ASC";
    } else {
        searchQuery = "SELECT video_id, video_title, video_key, language_id FROM video WHERE video_status = 1 and expiry_date>=" + Math.floor(Date.now() / 1000).toString() + " ORDER BY video_order ASC";
    }
    connection.query({sql:searchQuery,timeout:7500}, function(err, rows) {
        if (err) {
            if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
                context.fail({
                    "error": true,
                    "errorCode": err.code,
                    "message": "DB connection was lost. Please try again."
                });
            } else {
                context.fail({
                    "error": true,
                    "errorCode": err.code,
                    "message": "Query did not return required results"
                });
                console.log({
                    "id": 8,
                    "input": searchTerm,
                    "query": search_query,
                    "errorCode": err.code,
                    "message": "Query did not return required results"
                });
            }
        } else if (rows != undefined && rows.length > 0) {
            for (var i = 0; i < rows.length; i++) {
                result.push({
                    "videoId": rows[i].video_id,
                    "videoTitle": rows[i].video_title,
                    "tvImage": "https://www.tentkotta.com/images/video_images/1280_480/" + rows[i].video_key + "_1.jpg",
                    "deviceImage": "https://www.tentkotta.com/images/video_images/216_312/" + rows[i].video_key + "_1.jpg",
                    "webImage": "https://www.tentkotta.com/images/video_images/210_270/" + rows[i].video_key + "_1.jpg",
                    "videoCategory": rows[i].language_id,
                    "videoType": 1
                });
            }
            context.succeed(result);
        } else {
            context.fail({
                "error": true,
                "errorCode": 202,
                "message": "Query did not return required results"
            });
            console.log({
                "id": 8,
                "input": searchTerm,
                "query": search_query,
                "message": "Query did not return required results"
            });
        }
    });
}

