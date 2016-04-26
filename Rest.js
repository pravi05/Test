var mysql = require("mysql");
var async = require('async');
var FB = require('fb');
var mailer = require('mailer');
var logger = require("./utils/logger");
var express = require("express");
var app = express();

var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(r) {
        var t, e, o, a, h, n, c, d = "",
            C = 0;
        for (r = Base64._utf8_encode(r); C < r.length;) t = r.charCodeAt(C++), e = r.charCodeAt(C++), o = r.charCodeAt(C++), a = t >> 2, h = (3 & t) << 4 | e >> 4, n = (15 & e) << 2 | o >> 6, c = 63 & o, isNaN(e) ? n = c = 64 : isNaN(o) && (c = 64), d = d + this._keyStr.charAt(a) + this._keyStr.charAt(h) + this._keyStr.charAt(n) + this._keyStr.charAt(c);
        return d
    },
    decode: function(r) {
        var t, e, o, a, h, n, c, d = "",
            C = 0;
        for (r = r.replace(/[^A-Za-z0-9\+\/\=]/g, ""); C < r.length;) a = this._keyStr.indexOf(r.charAt(C++)), h = this._keyStr.indexOf(r.charAt(C++)), n = this._keyStr.indexOf(r.charAt(C++)), c = this._keyStr.indexOf(r.charAt(C++)), t = a << 2 | h >> 4, e = (15 & h) << 4 | n >> 2, o = (3 & n) << 6 | c, d += String.fromCharCode(t), 64 != n && (d += String.fromCharCode(e)), 64 != c && (d += String.fromCharCode(o));
        return d = Base64._utf8_decode(d)
    },
    _utf8_encode: function(r) {
        r = r.replace(/\r\n/g, "\n");
        for (var t = "", e = 0; e < r.length; e++) {
            var o = r.charCodeAt(e);
            128 > o ? t += String.fromCharCode(o) : o > 127 && 2048 > o ? (t += String.fromCharCode(o >> 6 | 192), t += String.fromCharCode(63 & o | 128)) : (t += String.fromCharCode(o >> 12 | 224), t += String.fromCharCode(o >> 6 & 63 | 128), t += String.fromCharCode(63 & o | 128))
        }
        return t
    },
    _utf8_decode: function(r) {
        for (var t = "", e = 0, o = c1 = c2 = 0; e < r.length;) o = r.charCodeAt(e), 128 > o ? (t += String.fromCharCode(o), e++) : o > 191 && 224 > o ? (c2 = r.charCodeAt(e + 1), t += String.fromCharCode((31 & o) << 6 | 63 & c2), e += 2) : (c2 = r.charCodeAt(e + 1), c3 = r.charCodeAt(e + 2), t += String.fromCharCode((15 & o) << 12 | (63 & c2) << 6 | 63 & c3), e += 3);
        return t
    }
};

function REST_ROUTER(router, connection, md5) {
    var self = this;
    self.handleRoutes(router, connection, md5);
}

REST_ROUTER.prototype.handleRoutes = function(router, connection, md5) {
    var self = this;
    var retryCnt = 1;
	var groups_categories = [{
        "groupId": "1",
        "groupOrder": "1",
        "groupName": "Tamil",
        "groupIconUnselected": "https://www.tentkotta.com/images/Menu_Images/01a.png",
        "groupIconSelected": "https://www.tentkotta.com/images/Menu_Images/01b.png",
        "groupIconHover": "https://www.tentkotta.com/images/Menu_Images/01c.png",
        "groupStatus": "1",
        "videoType": "1",
        "categories": [{
            "categoryId": "1",
            "categoryOrder": "1",
            "categoryName": "New Releases",
            "categoryStatus": "1",
            "query": "SELECT video_id, video_title, sub_title, mp3_url, mp4_url_five, video_url, video_key, video_description, video_price, embeded_code, actors, director, music, release_year, total_hours, rating, expiry_date, embeded_code_preview FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_status = 1 AND category_status = 1 and NOT FIND_IN_SET(3,movie_type) and expiry_date >= <replace>date AND video_id = <replace> AND FIND_IN_SET(1,movie_type) AND language_id = 1 AND movie_order IN(1,7) ORDER BY FIELD(video_order,1,2,3,4,5), created_date DESC"
        }, {
            "categoryId": "2",
            "categoryOrder": "2",
            "categoryName": "Most Popular",
            "categoryStatus": "1",
            "query": "SELECT video_id, video_title, sub_title, mp3_url, mp4_url_five, video_url, video_key, video_description, video_price, embeded_code, actors, director, music, release_year, total_hours, rating, expiry_date, embeded_code_preview FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_status = 1 AND category_status = 1 and NOT FIND_IN_SET(3,movie_type) and expiry_date >= <replace>date AND video_id = <replace> AND FIND_IN_SET(4,movie_type) AND language_id = 1 AND movie_order IN(4,7) ORDER BY FIELD(video_order,1,2,3,4,5), created_date DESC"
        }, {
            "categoryId": "3",
            "categoryOrder": "3",
            "categoryName": "Only @Tentkotta",
            "categoryStatus": "1",
            "query": "SELECT video_id, video_title, sub_title, mp3_url, mp4_url_five, video_url, video_key, video_description, video_price, embeded_code, actors, director, music, release_year, total_hours, rating, expiry_date, embeded_code_preview FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_status = 1 AND category_status = 1 and NOT FIND_IN_SET(3,movie_type) and expiry_date >= <replace>date AND video_id = <replace> AND FIND_IN_SET(8,movie_type) AND language_id = 1 AND movie_order IN(10,7) ORDER BY FIELD(video_order,1,2,3,4,5), created_date DESC"
        }, {
            "categoryId": "4",
            "categoryOrder": "4",
            "categoryName": "Featured Movie",
            "categoryStatus": "1",
            "query": "SELECT video_id, video_title, sub_title, mp3_url, mp4_url_five, video_url, video_key, video_description, video_price, embeded_code, actors, director, music, release_year, total_hours, rating, expiry_date, embeded_code_preview FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_status = 1 AND category_status = 1 and NOT FIND_IN_SET(3,movie_type) and expiry_date >= <replace>date AND video_id = <replace> AND FIND_IN_SET(5,movie_type) AND language_id = 1 AND movie_order IN(5,7) ORDER BY FIELD(video_order,1,2,3,4,5), created_date DESC"
        }, {
            "categoryId": "5",
            "categoryOrder": "5",
            "categoryName": "Recently Added",
            "categoryStatus": "1",
            "query": "SELECT video_id, video_title, sub_title, mp3_url, mp4_url_five, video_url, video_key, video_description, video_price, embeded_code, actors, director, music, release_year, total_hours, rating, expiry_date, embeded_code_preview FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_status = 1 AND category_status = 1 and NOT FIND_IN_SET(3,movie_type) and expiry_date >= <replace>date AND video_id = <replace> AND FIND_IN_SET(2,movie_type) AND language_id = 1 AND movie_order IN(2,7) ORDER BY FIELD(video_order,1,2,3,4,5), created_date DESC"
        }]
    }, {
        "groupId": "2",
        "groupOrder": "2",
        "groupName": "Telugu",
        "groupIconUnselected": "https://www.tentkotta.com/images/Menu_Images/02a.png",
        "groupIconSelected": "https://www.tentkotta.com/images/Menu_Images/02b.png",
        "groupIconHover": "https://www.tentkotta.com/images/Menu_Images/02c.png",
        "groupStatus": "1",
        "videoType": "1",
        "categories": [{
            "categoryId": "1",
            "categoryOrder": "1",
            "categoryName": "Telugu",
            "categoryStatus": "1",
            "query": "SELECT video_id, video_title, sub_title, mp3_url, mp4_url_five, video_url, video_key, video_description, video_price, embeded_code, actors, director, music, release_year, total_hours, rating, expiry_date, embeded_code_preview FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_status = 1 AND category_status = 1 AND language_id=2 AND expiry_date >= <replace>date AND video_id = <replace> ORDER BY FIELD(movie_order, 1, 2, 3, 4, 5, 6, 7, 0), movie_order, video_order ASC"
        }]
    }, {
        "groupId": "3",
        "groupOrder": "3",
        "groupName": "TV Shows",
        "groupIconUnselected": "https://www.tentkotta.com/images/Menu_Images/03a.png",
        "groupIconSelected": "https://www.tentkotta.com/images/Menu_Images/03b.png",
        "groupIconHover": "https://www.tentkotta.com/images/Menu_Images/03c.png",
        "groupStatus": "1",
        "videoType": "2",
        "categories": [{
            "categoryId": "1",
            "categoryOrder": "1",
            "categoryName": "Live TV and Video On Demand",
            "categoryStatus": "1",
            "query": "select serial_id AS video_id, serial_name AS video_title, \"\" AS sub_title, embeded_code AS mp3_url, \"\" AS mp4_url_five, serial_url AS video_url, serial_video_key AS video_key, serial_description AS video_description, \"\" AS video_price, embeded_code AS embeded_code, actors AS actors, director AS director, music AS music, release_year AS release_year, \"\" AS total_hours, rating AS rating, expiry_date AS expiry_date, \"\" AS embeded_code_preview, serial_type AS serial_type from tv_serial where serial_status=1 <replace>AND serial_id = <replace> and main_serial_id=0 and serial_type IN (2, 3) order by serial_type asc, created_date DESC"
        }, {
            "categoryId": "2",
            "categoryOrder": "2",
            "categoryName": "TV Dramas",
            "categoryStatus": "1",
            "query": "select serial_id AS video_id, serial_name AS video_title, \"\" AS sub_title, \"\" AS mp3_url, \"\" AS mp4_url_five, serial_url AS video_url, serial_video_key AS video_key, serial_description AS video_description, \"\" AS video_price, embeded_code AS embeded_code, actors AS actors, director AS director, music AS music, release_year AS release_year, \"\" AS total_hours, rating AS rating, expiry_date AS expiry_date, \"\" AS embeded_code_preview from tv_serial where serial_status=1 and serial_id IN(select main_serial_id from tv_serial where main_serial_id!=0 and serial_status=1 group by main_serial_id order by main_serial_id) and expiry_date >= <replace>date AND serial_id = <replace> order by created_date DESC"
        }]
    }, {
        "groupId": "4",
        "groupOrder": "4",
        "groupName": "Bench Flix",
        "groupIconSelected": "https://www.tentkotta.com/images/Menu_Images/04a.png",
        "groupIconUnselected": "https://www.tentkotta.com/images/Menu_Images/04b.png",
        "groupIconHover": "https://www.tentkotta.com/images/Menu_Images/04c.png",
        "groupStatus": "0",
        "videoType": "2",
        "categories": [{
            "categoryId": "1",
            "categoryOrder": "1",
            "categoryName": "New Releases",
            "categoryStatus": "0",
            "query": "SELECT flim_id AS video_id, flim_title AS video_title, \"\" AS sub_title, \"\" AS mp3_url, \"\" AS mp4_url_five, flim_url AS video_url, flim_key AS video_key, description AS video_description, \"\" AS video_price, embeded_code AS embeded_code, \"\" AS actors, \"\" AS director, \"\" AS music, \"\" AS release_year, \"\" AS total_hours, \"\" AS rating, \"\" AS expiry_date, \"\" AS embeded_code_preview FROM short_flims WHERE status = 1 <replace>AND flim_id = <replace> AND category = 1 ORDER BY created_date DESC"
        }, {
            "categoryId": "2",
            "categoryOrder": "2",
            "categoryName": "Recently Added",
            "categoryStatus": "0",
            "query": "SELECT flim_id AS video_id, flim_title AS video_title, \"\" AS sub_title, \"\" AS mp3_url, \"\" AS mp4_url_five, flim_url AS video_url, flim_key AS video_key, description AS video_description, \"\" AS video_price, embeded_code AS embeded_code, \"\" AS actors, \"\" AS director, \"\" AS music, \"\" AS release_year, \"\" AS total_hours, \"\" AS rating, \"\" AS expiry_date, \"\" AS embeded_code_preview FROM short_flims WHERE status = 1 <replace>AND flim_id = <replace> AND category = 2 ORDER BY created_date DESC"
        }, {
            "categoryId": "3",
            "categoryOrder": "3",
            "categoryName": "Most Popular",
            "categoryStatus": "0",
            "query": "SELECT flim_id AS video_id, flim_title AS video_title, \"\" AS sub_title, \"\" AS mp3_url, \"\" AS mp4_url_five, flim_url AS video_url, flim_key AS video_key, description AS video_description, \"\" AS video_price, embeded_code AS embeded_code, \"\" AS actors, \"\" AS director, \"\" AS music, \"\" AS release_year, \"\" AS total_hours, \"\" AS rating, \"\" AS expiry_date, \"\" AS embeded_code_preview FROM short_flims WHERE status = 1 <replace>AND flim_id = <replace> AND category = 3 ORDER BY created_date DESC"
        }]
    }, {
        "groupId": "5",
        "groupOrder": "5",
        "groupName": "HD Songs",
        "groupIconUnselected": "https://www.tentkotta.com/images/Menu_Images/05a.png",
        "groupIconSelected": "https://www.tentkotta.com/images/Menu_Images/05b.png",
        "groupIconHover": "https://www.tentkotta.com/images/Menu_Images/05c.png",
        "groupStatus": "1",
        "videoType": "4",
        "categories": [{
            "categoryId": "1",
            "categoryOrder": "1",
            "categoryName": "HD Songs",
            "categoryStatus": "1",
            "query": "SELECT movie_id AS video_id, movie_name AS video_title, \"\" AS sub_title, embeded_code AS mp3_url, \"\" AS mp4_url_five, movie_url AS video_url, movie_video_key AS video_key, movie_description AS video_description, \"\" AS video_price, embeded_code AS embeded_code, \"\" AS actors, \"\" AS director, \"\" AS music, \"\" AS release_year, \"\" AS total_hours, rating AS rating, \"\" AS expiry_date, \"\" AS embeded_code_preview FROM movie_song AS ms WHERE movie_status = 1 <replace>AND movie_id = <replace> AND main_movie_id != 0 ORDER BY main_movie_id ASC, song_order DESC"
        }]
    }, {
        "groupId": "6",
        "groupOrder": "6",
        "groupName": "Live Radio",
        "groupIconUnselected": "https://www.tentkotta.com/images/Menu_Images/05a.png",
        "groupIconSelected": "https://www.tentkotta.com/images/Menu_Images/05b.png",
        "groupIconHover": "https://www.tentkotta.com/images/Menu_Images/05c.png",
        "groupStatus": "0",
        "videoType": "5",
        "categories": [{
            "categoryId": "1",
            "categoryOrder": "1",
            "categoryName": "Live Radio",
            "categoryStatus": "1",
            "query": "SELECT 1 AS video_id, \"8K Radio\" AS video_title, \"\" AS sub_title, \"http://cplay.8kradio.com/8kradio/av1.stream_128k/playlist.m3u8\" AS mp3_url, \"\" AS mp4_url_five, \"\" AS video_url, \"8kRadio\" AS video_key, \"\" AS video_description, \"\" AS video_price, \"rtsp://play.8kradio.com:1935/8kradio/av1.stream_128k\" AS embeded_code, \"\" AS actors, \"\" AS director, \"\" AS music, \"\" AS release_year, \"\" AS total_hours, \"\" AS rating, \"\" AS expiry_date, \"\" AS embeded_code_preview"
        }]
    }];
    self.getGroupCategories = function() {
        var respObject = [];
        var k = 0;
        for (i = 0; i < groups_categories.length; i++) {
            if (groups_categories[i].groupStatus == 1) {
                respObject[k] = JSON.parse(JSON.stringify(groups_categories[i]));
                var l = 0;
                for (j = 0; j < groups_categories[i].categories.length; j++) {
                    if (groups_categories[i].categories[j].categoryStatus == 0) {
                        respObject[k].categories.splice(l, 1);
                    } else {
                        delete respObject[k].categories[l].query;
                        delete respObject[k].categories[l].categoryStatus;
                        l++;
                    }
                }
                delete respObject[k].groupStatus;
                delete respObject[k].videoType;
                k++;
            }
        }
        return respObject;
    }
    var active_groups_categories = self.getGroupCategories();
    //0
    self.handleDisconnect = function(apiId) {
            if (retryCnt <= 5) {
                retryCnt++;
                connection = mysql.createConnection(connection.config);
                connection.connect(function(err) {
                    if (err) {
                        setTimeout(function() {
							self.handleDisconnect(apiId);
						}, 2000);
                    } else {
                        logger.error('Reconnected to DB successfully during ' + apiId + ' API execution after ' + retryCnt + ' retries.');
                        retryCnt = 1;
                        return true;
                    }
                });
                connection.on('error', function(err) {
                    logger.error('DB Error: ' + err);
                    if (err.code == 'PROTOCOL_CONNECTION_LOST' || err.code == 'ECONNREFUSED') {
                        setTimeout(function() {
							self.handleDisconnect(apiId);
						}, 2000);
                    } else {
                        retryCnt = 1;
                        logger.error({
                            "id": 0,
                            "message": err
                        });
                        return false;
                    }
                });
            } else {
                retryCnt = 1;
				logger.error('Reconnection to DB failed during ' + apiId + ' API execution after ' + retryCnt + ' retries.');
                return false;
            }
        }
    //Root API
	router.get("/", function(req, res) {
		res.json({
			"message": "APIs for Tentkotta Website: https://www.tentkotta.com. To be used by various apps and integration along with Website.",
			"dbState": connection.state
		});
    });
    //1
    router.post("/pin", function(req, res) {
		var security_query = "SELECT * FROM api_security_codes WHERE used = 0 LIMIT 1";
		connection.query({sql:security_query,timeout:7500}, function(err, rows) {
			if (err) {
				if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(1.1)) {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "DB connection was lost. Please try again."
					});
				} else {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Query did not return required results"
					});
					logger.error({
						"id": 1,
						"input": req.body,
						"query": security_query,
						"errorCode": err.code,
						"message": "Query did not return required results"
					});
				}
			} else if (rows != undefined && rows.length == 1) {
				var pin_value = rows[0].code;
				var insert_update_query = "UPDATE api_security_codes SET used = 1 WHERE id = " + rows[0].id + "; DELETE FROM api_access_tokens WHERE device_id = '" + req.body.deviceId + "' AND device_type = '" + req.body.deviceType + "'; INSERT INTO api_access_tokens (security_code, creation_date, device_id, device_type) VALUES ('" + pin_value + "'," + Math.floor(Date.now() / 1000).toString() + ",'" + req.body.deviceId + "','" + req.body.deviceType + "')";
				connection.query({sql:insert_update_query,timeout:7500}, function(err, rows1) {
					if (err) {
						if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(1.2)) {
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "DB connection was lost. Please try again."
							});
						} else {
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Query did not return required results"
							});
							logger.error({
								"id": 1,
								"input": req.body,
								"query": insert_update_query,
								"errorCode": err.code,
								"message": "Query did not return required results"
							});
						}
					} else if (rows1 != undefined && rows1.affectedRows != 0) {
						res.json({
							"httpCode": 200,
							"response": {
								"securityCode": pin_value,
								"expireTime": "120"
							}
						});
					} else {
						res.json({
							"error": true,
							"errorCode": 205,
							"message": "Insert/Update statement failed. No rows affected."
						});
						logger.error({
							"id": 1,
							"input": req.body,
							"message": "Insert/Update statement failed. No rows affected."
						});
					}
				});
			} else {
				res.json({
					"error": true,
					"errorCode": 204,
					"message": "Security Codes Expired. Please contact system administrator."
				});
				logger.error({
					"id": 1,
					"input": req.body,
					"message": "Security Codes Expired. Please contact system administrator."
				});
			}
		});
    });
    //2
    router.post("/accessToken", function(req, res) {
        var subscription_token_query = "SELECT users.email, subscription.billing_date FROM subscription INNER JOIN users ON subscription.user_id = users.user_id WHERE users.user_id = " + req.body.userId + " ORDER BY subscription.billing_date DESC LIMIT 1; SELECT device_id, device_type FROM api_access_tokens WHERE security_code = '" + req.body.pin + "' AND access_token IS NULL";
        connection.query({sql:subscription_token_query,timeout:7500}, function(err, rows) {
			if (err) {
                if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(2.1)) {
                    res.json({
                        "error": true,
                        "errorCode": err.code,
                        "message": "DB connection was lost. Please try again."
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": err.code,
                        "message": "Query did not return required results"
                    });
                    logger.error({
                        "id": 2,
                        "input": req.body,
                        "query": subscription_token_query,
						"errorCode": err.code,
                        "message": "Query did not return required results"
                    });
                }
            } else if (rows != undefined && rows.length == 2 && rows[1].length > 0) {
				if (rows[0].length > 0 ) {
					var profile_status = (rows[0][0].billing_date >= Math.floor(Date.now() / 1000)) ? "Active" : "Cancelled";
					var access_token = Base64.encode((req.body.userId + "|" + rows[1][0].device_id + "|" + rows[1][0].device_type).toString());
					var update_query = "UPDATE api_access_tokens SET user_id = " + req.body.userId + ", access_token = '" + access_token + "', access_token_status = '" + profile_status + "' WHERE access_token IS NULL AND security_code = '" + req.body.pin + "'";
					connection.query({sql:update_query,timeout:7500}, function(err, rows1) {
						if (err) {
							if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(2.2)) {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "DB connection was lost. Please try again."
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Query did not return required results"
								});
								logger.error({
									"id": 2,
									"input": req.body,
									"query": update_query,
									"errorCode": err.code,
									"message": "Query did not return required results"
								});
							}
						} else if (rows1.affectedRows != 0) {
							res.json({
								"httpCode": 200,
								"response": {
									"message": "Successful",
									"accessToken": access_token,
									"accessTokenStatus": profile_status,
									"email": rows[0][0].email,
									"subscriptionEndDate": new Date(rows[0][0].billing_date * 1000).toDateString()
								}
							});
						} else {
							res.json({
								"error": true,
								"errorCode": 205,
								"message": "Insert/Update statement failed. No rows affected."
							});
							logger.error({
								"id": 2,
								"input": req.body,
								"message": "Insert/Update statement failed. No rows affected."
							});
						}
					});
				} else {
					res.json({
                        "error": true,
                        "errorCode": 204,
                        "message": "User does not have a valid subscription."
                    });
                    logger.error({
                        "id": 2,
                        "input": req.params,
                        "message": "User does not have a valid subscription"
                    });
				}
            } else {
                res.json({
                    "error": true,
                    "errorCode": 201,
                    "message": "Invalid Parameter(s): userId/pin"
                });
            }
        });

    });
    //3
    router.get("/accessToken/:pinValue", function(req, res) {
        var access_token_query = "SELECT api_access_tokens.access_token, api_access_tokens.access_token_status, users.email, subscription.billing_date FROM api_access_tokens INNER JOIN users ON users.user_id = api_access_tokens.user_id INNER JOIN subscription ON subscription.user_id = api_access_tokens.user_id WHERE api_access_tokens.security_code = '" + req.params.pinValue + "' ORDER by subscription.billing_date DESC LIMIT 1";
        connection.query({sql:access_token_query,timeout:7500}, function(err, rows) {
            if (err) {
                if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(3.1)) {
                    res.json({
                        "error": true,
                        "errorCode": err.code,
                        "message": "DB connection was lost. Please try again."
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": err.code,
                        "message": "Query did not return required results"
                    });
                    logger.error({
                        "id": 3,
                        "input": req.params,
                        "query": access_token_query,
						"errorCode": err.code,
                        "message": "Query did not return required results"
                    });
                }
            } else if (rows != undefined && rows.length > 0) {
                res.json({
                    "httpCode": 200,
                    "response": {
                        "accessToken": rows[0].access_token,
                        "accessTokenStatus": rows[0].access_token_status,
						"email": rows[0].email,
						"subscriptionEndDate": new Date(rows[0].billing_date * 1000).toDateString()
                    }
                });
            } else {
                res.json({
                    "error": true,
                    "errorCode": 201,
                    "message": "Invalid Parameter(s): pinVaue"
                });
            }
        });
    });
    //4.1
	self.continueLogin = function(req, res, user_query) {
		if (user_query != "") {
			connection.query({sql:user_query,timeout:7500}, function(err, rows) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(4.1)) {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "DB connection was lost. Please try again."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Query did not return required results"
						});
						logger.error({
							"id": 4.1,
							"input": req.body,
							"query": user_query,
							"errorCode": err.code,
							"message": "Query did not return required results"
						});
					}
				} else if (rows == undefined || rows.length == 0) {
					res.json({
						"error": true,
						"errorCode": 201,
						"message": "Invalid Parameter(s): email/password/facebookAccessToken"
					});
				} else {
					var user_id = rows[0].user_id;
					var user_status = rows[0].user_status == 1 ? "Active" : "Inactive";
					var name = rows[0].firstname == rows[0].lastname ? rows[0].firstname : rows[0].firstname + ' ' + rows[0].lastname;
					var deviceId = req.body.deviceId;
					var deviceType = req.body.deviceType;
					var reqHostname = req.get('host').split(":")[0];
					var reqPort = req.get('host').split(":")[1];
					var subscription_query = "SELECT billing_date FROM subscription WHERE user_id = " + user_id + " ORDER BY billing_date DESC LIMIT 1; SELECT access_token, access_token_status FROM api_access_tokens WHERE user_id = " + user_id + " AND device_id = '" + deviceId + "' AND device_type = '" + deviceType + "'";
					connection.query({sql:subscription_query,timeout:7500}, function(err, rows1) {
						if (err) {
							if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(4.2)) {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "DB connection was lost. Please try again."
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Query did not return required results"
								});
								logger.error({
									"id": 4.1,
									"input": req.body,
									"query": subscription_query,
									"errorCode": err.code,
									"message": "Query did not return required results"
								});
							}
						} else {
							if (rows1.length == 2 && rows1[1].length > 0 && rows1[1][0].access_token != undefined) {
								res.json({
									"name": name,
									"userStatus": user_status,
									"accessToken": rows1[1][0].access_token,
									"accessTokenStatus": rows1[1][0].access_token_status,
									"subscriptionEndDate": new Date((rows1[0].length > 0 ? rows1[0][0].billing_date : 1) * 1000).toDateString()
								});
							} else if (rows1.length == 2 && rows1[0].length > 0) {
								var accessToken = Base64.encode((user_id + "|" + deviceId + "|" + deviceType).toString());
								var profile_status = (rows1[0][0].billing_date >= Math.floor(Date.now() / 1000)) ? "Active" : "Cancelled";
								res.json({
									"name": name,
									"userStatus": user_status,
									"accessToken": accessToken,
									"accessTokenStatus": profile_status,
									"subscriptionEndDate": new Date(rows1[0][0].billing_date * 1000).toDateString()
								});
								self.insertAccessToken(deviceId, deviceType, reqHostname, reqPort, user_id, accessToken, profile_status);
							} else {
								res.json({
									"name": name,
									"userStatus": user_status,
									"accessToken": "",
									"accessTokenStatus": "",
									"subscriptionEndDate": ""
								});
							}
						}
					});
				}
			});
		}
	}
	//4.2
	self.insertAccessToken = function(deviceId, deviceType, reqHostname, reqPort, user_id, accessToken, profileStatus) {
        var body = {
			'deviceId': deviceId,
			'deviceType': deviceType
		}
		var security_query = "SELECT * FROM api_security_codes WHERE used = 0 LIMIT 1";
		connection.query({sql:security_query,timeout:7500}, function(err, rows) {
			if (err) {
				if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(4.3)) {
					logger.error({
						"error": true,
						"errorCode": err.code,
						"message": "DB connection was lost. Please try again."
					});
				} else {
					logger.error({
						"id": 4.2,
						"input": body,
						"query": security_query,
						"errorCode": err.code,
						"message": "Query did not return required results"
					});
				}
			} else if (rows != undefined && rows.length == 1) {
				var pin_value = rows[0].code;
				var insert_update_query = "UPDATE api_security_codes SET used = 1 WHERE id = " + rows[0].id + "; DELETE FROM api_access_tokens WHERE device_id = '" + body.deviceId + "' AND device_type = '" + body.deviceType + "'; INSERT INTO api_access_tokens (security_code, creation_date, device_id, device_type) VALUES ('" + pin_value + "'," + Math.floor(Date.now() / 1000).toString() + ",'" + body.deviceId + "','" + body.deviceType + "')";
				connection.query({sql:insert_update_query,timeout:7500}, function(err, rows1) {
					if (err) {
						if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(4.4)) {
							logger.error({
								"error": true,
								"errorCode": err.code,
								"message": "DB connection was lost. Please try again."
							});
						} else {
							logger.error({
								"id": 4.2,
								"input": body,
								"query": insert_update_query,
								"errorCode": err.code,
								"message": "Query did not return required results"
							});
						}
					} else if (rows1 != undefined && rows1.affectedRows != 0) {
						var update_query = "UPDATE api_access_tokens SET user_id = " + user_id + ", access_token = '" + accessToken + "', access_token_status = '" + profileStatus + "' WHERE access_token IS NULL AND security_code = '" + pin_value + "'";
						connection.query({sql:update_query,timeout:7500}, function(err, rows) {
							if (err) {
								if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
									self.handleDisconnect(4.5);
									self.insertAccessToken(deviceId, deviceType, reqHostname, reqPort, user_id, accessToken, profileStatus);
								} else {
									logger.error({
										"id": 4.2,
										"input": [deviceId, deviceType, reqHostname, reqPort, user_id, accessToken, profileStatus],
										"query": update_query,
										"error": err,
										"message": "Query did not return required results"
									});
								}
							} else if (rows.affectedRows == 0) {
								logger.error({
									"id": 4.2,
									"input": [deviceId, deviceType, reqHostname, reqPort, user_id, accessToken, profileStatus],
									"query": update_query,
									"message": "Update statement failed."
								});
							}
						});
					} else {
						logger.error({
							"id": 4.2,
							"input": body,
							"message": "Insert/Update statement failed. No rows affected."
						});
					}
				});
			} else {
				logger.error({
					"id": 4.2,
					"input": body,
					"message": "Security Codes Expired. Please contact system administrator."
				});
			}
		});
	}
	//4
    router.post("/user/login", function(req, res) {
		if (req.body.facebookAccessToken != "" && req.body.password == "") {
			FB.setAccessToken(req.body.facebookAccessToken);
			FB.api('fql', { q: 'SELECT uid FROM user WHERE uid=me()' }, function (result) {
				if(!result || result.error) {
					logger.error(!result ? 'error occurred' : result.error);
				} else if (result.data != undefined && result.data.length > 0) {
					var user_query = "SELECT user_id, firstname, lastname, user_status FROM users WHERE email = '" + req.body.email + "' AND fb_user_id = '" + result.data[0].uid + "'";
					self.continueLogin(req, res, user_query);
				} else {
					res.json({
						"error": true,
						"errorCode": 201,
						"message": "Invalid Parameter(s): facebookAccessToken"
					});
				}
			});
		} else if (req.body.facebookUserId != "" && req.body.password == "") {
			var user_query = "SELECT user_id, firstname, lastname, user_status FROM users WHERE email = '" + req.body.email + "' AND fb_user_id = '" + req.body.facebookUserId + "'";
			self.continueLogin(req, res, user_query);
		} else if (req.body.facebookAccessToken == "" && req.body.password != "") {
			var user_query = "SELECT user_id, firstname, lastname, user_status FROM users WHERE email = '" + req.body.email + "' AND password = '" + md5(req.body.password) + "'";
			self.continueLogin(req, res, user_query);
		} else {
			res.json({
				"error": true,
				"errorCode": 201,
				"message": "Invalid Parameter(s): password/facebookAccessToken"
			});
		}
    });
    //5
    router.get("/categories/:accessToken", function(req, res) {
        var result = {
            "httpCode": 200,
            "response": {
                "status": "Groups and Categories listed successfully",
				"subscriptionStatus": "",
                "categoryGroups": []
            }
        };
        var access_query = "SELECT billing_date FROM subscription WHERE user_id = (SELECT user_id FROM api_access_tokens WHERE access_token = '" + req.params.accessToken + "') ORDER BY billing_date DESC LIMIT 1";
        connection.query({sql:access_query,timeout:7500}, function(err, rows) {
            if (err) {
                if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(5.1)) {
                    res.json({
                        "error": true,
                        "errorCode": err.code,
                        "message": "DB connection was lost. Please try again."
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": err.code,
                        "message": "Query did not return required results"
                    });
                    logger.error({
                        "id": 5,
                        "input": req.params,
                        "query": access_query,
						"errorCode": err.code,
                        "message": "Query did not return required results"
                    });
                }
            } else if (rows != undefined && rows.length > 0) {
                if (rows[0].billing_date < Math.floor(Date.now() / 1000)) {
                    result.response.status += ". Warning: User's subscription has expired.";
					result.response.subscriptionStatus = "Cancelled";
                } else {
					result.response.subscriptionStatus = "Active";
				}
				result.response.categoryGroups = active_groups_categories;
				res.json(result);
            } else {
                result.response.categoryGroups = active_groups_categories;
				res.json(result);
            }
        });
    });
    //6
    router.get("/content/:grp/:cat/:count?", function(req, res) {
        var queryParams = {
            "grp": req.params.grp,
            "cat": req.params.cat,
            "count": req.params.count
        };

        var grp = parseInt(queryParams.grp) <= 1 ? 1 : parseInt(queryParams.grp);
        var cat = parseInt(queryParams.cat) <= 1 ? 1 : parseInt(queryParams.cat);
        var movies_query = groups_categories[grp - 1].categories[cat - 1].query;

        if (movies_query != undefined && movies_query != '') {
            var splitStr = movies_query.split("<replace>");
            var currDate = Math.floor(Date.now() / 1000).toString();
            var videotype = groups_categories[grp - 1].videoType;
            var cnt = parseInt(queryParams.count);
            var result = {
                "httpCode": 200,
                "response": {
                    "status": groups_categories[grp - 1].groupName + ' - ' + groups_categories[grp - 1].categories[cat - 1].categoryName + ' listed successfully.',
                    "message": []
                }
            };

			if (splitStr.length > 1) {
				if (cnt > 0 || !isNaN(cnt)) {
					splitStr[2] += ' LIMIT ' + cnt;
				} else {
					cnt = 0;
				}
				splitStr[1] = splitStr[1].indexOf("date") != -1 ? currDate : "";
				movies_query = splitStr.join("");
			}

            connection.query({sql:movies_query,timeout:7500}, function(err, rows) {
                if (err) {
                    if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(6.1)) {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "DB connection was lost. Please try again."
                        });
                    } else {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                        logger.error({
                            "id": 6,
                            "input": req.params,
                            "query": movies_query,
							"errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                    }
                } else if (rows != null && rows != undefined && rows.length > 0) {
                    if (cnt == 0 || cnt > rows.length) {
                        result.response["count"] = rows.length;
                    }
                    var image = videotype == 1 ? "video_images" : (grp == 5 ? "hdsong_images" : "serial");
                    for (var i = 0; i < rows.length; i++) {
                        result.response.message.push({
                            "videoId": rows[i].video_id,
                            "videoTitle": rows[i].video_title,
                            "deviceImage": "https://www.tentkotta.com/images/" + image + "/216_312/" + rows[i].video_key + "_1.jpg",
                            "webImage": "https://www.tentkotta.com/images/" + image + "/210_270/" + rows[i].video_key + "_1.jpg",
                            "tvImage": "https://www.tentkotta.com/images/" + image + "/1280_480/" + rows[i].video_key + "_1.jpg",
                            "videoType": rows[i].serial_type == 2 ? "3" : videotype
                        });
                    }
                    res.json(result);
                } else {
                    res.json({
                        "error": true,
                        "errorCode": 202,
                        "message": "Query did not return required results"
                    });
                    logger.error({
                        "id": 6,
                        "input": req.params,
                        "query": movies_query,
                        "message": "Query did not return required results"
                    });
                }
            });
        } else {
            res.json({
                "error": true,
                "errorCode": 204,
                "message": "Invalid/No Query stored for this group and category."
            });
            logger.error({
                "id": 6,
                "input": req.params,
                "message": "Invalid/No Query stored for this group and category."
            });
        }
    });
    //7
    router.get("/content/:grp/:cat/:id/:accessToken", function(req, res) {
        var queryParams = {
            "grp": req.params.grp,
            "cat": req.params.cat,
            "id": req.params.id,
            "token": req.params.accessToken
        };
        var tokenParams = Base64.decode(queryParams.token).split('|');

        if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
            res.json({
                "error": true,
                "errorCode": 201,
                "message": "Invalid Parameter(s): accessToken"
            });
        } else {
            var grp = parseInt(queryParams.grp);
            var cat = parseInt(queryParams.cat);
            var result = {
                "httpCode": 200,
                "response": {
                    "status": "Movie details found.",
					"subscriptionStatus": "",
                    "message": [],
                    "serialUrls": []
                }
            };

            if (cat < 0 || isNaN(cat) || grp < 0 || isNaN(grp)) {
                res.json({
                    "error": true,
                    "errorCode": 204,
                    "message": "Invalid Request. Please send valid Group and Category ID."
                });
                logger.error({
                    "id": 7,
                    "input": req.params,
                    "message": "Invalid Request. Please send valid Group and Category ID"
                });
            } else if (queryParams.id != undefined && grp == 0 && cat == 0) {
                var search_query = 'SELECT * FROM video WHERE video_id = ' + queryParams.id + '; SELECT IFNULL((SELECT user_watchlist_id FROM user_watchlists WHERE user_id = ' + tokenParams[0] + ' AND movies LIKE "%' + queryParams.id + '%"), 0) AS user_watchlist_id; SELECT IFNULL((SELECT rating FROM rating WHERE user_id = ' + tokenParams[0] + ' AND type_id = ' + queryParams.id + ' AND video_category = (SELECT language_id FROM video WHERE video_id = ' + queryParams.id + ')), 0) AS userRating; SELECT billing_date FROM subscription WHERE user_id = (SELECT user_id FROM api_access_tokens WHERE access_token = "' + req.params.accessToken + '") ORDER BY billing_date DESC LIMIT 1';
                connection.query({sql:search_query,timeout:7500}, function(err, rows) {
					if (err) {
                        if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(7.1)) {
                            res.json({
                                "error": true,
                                "errorCode": err.code,
                                "message": "DB connection was lost. Please try again."
                            });
                        } else {
                            res.json({
                                "error": true,
                                "errorCode": err.code,
                                "message": "Query did not return required results"
                            });
                            logger.error({
                                "id": 7,
                                "input": req.params,
                                "query": search_query,
								"errorCode": err.code,
                                "message": "Query did not return required results"
                            });
                        }
                    } else if (rows != undefined && rows.length == 4 && rows[3].length > 0 && rows[3][0].billing_date != undefined && rows[3][0].billing_date != '') {
						if (rows[0].length > 0 && rows[1].length > 0 && rows[2].length > 0) {
							result.response.message.push({
								"videoId": rows[0][0].video_id,
								"deviceImage": "https://www.tentkotta.com/images/video_images/216_312/" + rows[0][0].video_key + "_1.jpg",
								"webImage": "https://www.tentkotta.com/images/video_images/210_270/" + rows[0][0].video_key + "_1.jpg",
								"tvImage": "https://www.tentkotta.com/images/video_images/1280_480/" + rows[0][0].video_key + "_1.jpg",
								"profileImage": "https://www.tentkotta.com/images/Profile_Images/" + rows[0][0].language_id + "/" + rows[0][0].video_key + ".jpg",
								"videoTitle": rows[0][0].video_title,
								"subTitle": rows[0][0].sub_title,
								"stereoUrl": rows[0][0].mp3_url,
								"dolbyUrl": rows[0][0].mp4_url_five,
								"videoKey": rows[0][0].video_key,
								"videoDescription": rows[0][0].video_description,
								"videoPrice": rows[0][0].video_price,
								"embededCode": rows[0][0].embeded_code,
								"actors": rows[0][0].actors,
								"director": rows[0][0].director,
								"music": rows[0][0].music,
								"releaseYear": rows[0][0].release_year,
								"totalHours": rows[0][0].total_hours,
								"videoRating": rows[0][0].rating,
								"userRating": rows[2][0].userRating,
								"isOnWatchList": rows[1][0].user_watchlist_id
							});
							if (rows[3][0].billing_date < Math.floor(Date.now() / 1000)) {
								result.response.status += ". Warning: User's subscription has expired.";
								result.response.subscriptionStatus = "Cancelled";
								result.response.message[0].stereoUrl = "";
								result.response.message[0].dolbyUrl = "";
								result.response.message[0].videoKey = "";
								result.response.message[0].embededCode = "";
							} else {
								result.response.subscriptionStatus = "Active";
							}
							res.json(result);
						} else {
							res.json({
								"error": true,
								"errorCode": 202,
								"message": "Query did not return required results"
							});
							logger.error({
								"id": 7,
								"input": req.params,
								"query": search_query,
								"message": "Query did not return required results"
							});
						}
					} else {
						res.json({
							"error": true,
							"errorCode": 201,
							"message": "Invalid Parameter(s): accessToken"
						});
					}
                });
            } else {
                var movies_query = groups_categories[grp - 1].categories[cat - 1].query;
                if (movies_query != undefined && movies_query != '') {
                    var splitStr = movies_query.split("<replace>");
                    var replaceStr = "";
                    var currDate = Math.floor(Date.now() / 1000).toString();
                    var videotype = groups_categories[grp - 1].videoType;

                    if (splitStr.length > 1) {
						if (splitStr[1].indexOf("date") != -1) {
							if (queryParams.id != '' && queryParams.id != undefined) {
								splitStr[1] += queryParams.id;
							} else {
								splitStr[1] = "date";
							}
							replaceStr = splitStr[1].replace("date", currDate);
						} else if (queryParams.id != '' && queryParams.id != undefined) {
							replaceStr = splitStr[1] + queryParams.id;
						}
						splitStr[1] = replaceStr;
					}

                    movies_query = splitStr.join("") + '; SELECT IFNULL((SELECT user_watchlist_id FROM user_watchlists WHERE user_id = ' + tokenParams[0] + ' AND movies LIKE "%' + queryParams.id + '%"), 0) AS user_watchlist_id; SELECT IFNULL((SELECT rating FROM rating WHERE user_id = ' + tokenParams[0] + ' AND type_id = ' + queryParams.id + ' AND video_category = ' + grp + '), 0) AS userRating; SELECT billing_date FROM subscription WHERE user_id = (SELECT user_id FROM api_access_tokens WHERE access_token = "' + req.params.accessToken + '") ORDER BY billing_date DESC LIMIT 1';

                    if (videotype == 2) {
                        movies_query = movies_query + '; SELECT serial_name, episode_order, mp3_url FROM tv_serial WHERE main_serial_id = ' + queryParams.id + ' ORDER BY episode_order';
                    }

                    connection.query({sql:movies_query,timeout:7500}, function(err, rows) {
						if (err) {
                            if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(7.2)) {
                                res.json({
                                    "error": true,
                                    "errorCode": err.code,
                                    "message": "DB connection was lost. Please try again."
                                });
                            } else {
                                res.json({
                                    "error": true,
                                    "errorCode": err.code,
                                    "message": "Query did not return required results"
                                });
                                logger.error({
                                    "id": 7,
                                    "input": req.params,
                                    "query": movies_query,
									"errorCode": err.code,
                                    "message": "Query did not return required results"
                                });
                            }
                        } else if (rows != undefined && rows.length >= 4 && rows[3].length > 0 && rows[3][0].billing_date != undefined && rows[3][0].billing_date != '') {
							if (rows[0].length > 0 && rows[1].length > 0 && rows[2].length > 0) {
								var image = videotype == 1 ? "video_images" : (grp == 5 ? "hdsong_images" : "serial");

								if (videotype == 2 && rows[4].length > 0) {
									for (var i = 0; i < rows[4].length; i++) {
										result.response.serialUrls.push({
											"serialName": rows[4][i].serial_name,
											"episodeOrder": rows[4][i].episode_order,
											"Url": rows[4][i].mp3_url
										});
									}
								}

								result.response.message.push({
									"videoId": rows[0][0].video_id,
									"deviceImage": "https://www.tentkotta.com/images/" + image + "/216_312/" + rows[0][0].video_key + "_1.jpg",
									"webImage": "https://www.tentkotta.com/images/" + image + "/210_270/" + rows[0][0].video_key + "_1.jpg",
									"tvImage": "https://www.tentkotta.com/images/" + image + "/1280_480/" + rows[0][0].video_key + "_1.jpg",
									"profileImage": "https://www.tentkotta.com/images/Profile_Images/" + grp + "/" + rows[0][0].video_key + ".jpg",
									"videoTitle": rows[0][0].video_title,
									"subTitle": rows[0][0].sub_title,
									"stereoUrl": rows[0][0].mp3_url,
									"dolbyUrl": rows[0][0].mp4_url_five,
									"videoKey": rows[0][0].video_key,
									"videoDescription": rows[0][0].video_description,
									"videoPrice": rows[0][0].video_price,
									"embededCode": rows[0][0].embeded_code,
									"actors": rows[0][0].actors,
									"director": rows[0][0].director,
									"music": rows[0][0].music,
									"releaseYear": rows[0][0].release_year,
									"totalHours": rows[0][0].total_hours,
									"videoRating": rows[0][0].rating,
									"userRating": rows[2][0].userRating,
									"isOnWatchList": rows[1][0].user_watchlist_id
								});
								if (rows[3][0].billing_date < Math.floor(Date.now() / 1000)) {
									result.response.status += ". Warning: User's subscription has expired.";
									result.response.subscriptionStatus = "Cancelled";
									result.response.message[0].stereoUrl = "";
									result.response.message[0].dolbyUrl = "";
									result.response.message[0].videoKey = "";
									result.response.message[0].embededCode = "";
									if (videotype == 2 && rows[4].length > 0) {
										result.response.serialUrls[0].Url = "";
									}
								} else {
									result.response.subscriptionStatus = "Active";
								}
								res.json(result);
							} else {
								res.json({
									"error": true,
									"errorCode": 202,
									"message": "Query did not return required results"
								});
								logger.error({
									"id": 7,
									"input": req.params,
									"query": movies_query,
									"message": "Query did not return required results"
								});
							}
						} else {
							res.json({
								"error": true,
								"errorCode": 201,
								"message": "Invalid Parameter(s): accessToken"
							});
						}
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": 204,
                        "message": "Invalid/No Query stored for this group and category."
                    });
                    logger.error({
                        "id": 7,
                        "input": req.params,
                        "message": "Invalid/No Query stored for this group and category."
                    });
                }
            }
        }
    });
    //8
    router.get("/search/:name?", function(req, res) {
        var result = {
            "httpCode": 200,
            "response": {
                "status": "Search results",
                "count": 0,
                "message": []
            }
        };
        if (req.params.name != undefined) {
            var search_query = "SELECT video_id, video_title, video_key, language_id FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_title LIKE '%" + req.params.name + "%' AND category_status= 1 and  video_status = 1 and expiry_date>=" + Math.floor(Date.now() / 1000).toString() + " ORDER BY video_order ASC";
        } else {
            var search_query = "SELECT video_id, video_title, video_key, language_id FROM video WHERE video_status = 1 and expiry_date>=" + Math.floor(Date.now() / 1000).toString() + " ORDER BY video_order ASC";
        }
        connection.query({sql:search_query,timeout:7500}, function(err, rows) {
            if (err) {
                if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(8.1)) {
                    res.json({
                        "error": true,
                        "errorCode": err.code,
                        "message": "DB connection was lost. Please try again."
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": err.code,
                        "message": "Query did not return required results"
                    });
                    logger.error({
                        "id": 8,
                        "input": req.params,
                        "query": search_query,
						"errorCode": err.code,
                        "message": "Query did not return required results"
                    });
                }
            } else if (rows != undefined && rows.length > 0) {
                for (var i = 0; i < rows.length; i++) {
                    result.response.count = rows.length;
                    result.response.message.push({
                        "videoId": rows[i].video_id,
                        "videoTitle": rows[i].video_title,
                        "tvImage": "https://www.tentkotta.com/images/video_images/1280_480/" + rows[i].video_key + "_1.jpg",
                        "deviceImage": "https://www.tentkotta.com/images/video_images/216_312/" + rows[i].video_key + "_1.jpg",
                        "webImage": "https://www.tentkotta.com/images/video_images/210_270/" + rows[i].video_key + "_1.jpg",
                        "videoCategory": rows[i].language_id,
                        "videoType": 1
                    });
                }
                res.json(result);
            } else {
                res.json(result);
                logger.error({
                    "id": 8,
                    "input": req.params,
                    "query": search_query,
                    "message": "Query did not return required results"
                });
            }
        });
    });
    //9
    router.get("/user/movies/:accessToken", function(req, res) {
        var tokenParams = Base64.decode(req.params.accessToken).split('|');
        var result = {
            "httpCode": 200,
            "movies": []
        };
        if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
            res.json({
                "error": true,
                "errorCode": 201,
                "message": "Invalid Parameter(s): accessToken"
            });
        } else {
            var user_query = "SELECT * FROM user_movies where user_id = " + tokenParams[0];
            connection.query({sql:user_query,timeout:7500}, function(err, rows) {
                if (err) {
                    if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(9.1)) {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "DB connection was lost. Please try again."
                        });
                    } else {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                        logger.error({
                            "id": 9,
                            "input": req.params,
                            "query": user_query,
							"errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                    }
                } else if (rows != undefined && rows.length > 0) {
                    for (var i = 0; i < rows.length; i++) {
                        result.movies.push({
                            "videoId": rows[i].movie_id,
                            "videoRating": rows[i].rating,
                            "progress": rows[i].progress,
                            "lastUpdatedDate": rows[i].update_date
                        });
                    }
                    res.json(result);
                } else {
                    res.json({
                        "error": true,
                        "errorCode": 202,
                        "message": "Query did not return required results"
                    });
                    logger.error({
                        "id": 9,
                        "input": req.params,
                        "query": user_query,
                        "message": "Query did not return required results"
                    });
                }
            });
        }
    });
    //10
    router.post("/user/movies", function(req, res) {
        var tokenParams = Base64.decode(req.body.accessToken).split("|");
        if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
            res.json({
                "error": true,
                "errorCode": 201,
                "message": "Invalid Parameter(s): accessToken"
            });
        } else {
            var user_query = "SELECT * FROM user_movies where user_id = " + tokenParams[0];
            var movies = req.body.movies;
            var user_movies_query = '';
            connection.query({sql:user_query,timeout:7500}, function(err, rows) {
                if (err) {
                    if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(10.1)) {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "DB connection was lost. Please try again."
                        });
                    } else {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                        logger.error({
                            "id": 10,
                            "input": req.body,
                            "query": user_query,
							"errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                    }
                } else if (rows != undefined && rows.length > 0 && movies != null && movies != undefined && movies.length > 0) {
                    for (var i = 0; i < rows.length; i++) {
                        for (var j = 0; j < movies.length; j++) {
                            if (movies[j].movieId == rows[i].movie_id) {
                                user_movies_query += 'UPDATE user_movies SET rating = ' + movies[j].movieRating + ', progress = ' + movies[j].progress + ', update_date = ' + Math.floor(Date.now() / 1000) + ' WHERE user_movie_id = ' + rows[i].user_movie_id + '; ';
                                movies.splice(j, 1);
                            }
                        }
                    }
                }
                if (movies != null && movies != undefined && movies.length > 0) {
                    for (var j = 0; j < movies.length; j++) {
                        user_movies_query += 'INSERT INTO user_movies VALUES (NULL,' + tokenParams[0] + ', ' + movies[j].movieId + ', ' + movies[j].movieRating + ', ' + movies[j].progress + ', ' + Math.floor(Date.now() / 1000) + ');';
                    }
                }
                if (user_movies_query != '') {
                    connection.query({sql:user_movies_query,timeout:7500}, function(err, rows) {
                        if (err) {
                            if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(10.2)) {
                                res.json({
                                    "error": true,
                                    "errorCode": err.code,
                                    "message": "DB connection was lost. Please try again."
                                });
                            } else {
                                res.json({
                                    "error": true,
                                    "errorCode": err.code,
                                    "message": "Query did not return required results"
                                });
                                logger.error({
                                    "id": 10,
                                    "input": req.body,
                                    "query": user_movies_query,
									"errorCode": err.code,
                                    "message": "Query did not return required results"
                                });
                            }
                        } else if (rows.affectedRows != 0) {
                            res.json({
                                "httpCode": 200,
                                "response": {
                                    "status": "Movie Details Saved Successfully"
                                }
                            });
                        } else {
                            res.json({
                                "error": true,
                                "errorCode": 205,
                                "message": "Insert/Update statement failed. No rows affected."
                            });
                            logger.error({
                                "id": 10,
                                "input": req.body,
                                "message": "Insert/Update statement failed. No rows affected"
                            });
                        }
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": 203,
                        "message": "No details to save."
                    });
                    logger.error({
                        "id": 10,
                        "input": req.body,
                        "message": "No details to save"
                    });

                }
            });
        }
    });
    //11
    router.get("/user/watchlists/:accessToken", function(req, res) {
        var tokenParams = Base64.decode(req.params.accessToken).split('|');
        var result = {
            "httpCode": 200,
            "watchlists": []
        };
        if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
            res.json({
                "error": true,
                "errorCode": 201,
                "message": "Invalid Parameter(s): accessToken"
            });
        } else {
            var user_query = "SELECT * FROM user_watchlists WHERE user_id = " + tokenParams[0];
            connection.query({sql:user_query,timeout:7500}, function(err, rows) {
                if (err) {
                    if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(11.1)) {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "DB connection was lost. Please try again."
                        });
                    } else {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                        logger.error({
                            "id": 11,
                            "input": req.params,
                            "query": user_query,
							"errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                    }
                } else if (rows != undefined && rows.length > 0) {
                    var ids = [];
                    for (var i = 0; i < rows.length; i++) {
                        result.watchlists.push({
                            "watchlistId": rows[i].watchlist_id,
                            "watchlistName": rows[i].watchlist_name,
                            "count": 0,
                            "movies": []
                        });
                        ids.push(rows[i].movies);
                    }
                    async.each(ids, function(id, next) {
                        var movies_query = 'SELECT * FROM video WHERE video_id IN (' + id + ')';
                        connection.query({sql:movies_query,timeout:7500}, function(err, rows1) {
                            if (err) {
                                if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(11.2)) {
                                    res.json({
                                        "error": true,
                                        "errorCode": err.code,
                                        "message": "DB connection was lost. Please try again."
                                    });
                                } else {
                                    res.json({
                                        "error": true,
                                        "errorCode": err.code,
                                        "message": "Query did not return required results"
                                    });
                                    logger.error({
                                        "id": 11,
                                        "input": req.params,
                                        "query": movies_query,
										"errorCode": err.code,
                                        "message": "Query did not return required results"
                                    });
                                }
                            } else if (rows1 != undefined && rows1.length > 0) {
                                result.watchlists[ids.indexOf(id)].count = rows1.length;
                                for (var i = 0; i < rows1.length; i++) {
                                    result.watchlists[ids.indexOf(id)].movies.push({
                                        "videoId": rows1[i].video_id,
                                        "videoTitle": rows1[i].video_title,
										"videoCategory": rows1[i].language_id,
                                        "tvImage": "https://www.tentkotta.com/images/video_images/1280_480/" + rows1[i].video_key + "_1.jpg",
                                        "deviceImage": "https://www.tentkotta.com/images/video_images/216_312/" + rows1[i].video_key + "_1.jpg",
                                        "webImage": "https://www.tentkotta.com/images/video_images/210_270/" + rows1[i].video_key + "_1.jpg"
                                    });
                                }
                                res.json(result);
                            } else {
                                res.json({
                                    "error": true,
                                    "errorCode": 202,
                                    "message": "Query did not return required results"
                                });
                                logger.error({
                                    "id": 11,
                                    "input": req.params,
                                    "query": movies_query,
                                    "message": "Query did not return required results"
                                });
                            }
                            next();
                        });
                    }, function(err) {
                        if (err)
                            return next(err);
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": 202,
                        "message": "Query did not return required results"
                    });
                }
            });
        }
    });
    //11-V2
    router.get("/user/watchlistsV2/:accessToken", function(req, res) {
        var tokenParams = Base64.decode(req.params.accessToken).split('|');
        var result = {
            "httpCode": 200,
            "watchlists": []
        };
        if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
            res.json({
                "error": true,
                "errorCode": 201,
                "message": "Invalid Parameter(s): accessToken"
            });
        } else {
            var user_query = "SELECT * FROM user_watchlists WHERE user_id = " + tokenParams[0];
            connection.query({sql:user_query,timeout:7500}, function(err, rows) {
                if (err) {
                    if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(11.1)) {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "DB connection was lost. Please try again."
                        });
                    } else {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                        logger.error({
                            "id": 11,
                            "input": req.params,
                            "query": user_query,
							"errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                    }
                } else if (rows != undefined && rows.length > 0) {
                    var ids = [];
                    for (var i = 0; i < rows.length; i++) {
                        result.watchlists.push({
                            "watchlistId": rows[i].watchlist_id,
                            "watchlistName": rows[i].watchlist_name,
                            "count": 0,
                            "movies": []
                        });
                        ids.push(rows[i].movies);
                    }
                    async.each(ids, function(id, next) {
                        var movies_query = 'SELECT * FROM video WHERE video_id IN (' + id + ')';
                        connection.query({sql:movies_query,timeout:7500}, function(err, rows1) {
                            if (err) {
                                if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(11.2)) {
                                    res.json({
                                        "error": true,
                                        "errorCode": err.code,
                                        "message": "DB connection was lost. Please try again."
                                    });
                                } else {
                                    res.json({
                                        "error": true,
                                        "errorCode": err.code,
                                        "message": "Query did not return required results"
                                    });
                                    logger.error({
                                        "id": 11,
                                        "input": req.params,
                                        "query": movies_query,
										"errorCode": err.code,
                                        "message": "Query did not return required results"
                                    });
                                }
                            } else if (rows1 != undefined && rows1.length > 0) {
                                result.watchlists[ids.indexOf(id)].count = rows1.length;
                                for (var i = 0; i < rows1.length; i++) {
                                    result.watchlists[ids.indexOf(id)].movies.push({
                                        "videoId": rows1[i].video_id,
                                        "videoTitle": rows1[i].video_title,
										"videoCategory": rows1[i].language_id,
                                        "tvImage": "https://www.tentkotta.com/images/video_images/1280_480/" + rows1[i].video_key + "_1.jpg",
                                        "deviceImage": "https://www.tentkotta.com/images/video_images/216_312/" + rows1[i].video_key + "_1.jpg",
                                        "webImage": "https://www.tentkotta.com/images/video_images/210_270/" + rows1[i].video_key + "_1.jpg"
                                    });
                                }
                                res.json(result);
                            } else {
                                res.json({
                                    "error": true,
                                    "errorCode": 202,
                                    "message": "Query did not return required results"
                                });
                                logger.error({
                                    "id": 11,
                                    "input": req.params,
                                    "query": movies_query,
                                    "message": "Query did not return required results"
                                });
                            }
                            next();
                        });
                    }, function(err) {
                        if (err)
                            return next(err);
                    });
                } else {
                    res.json(result);
                }
            });
        }
    });
    //12
    router.post("/user/watchlists", function(req, res) {
        var tokenParams = Base64.decode(req.body.accessToken).split("|");
        if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
            res.json({
                "error": true,
                "errorCode": 201,
                "message": "Invalid Parameter(s): accessToken"
            });
        } else {
            var user_query = "SELECT * FROM user_watchlists WHERE user_id = " + tokenParams[0];
            var user_watchlists_query = '';
            var isEdited = false;
            connection.query({sql:user_query,timeout:7500}, function(err, rows) {
                if (err) {
                    if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(12.1)) {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "DB connection was lost. Please try again."
                        });
                    } else {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                        logger.error({
                            "id": 12,
                            "input": req.body,
                            "query": user_query,
							"errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                    }
                } else if (rows != undefined && rows.length > 0) {
                    for (var i = 0;
                        (!isEdited && i < rows.length); i++) {
                        if (rows[i].watchlist_id == req.body.watchlistId) {
                            if (req.body.isAddition == 1 && rows[i].movies.indexOf(req.body.movies) == -1) {
                                user_watchlists_query += 'UPDATE user_watchlists SET movies = "' + rows[i].movies + ',' + req.body.movies + '", update_date = ' + Math.floor(Date.now() / 1000) + ' WHERE user_watchlist_id = ' + rows[i].user_watchlist_id + '; ';
                            } else if (req.body.isAddition != 1) {
                                var row_movies = rows[i].movies.split(',');
                                row_movies.splice(row_movies.indexOf(req.body.movies), 1);
                                if (row_movies.length > 0) {
                                    user_watchlists_query += 'UPDATE user_watchlists SET movies = "' + row_movies.join(',') + '", update_date = ' + Math.floor(Date.now() / 1000) + ' WHERE user_watchlist_id = ' + rows[i].user_watchlist_id + '; ';
                                } else {
                                    user_watchlists_query += "DELETE FROM user_watchlists WHERE user_id=" + tokenParams[0] + ' AND watchlist_id IN (' + req.body.watchlistId + ');';
                                }
                            }
                            isEdited = true;
                        }
                    }
                }
                if (!isEdited && req.body.isAddition == 1) {
                    user_watchlists_query += 'INSERT INTO user_watchlists VALUES (NULL,' + tokenParams[0] + ', ' + req.body.watchlistId + ', "' + req.body.watchlistName + '", "' + req.body.movies + '", ' + Math.floor(Date.now() / 1000) + ');';
                }
                if (user_watchlists_query != '') {
                    connection.query({sql:user_watchlists_query,timeout:7500}, function(err, rows1) {
                        if (err) {
                            if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(12.2)) {
                                res.json({
                                    "error": true,
                                    "errorCode": err.code,
                                    "message": "DB connection was lost. Please try again."
                                });
                            } else {
                                res.json({
                                    "error": true,
                                    "errorCode": err.code,
                                    "message": "Query did not return required results"
                                });
                                logger.error({
                                    "id": 12,
                                    "input": req.body,
                                    "query": user_watchlists_query,
									"errorCode": err.code,
                                    "message": "Query did not return required results"
                                });
                            }
                        } else if (rows1.affectedRows != 0) {
                            res.json({
                                "httpCode": 200,
                                "response": {
                                    "status": "watchlist Details Saved Successfully"
                                }
                            });
                        } else {
                            res.json({
                                "error": true,
                                "errorCode": 205,
                                "message": "Insert/Update statement failed. No rows affected."
                            });
                            logger.error({
                                "id": 12,
                                "input": req.body,
                                "message": "Insert/Update statement failed. No rows affected"
                            });
                        }
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": 203,
                        "message": "No details to save."
                    });
                    logger.error({
                        "id": 12,
                        "input": req.body,
                        "message": "No details to save"
                    });
                }
            });
        }
    });
    //13
    router.delete("/user/watchlists", function(req, res) {
        var tokenParams = Base64.decode(req.body.accessToken).split("|");
        if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
            res.json({
                "error": true,
                "errorCode": 201,
                "message": "Invalid Parameter(s): accessToken"
            });
        } else {
            var user_watchlists_query = "DELETE FROM user_watchlists WHERE user_id=" + tokenParams[0] + ' AND watchlist_id IN (' + req.body.watchlistId + ');';
            connection.query({sql:user_watchlists_query,timeout:7500}, function(err, rows) {
                if (err) {
                    if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(13.1)) {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "DB connection was lost. Please try again."
                        });
                    } else {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                        logger.error({
                            "id": 13,
                            "input": req.body,
                            "query": user_watchlists_query,
							"errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                    }
                } else if (rows.affectedRows != 0) {
                    res.json({
                        "httpCode": 200,
                        "response": {
                            "status": "Watchlist Deleted Successfully"
                        }
                    });
                } else {
                    res.json({
                        "error": true,
                        "errorCode": 205,
                        "message": "Insert/Update statement failed. No rows affected."
                    });
                    logger.error({
                        "id": 13,
                        "input": req.body,
                        "message": "Insert/Update statement failed. No rows affected"
                    });
                }
            });
        }
    });
    //14
    router.post("/user/rating", function(req, res) {
		var tokenParams = Base64.decode(req.body.accessToken).split("|");
		if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
			res.json({
				"error": true,
				"errorCode": 201,
				"message": "Invalid Parameter(s): accessToken"
			});
		} else {
			var rating_query = "SELECT * FROM rating where user_id = " + tokenParams[0] + " and type_id=" + req.body.videoId + " and video_category=" + req.body.videoCategory + "";
			var videoid = req.body.videoId;
			var rating = req.body.rating;
			var user_rating_query = '';
			var overall_rating = '';
			var update_query = '';
			connection.query({sql:rating_query,timeout:7500}, function(err, rows) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(14.1)) {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "DB connection was lost. Please try again."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Query did not return required results"
						});
						logger.error({
							"id": 14,
							"input": req.body,
							"query": rating_query,
							"errorCode": err.code,
							"message": "Query did not return required results"
						});
					}
				} else if (rows != null && rows != undefined && rows.length > 0 && videoid != null && rating != null) {

					user_rating_query += 'UPDATE rating SET rating = ' + req.body.rating + ' WHERE user_id = ' + tokenParams[0] + ' and type_id=' + req.body.videoId + ' and video_category=' + req.body.videoCategory + '';
				}
				if (videoid != null && rating != null && user_rating_query == '') {
					user_rating_query += 'INSERT INTO rating VALUES (NULL,' + req.body.rating + ',' + req.body.videoId + ', 0, ' + tokenParams[0] + ',' + req.body.videoCategory + ')';
				}
				if (user_rating_query != '') {
					connection.query({sql:user_rating_query,timeout:7500}, function(err, rows) {
						if (err) {
							if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(14.2)) {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "DB connection was lost. Please try again."
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Query did not return required results"
								});
								logger.error({
									"id": 14,
									"input": req.body,
									"query": user_rating_query,
									"errorCode": err.code,
									"message": "Query did not return required results"
								});
							}
						} else if (rows.affectedRows != 0) {
							overall_rating += "select round(sum(rating)/count(*),1) as rating from rating where type_id=" + req.body.videoId + " and video_category=" + req.body.videoCategory + "";
							if (overall_rating != '') {
								connection.query({sql:overall_rating,timeout:7500}, function(err, rows) {
									if (err) {
										if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(14.3)) {
											res.json({
												"error": true,
												"errorCode": err.code,
												"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
											});
										} else {
											res.json({
												"error": true,
												"errorCode": err.code,
												"message": "Query did not return required results"
											});
											logger.error({
												"id": 14,
												"input": req.body,
												"query": overall_rating,
												"errorCode": err.code,
												"message": "Query did not return required results"
											});
										}
									} else if (rows != null && rows != undefined && rows.length > 0) {
										if (req.body.videoCategory == 0 || req.body.videoCategory == 1 || req.body.videoCategory == 2) {
											update_query += "update video set rating=" + rows[0].rating + " where video_id=" + req.body.videoId + "";
										} else if (req.body.videoCategory == 3 || req.body.videoCategory == 4) {
											update_query += "update tv_serial set rating=" + rows[0].rating + " where serial_id=" + req.body.videoId + "";
										} else if (req.body.videoCategory == 5) {
											update_query += "update movie_song set rating=" + rows[0].rating + " where movie_id=" + req.body.videoId + "";
										}
										if (update_query != '') {
											connection.query({sql:update_query,timeout:7500}, function(err, rows) {
												if (err) {
													if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(14.4)) {
														res.json({
															"error": true,
															"errorCode": err.code,
															"message": "DB connection was lost. Please try again."
														});
													} else {
														res.json({
															"error": true,
															"errorCode": err.code,
															"message": "Query did not return required results"
														});
														logger.error({
															"id": 14,
															"input": req.body,
															"query": update_query,
															"errorCode": err.code,
															"message": "Query did not return required results"
														});
													}
												} else if (rows.affectedRows != 0) {
													res.json({
														"httpCode": 200,
														"response": {
															"status": "rating Details Saved Successfully"
														}
													});
												} else {
													res.json({
														"error": true,
														"errorCode": 205,
														"message": "Insert/Update statement failed. No rows affected."
													});
													logger.error({
														"id": 14,
														"input": req.body,
														"query": update_query,
														"message": "Update statement failed. No rows affected"
													});
												}
											});
										}
									} else {
										res.json({
											"error": true,
											"errorCode": 205,
											"message": "Insert/Update statement failed. No rows affected."
										});
										logger.error({
											"id": 14,
											"input": req.body,
											"message": "Insert/Update statement failed. No rows affected"
										});
									}
								});
							} else {
								res.json({
									"error": true,
									"errorCode": 203,
									"message": "No details to save."
								});
								logger.error({
									"id": 14,
									"input": req.body,
									"message": "No details to save"
								});
							}
						}
					});
				}
			});
		}
	});
    //15
	router.post("/user/activity", function(req, res) {
		var tokenParams = Base64.decode(req.body.accessToken).split("|");
        if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
            res.json({
                "error": true,
                "errorCode": 201,
                "message": "Invalid Parameter(s): accessToken"
            });
        } else {
            var user_query = "SELECT * FROM api_activity_log WHERE user_id = " + tokenParams[0] + " AND video_id = " + req.body.videoId + " AND video_category = " + req.body.videoCategory + " AND device_id = '" + tokenParams[1] + "' AND device_type = '" + tokenParams[2] + "'";
            var user_activity_query = '';
            connection.query({sql:user_query,timeout:7500}, function(err, rows) {
                if (err) {
                    if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(15.1)) {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "DB connection was lost. Please try again."
                        });
                    } else {
                        res.json({
                            "error": true,
                            "errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                        logger.error({
                            "id": 15,
                            "input": req.body,
                            "query": user_query,
							"errorCode": err.code,
                            "message": "Query did not return required results"
                        });
                    }
                } else if (rows != undefined && rows.length > 0) {
                    user_activity_query += 'UPDATE api_activity_log SET is_watching = "' + req.body.isWatching + '", progress = "' + req.body.progress + '", updated_date = ' + Math.floor(Date.now() / 1000) + ' WHERE activity_id = ' + rows[0].activity_id;
                } else {
                    user_activity_query += 'INSERT INTO api_activity_log VALUES (NULL,' + tokenParams[0] + ', ' + req.body.videoId + ', ' + req.body.videoCategory + ', "' + req.body.isWatching + '", "' + req.body.progress + '", "' + tokenParams[1] + '", "' + tokenParams[2] + '", ' + Math.floor(Date.now() / 1000) + ', ' + Math.floor(Date.now() / 1000) + ')';
                }

				if (user_activity_query != '') {
                    connection.query({sql:user_activity_query,timeout:7500}, function(err, rows1) {
                        if (err) {
                            if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(15.2)) {
                                res.json({
                                    "error": true,
                                    "errorCode": err.code,
                                    "message": "DB connection was lost. Please try again."
                                });
                            } else {
                                res.json({
                                    "error": true,
                                    "errorCode": err.code,
                                    "message": "Query did not return required results"
                                });
                                logger.error({
                                    "id": 15,
                                    "input": req.body,
                                    "query": user_activity_query,
									"errorCode": err.code,
                                    "message": "Query did not return required results"
                                });
                            }
                        } else if (rows1.affectedRows != 0) {
                            res.json({
                                "httpCode": 200,
                                "response": {
                                    "status": "User Activity Saved Successfully"
                                }
                            });
                        } else {
                            res.json({
                                "error": true,
                                "errorCode": 205,
                                "message": "Insert/Update statement failed. No rows affected."
                            });
                            logger.error({
                                "id": 15,
                                "input": req.body,
                                "message": "Insert/Update statement failed. No rows affected"
                            });
                        }
                    });
                } else {
                    logger.error({
                        "id": 15,
                        "input": req.body,
                        "message": "No details to save"
                    });
                }
            });
        }
    });
	//16
	router.get("/images/topshelf", function(req, res) {
		fs = require('fs')
		fs.readFile('./utils/topshelf-images.json', 'utf8', function (err, data) {
			if (err) {
				res.json({
					"error": true,
					"errorCode": 204,
					"message": "Unable to read file to get topshelf images. Error: " + err
				});
				logger.error({
					"id": 16,
					"message": "Unable to read file to get topshelf images."
				});
			} else {
				res.json(JSON.parse(data));
			}
		});
	});
	//17
	router.post("/user/forgotPwd", function(req, res) {
		var emailId = req.body.email;
		var email_query = "SELECT user_id, firstname, lastname, email, password, user_status FROM users WHERE email =  '" + emailId + "' limit 1; SELECT smtp_host, smtp_username, smtp_password FROM email_settings";
		connection.query({sql:email_query,timeout:7500}, function(err, rows) {
			if (err) {
				if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(17.1)) {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "DB connection was lost. Please try again."
					});
				} else {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Query did not return required results"
					});
					logger.error({
						"id": 17,
						"input": req.body,
						"query": email_query,
						"errorCode": err.code,
						"message": "Query did not return required results"
					});
				}
			} else if (rows != undefined && rows.length == 2 && rows[0].length > 0 && rows[1].length > 0) {
				var pwd = "";
				var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				for (var i = 0; i < 7; i++) {
					pwd += charset.charAt(Math.floor(Math.random() * charset.length));
				}
				var part = "";
				if (rows[0][0].user_status == 1) {
					part = 'We have successfully processed this request and your temporary password is:\n' + pwd;
				} else {
					part = 'We regret to inform you that your account has been blocked and your request has been denied.';
				}
				var name = rows[0][0].firstname == rows[0][0].lastname ? rows[0][0].firstname : rows[0][0].firstname + ' ' + rows[0][0].lastname;
				var message = 'Hi ' + name + ',\n\nWe received a request to change your Tentkotta.com account\'s password.\n\n' + part + '\n\nPlease contact Tentkotta support for further assistance or information.\n\nThanks,\nTentkotta Support Team.'
				mailer.send({
					host: rows[1][0].smtp_host,
					to: emailId,
					from: rows[1][0].smtp_username,
					subject: "Reset password request for Tentkotta.com",
					body: message,
					authentication: "login",
					username: rows[1][0].smtp_username,
					password: rows[1][0].smtp_password
				},
				function(err, result) {
					if (err) {
						res.json({
							"error": true,
							"errorCode": 203,
							"message": "Sending Email Failed."
						});
						logger.error({
							"id": 17,
							"input": req.body,
							"message": "Sending Email Failed"
						});
					} else {
						var update_password = "UPDATE users SET password = '" + md5(pwd) + "' WHERE email = '" + emailId + "'; INSERT INTO ipn_email_log VALUES (NULL, " + rows[0][0].user_id + ", '" + emailId + "', 'PWD Change: " + rows[0][0].password + "', " + Math.floor(Date.now() / 1000).toString() + ")";
						connection.query({sql:update_password,timeout:7500}, function(err, rows1) {
							if (err) {
								if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' && self.handleDisconnect(17.2)) {
									res.json({
										"error": true,
										"errorCode": err.code,
										"message": "DB connection was lost. Please try again."
									});
								} else {
									res.json({
										"error": true,
										"errorCode": err.code,
										"message": "Query did not return required results"
									});
									logger.error({
										"id": 17,
										"input": req.body,
										"query": update_password,
										"errorCode": err.code,
										"message": "Query did not return required results"
									});
								}
							} else if (rows1.affectedRows != 0) {
								res.json({
									"httpCode": 200,
									"response": {
										"Email status": "Email sent Successfully"
									}
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Updating Password failed"
								});
								logger.error({
									"id": 17,
									"input": req.body,
									"query": update_password,
									"errorCode": err.code,
									"message": "Error while resetting users password"
								});
							}
						});
					}
				});
			} else {
				var message = "Query did not return required result.";
				if (rows[0].length <= 0) {
					message = "Invalid parameter(s): EmailId.";
				} else if (rows[1].length <= 0) {
					message = "Unable to fetch email settings.";
				}
				res.json({
					"error": true,
					"errorCode": 203,
					"message": message
				});
				logger.error({
					"id": 17,
					"input": req.body,
					"message": message
				});
			}
		});
	});
}

module.exports = REST_ROUTER;