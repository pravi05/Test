var mysql = require("mysql");
var async = require('async');
var http = require('http');

var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(r){var t,e,o,a,h,n,c,d="",C=0;for(r=Base64._utf8_encode(r);C<r.length;)t=r.charCodeAt(C++),e=r.charCodeAt(C++),o=r.charCodeAt(C++),a=t>>2,h=(3&t)<<4|e>>4,n=(15&e)<<2|o>>6,c=63&o,isNaN(e)?n=c=64:isNaN(o)&&(c=64),d=d+this._keyStr.charAt(a)+this._keyStr.charAt(h)+this._keyStr.charAt(n)+this._keyStr.charAt(c);return d},decode:function(r){var t,e,o,a,h,n,c,d="",C=0;for(r=r.replace(/[^A-Za-z0-9\+\/\=]/g,"");C<r.length;)a=this._keyStr.indexOf(r.charAt(C++)),h=this._keyStr.indexOf(r.charAt(C++)),n=this._keyStr.indexOf(r.charAt(C++)),c=this._keyStr.indexOf(r.charAt(C++)),t=a<<2|h>>4,e=(15&h)<<4|n>>2,o=(3&n)<<6|c,d+=String.fromCharCode(t),64!=n&&(d+=String.fromCharCode(e)),64!=c&&(d+=String.fromCharCode(o));return d=Base64._utf8_decode(d)},_utf8_encode:function(r){r=r.replace(/\r\n/g,"\n");for(var t="",e=0;e<r.length;e++){var o=r.charCodeAt(e);128>o?t+=String.fromCharCode(o):o>127&&2048>o?(t+=String.fromCharCode(o>>6|192),t+=String.fromCharCode(63&o|128)):(t+=String.fromCharCode(o>>12|224),t+=String.fromCharCode(o>>6&63|128),t+=String.fromCharCode(63&o|128))}return t},_utf8_decode:function(r){for(var t="",e=0,o=c1=c2=0;e<r.length;)o=r.charCodeAt(e),128>o?(t+=String.fromCharCode(o),e++):o>191&&224>o?(c2=r.charCodeAt(e+1),t+=String.fromCharCode((31&o)<<6|63&c2),e+=2):(c2=r.charCodeAt(e+1),c3=r.charCodeAt(e+2),t+=String.fromCharCode((15&o)<<12|(63&c2)<<6|63&c3),e+=3);return t}};

function REST_ROUTER(router, connection, md5) {
	var self = this;
	self.handleRoutes(router, connection, md5);
}

REST_ROUTER.prototype.handleRoutes = function(router, connection, md5) {
	var self = this;

	self.handleDisconnect = function () {
		connection = mysql.createConnection(connection.config);
		connection.connect(function(err) {
			if(err) {
				console.log('Error while connecting to DB: ', err);
				setTimeout(self.handleDisconnect, 2000);
			}
		});
		connection.on('error', function(err) {
			console.log('DB Error: ', err);
			if(err.code == 'PROTOCOL_CONNECTION_LOST' || err.code == 'ECONNREFUSED') {
				setTimeout(self.handleDisconnect, 2000);
			} else {
				throw err;
			}
		});
	}

	self.insertAccessToken = function (deviceId, deviceType, reqHostname, reqPort, user_id, accessToken, profileStatus) {
		var postData = JSON.stringify({
		  'deviceId' : deviceId,
		  'deviceType' : deviceType
		});
		var options = {
		  hostname: reqHostname,
		  port: reqPort,
		  path: '/tkapi/v1/pin',
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/JSON',
			'Content-Length': postData.length
		  }
		};
		var req = http.request(options, function(res) {
		  res.setEncoding('utf8');
		  res.on('data', function(chunk) {
			var response = JSON.parse(chunk);
			if (response != undefined && response.error == undefined && response.httpCode == 200) {
				var update_query = "UPDATE api_access_security SET user_id = " + user_id + ", access_token = '" + accessToken
					+ "', access_token_status = '" + profileStatus + "' WHERE security_code = '" + response.response.securityCode + "'";
				connection.query(update_query, function(err) {
					if (err) {
						if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
							self.handleDisconnect();
							self.insertAccessToken(deviceId, deviceType, reqHostname, reqPort, user_id, accessToken, profileStatus);
						} else {
							console.log(JSON.stringify({
								"error": true,
								"errorCode": err.code,
								"message": "Error executing MySQL query: " + update_query
							}));
						}
					}
				});
			} else {
				console.log('Problem with response: ' + chunk);
			}
		  });
		});
		req.on('error', function(e) {
		  console.log('Problem with request: ' + e.message);
		});
		req.write(postData);
		req.end();
	}
	
	router.get("/", function(req, res) {
		res.json({
			"Message": "APIs for Tentkotta Website: https://www.tentkotta.com. To be used by various apps and integration along with Website."
		});
	});

	router.post("/pin", function(req, res) {
		var deviceTypes = ["AppleTV", "AmazonTV", "SmartTV", "SmartPhone", "TizenTV", "Tablet", "RokuTV", "iPhone", "iPad", "Laptop"];
		var appendValues = ["A", "M", "S", "D", "T", "B", "R", "I", "P", "L"];
		var index = deviceTypes.indexOf(req.body.deviceType);
		if (index > -1) {
			var security_query = "SELECT * FROM security_codes WHERE used = 0 LIMIT 1";
			connection.query(security_query, function(err, rows) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
						self.handleDisconnect();
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Error executing MySQL query: " + security_query
						});
					}
				} else if (rows != null && rows.length > 0) {
					var pin_value = appendValues[index] + rows[0].code;
					var insert_update_query = "UPDATE security_codes SET used = 1 WHERE id = " + rows[0].id
						+ "; INSERT INTO api_access_security (security_code, creation_date, device_id, device_type) VALUES ('"
						+ pin_value + "'," + Math.floor(Date.now() / 1000).toString() + ",'" + req.body.deviceId + "','" + req.body.deviceType + "')";
					connection.query(insert_update_query, function(err, rows2) {
						if (err) {
							if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
								self.handleDisconnect();
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Error executing MySQL query: " + insert_update_query
								});
							}
						} else {
							res.json({
								"httpCode": 200,
								"response": {
									"securityCode": pin_value,
									"expireTime": "120"
								}
							});
						}
					});
				}
			});
		} else {
			res.json({
				"error": true,
				"errorCode": 201,
				"message": "Invalid Parameter(s): deviceType"
			});
		}
	});

	router.post("/accessToken", function(req, res) {
		var subscription_token_query = "SELECT profile_status FROM subscription WHERE user_id = " + req.body.userId
			+ " ORDER BY subscription_id DESC LIMIT 1; SELECT device_id, device_type FROM api_access_security WHERE security_code = '" + req.body.pin + "'";
		connection.query(subscription_token_query, function(err, rows) {
			if (err) {
				if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
					self.handleDisconnect();
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
					});
				} else {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Error executing MySQL query: " + subscription_token_query
					});
				}
			} else if (rows != null && rows.length == 2 && rows[0].length > 0 && rows[1].length > 0) {
				var access_token = Base64.encode((req.body.userId + "|" + rows[1][0].device_id + "|" + rows[1][0].device_type).toString());
				var update_query = "UPDATE api_access_security SET user_id = " + req.body.userId + ", access_token = '" + access_token
					+ "', access_token_status = '" + rows[0][0].profile_status + "' WHERE security_code = '" + req.body.pin + "'";
				connection.query(update_query, function(err) {
					if (err) {
						if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
							self.handleDisconnect();
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
							});
						} else {
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Error executing MySQL query: " + update_query
							});
						}
					} else {
						res.json({
							"httpCode": 200,
							"response": {
								"message": "Successful",
								"accessToken": access_token
							}
						});
					}
				});
			} else {
				res.json({
					"error": true,
					"errorCode": 201,
					"message": "Invalid Parameter(s): userId/pin"
				});
			}
		});

	});

	router.get("/accessToken/:pinValue", function(req, res) {
		var access_token_query = "SELECT access_token, access_token_status FROM api_access_security WHERE security_code = '" + req.params.pinValue + "'";
		connection.query(access_token_query, function(err, rows) {
			if (err) {
				if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
					self.handleDisconnect();
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
					});
				} else {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Error executing MySQL query: " + access_token_query
					});
				}
			} else if (rows != null && rows.length > 0) {
				res.json({
					"httpCode": 200,
					"response": {
						"accessToken": rows[0].access_token,
						"accessTokenStatus": rows[0].access_token_status
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

	router.post("/user/login", function(req, res) {
		var user_query = "SELECT user_id, firstname, lastname, user_status FROM users WHERE email = '" + req.body.email;
		if (req.body.facebookAccessToken == "" && req.body.password != "") {
			user_query += "' AND password = '" + md5(req.body.password) + "'";
		} else if (req.body.facebookAccessToken != "" && req.body.password == "") {
			user_query += "' AND fb_session_key = '" + req.body.facebookAccessToken + "'";
		} else {
			user_query = "";
			res.json({
				"error": true,
				"errorCode": 201,
				"message": "Invalid Parameter(s): password/facebookAccessToken"
			});
		}
		if (user_query != "") {
			connection.query(user_query, function(err, rows) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
						self.handleDisconnect();
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Error executing MySQL query: " + user_query
						});
					}
				} else if (rows == null || rows.length == 0) {
					res.json({
						"error": true,
						"errorCode": 201,
						"message": "Invalid Parameter(s): email/password/facebookAccessToken"
					});
				} else {
					var user_id = rows[0].user_id;
					var user_status = rows[0].user_status == 1 ? "Active" : "Inactive";
					var deviceId = req.body.deviceId;
					var deviceType = req.body.deviceType;
					var reqHostname = req.get('host').split(":")[0];
					var reqPort = req.get('host').split(":")[1];

					var subscription_query = "SELECT profile_status FROM subscription WHERE user_id = " + user_id
						+ " ORDER BY subscription_id DESC LIMIT 1; SELECT access_token, access_token_status FROM api_access_security WHERE user_id = "
						+ user_id + " AND device_id = " + deviceId + " AND device_type = '" + deviceType + "'";
					connection.query(subscription_query, function(err, rows1) {
						if (err) {
							if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
								self.handleDisconnect();
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Error executing MySQL query: " + subscription_query
								});
							}
						} else {
							if (rows1.length == 2 && rows1[1].length > 0 && rows1[1][0].access_token != undefined) {
								res.json({
									"name": rows[0].firstname + " " + rows[0].lastname,
									"userStatus": user_status,
									"accessToken": rows1[1][0].access_token,
									"accessTokenStatus": rows1[1][0].access_token_status
								});
							} else if (rows1.length == 2 && rows1[0].length > 0 && rows1[0][0].profile_status != undefined) {
								var accessToken = Base64.encode((user_id + "|" + deviceId + "|" + deviceType).toString());
								res.json({
									"name": rows[0].firstname + " " + rows[0].lastname,
									"userStatus": user_status,
									"accessToken": accessToken,
									"accessTokenStatus": rows1[0][0].profile_status
								});
								self.insertAccessToken(deviceId, deviceType, reqHostname, reqPort, user_id, accessToken, rows1[0][0].profile_status);
							} else {
								res.json({
									"name": rows[0].firstname + " " + rows[0].lastname,
									"userStatus": user_status,
									"accessToken": "",
									"accessTokenStatus": ""
								});
							}
						}
					});
				}
			});
		}
	});
	
	router.get("/categories/:accessToken", function(req, res) {
		var result = {
			"httpCode": 200,
			"response": {
				"status": "Groups and Categories listed successfully",
				"categoryGroups": []
			}
		};
		var access_query = "SELECT * FROM api_access_security WHERE access_token = '" + req.params.accessToken + "'";
		connection.query(access_query, function(err, rows1) {
			if (err) {
				if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
					self.handleDisconnect();
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
					});
				} else {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Error executing MySQL query: " + access_query
					});
				}
			} else if (rows1 != null && rows1 != undefined && rows1.length > 0) {
				if (rows1[0].access_token_status == "Active") {
					var group_query = 'SELECT DISTINCT group_id, group_name, group_order, group_icon_selected, group_icon_unselected, group_icon_hover FROM groups_categories';
					connection.query(group_query, function(err, rows) {
						if (err) {
							if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
								self.handleDisconnect();
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Error executing MySQL query: " + group_query
								});
							}
						} else if (rows != null && rows != undefined && rows.length > 0) {
							var ids = [];
							for (var i = 0; i < rows.length; i++) {
								result.response.categoryGroups.push({
									"groupName": rows[i].group_name,
									"groupID": rows[i].group_id,
									"groupOrder": rows[i].group_order,
									"groupIconSelected": rows[i].group_icon_selected,
									"groupIconUnselected": rows[i].group_icon_unselected,
									"group_icon_hover": rows[i].group_icon_hover,
									"categories": []
								});
								ids.push(rows[i].group_id);
							}
							async.each(ids, function(id, next) {
								var category_query = 'SELECT DISTINCT group_id, category_id, category_name, category_order FROM groups_categories WHERE group_id = ' + id;
								connection.query(category_query, function(err, rows2, callback) {
									if (err) {
										if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
											self.handleDisconnect();
											res.json({
												"error": true,
												"errorCode": err.code,
												"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
											});
										} else {
											res.json({
												"error": true,
												"errorCode": err.code,
												"message": "Error executing MySQL query: " + category_query
											});
										}
									} else if (rows2 != null && rows2 != undefined && rows2.length > 0) {
										for (var j = 0; j < rows2.length; j++) {
											result.response.categoryGroups[ids.indexOf(id)].categories.push({
												"categoryName": rows2[j].category_name,
												"categoryID": rows2[j].category_id,
												"categoryOrder": rows2[j].category_order
											});
										}
									}
									next();
								});
							}, function(err) {
								if (err)
									return next(err);

								res.json(result);
							});
						} else {
							res.json({
								"error": true,
								"errorCode": 202,
								"message": "Query returned unexpected details: " + group_query
							});
						}
					});
				} else if (rows1[0].access_token_status == "Cancelled" || rows1[0].access_token_status == "Suspended") {
					res.json({
						"error": true,
						"errorCode": 204,
						"message": "User's Subscription has been Cancelled/Suspended."
					});
				} else {
					res.json({
						"error": true,
						"errorCode": 202,
						"message": "Query returned unexpected details: " + access_query
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
	});

	router.get("/content/:grp/:cat/:count?", function(req, res) {
		var queryParams = {
			"grp": req.params.grp,
			"cat": req.params.cat,
			"count": req.params.count
		};

		var grp = parseInt(queryParams.grp);
		var cat = parseInt(queryParams.cat);

		var grp_cat_query = 'SELECT * FROM `groups_categories` WHERE group_id = ' + grp + ' AND category_id = ' + cat;
		connection.query(grp_cat_query, function(err, rows1) {
			if (err) {
				if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
					self.handleDisconnect();
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
					});
				} else {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Error executing MySQL query: " + grp_cat_query
					});
				}
			} else if (rows1 != null && rows1 != undefined && rows1.length == 1) {
				var movies_query = rows1[0].query;
				var splitStr = movies_query.split("<replace>");
				var currDate = Math.floor(Date.now() / 1000).toString();
				var cnt = parseInt(queryParams.count);
				var result = {
					"httpCode": 200,
					"response": {
						"status": rows1[0].group_name + ' - ' + rows1[0].category_name + ' listed successfully.',
						"message": []
					}
				};

				if (cnt > 0 || !isNaN(cnt)) {
					splitStr[2] += ' LIMIT ' + cnt;
				} else {
					cnt = 0;
				}
				splitStr[1] = splitStr[1].indexOf("date") != -1 ? currDate : "";
				movies_query = splitStr.join("");
				connection.query(movies_query, function(err, rows) {
					if (err) {
						if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
							self.handleDisconnect();
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
							});
						} else {
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Error executing MySQL query: " + movies_query
							});
						}
					} else if (rows != null && rows != undefined && rows.length > 0) {
						if (cnt == 0 || cnt > rows.length) {
							result.response["count"] = rows.length;
						}
						for (var i = 0; i < rows.length; i++) {
							result.response.message.push({
								"movie_id": rows[i].video_id,
								"video_title": rows[i].video_title,
								"tv_image": "https://www.tentkotta.com/images/video_images/1280_480/" + rows[i].video_key + "_1.jpg",
								"device_image": "https://www.tentkotta.com/images/video_images/216_312/" + rows[i].video_key + "_1.jpg",
								"web_image": "https://www.tentkotta.com/images/video_images/210_270/" + rows[i].video_key + "_1.jpg"
							});
						}
						res.json(result);
					} else {
						res.json({
							"error": true,
							"errorCode": 202,
							"message": "Query returned unexpected details: " + movies_query
						});
					}
				});
			} else {
				res.json({
					"error": true,
					"errorCode": 202,
					"message": "Query returned unexpected details: " + grp_cat_query
				});
			}
		});
	});

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
					"message": []
				}
			};

			if (cat < 0 || isNaN(cat) || grp < 0 || isNaN(grp)) {
				res.json({
					"error": true,
					"errorCode": 204,
					"message": "Invalid Request. Please send valid Group and Category ID."
				});
			} else if (queryParams.id != undefined && grp == 0 && cat == 0) {
				var search_query = 'SELECT * FROM video WHERE video_id = ' + queryParams.id;
				connection.query(search_query, function(err, rows) {
					if (err) {
						if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
							self.handleDisconnect();
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
							});
						} else {
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Error executing MySQL query: " + search_query
							});
						}
					} else if (rows != null && rows != undefined && rows.length == 1) {
						result.response.message.push({
							"movie_id": rows[0].video_id,
							"tv_image": "https://www.tentkotta.com/images/video_images/1280_480/" + rows[0].video_key + "_1.jpg",
							"device_image": "https://www.tentkotta.com/images/video_images/216_312/" + rows[0].video_key + "_1.jpg",
							"web_image": "https://www.tentkotta.com/images/video_images/210_270/" + rows[0].video_key + "_1.jpg",
							"video_title": rows[0].video_title,
							"sub_title": rows[0].sub_title,
							"stereo_url": rows[0].mp3_url,
							"dolby_url": rows[0].mp4_url_five,
							"video_key": rows[0].video_key,
							"video_description": rows[0].video_description,
							"video_price": rows[0].video_price,
							"embeded_code": rows[0].embeded_code,
							"actors": rows[0].actors,
							"director": rows[0].director,
							"music": rows[0].music,
							"release_year": rows[0].release_year,
							"total_hours": rows[0].total_hours,
							"movie_rating": rows[0].rating,
							"isOnWatchList": "true"
						});
						res.json(result);
					} else {
						res.json({
							"error": true,
							"errorCode": 202,
							"message": "Query returned unexpected details: " + search_query
						});
					}
				});
			} else {
				var grp_cat_query = 'SELECT * FROM `groups_categories` WHERE group_id = ' + grp + ' AND category_id = ' + cat;
				connection.query(grp_cat_query, function(err, rows1) {
					if (err) {
						if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
							self.handleDisconnect();
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
							});
						} else {
							res.json({
								"error": true,
								"errorCode": err.code,
								"message": "Error executing MySQL query: " + grp_cat_query
							});
						}
					} else if (rows1 != null && rows1 != undefined && rows1.length == 1) {
						var movies_query = rows1[0].query;
						var splitStr = movies_query.split("<replace>");
						var replaceStr = "";
						var currDate = Math.floor(Date.now() / 1000).toString();

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
						movies_query = splitStr.join("");

						connection.query(movies_query, function(err, rows) {
							if (err) {
								if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
									self.handleDisconnect();
									res.json({
										"error": true,
										"errorCode": err.code,
										"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
									});
								} else {
									res.json({
										"error": true,
										"errorCode": err.code,
										"message": "Error executing MySQL query: " + movies_query
									});
								}
							} else if (rows != null && rows != undefined && rows.length == 1) {
								result.response.message.push({
									"video_id": rows[0].video_id,
									"tv_image": "https://www.tentkotta.com/images/video_images/1280_480/" + rows[0].video_key + "_1.jpg",
									"device_image": "https://www.tentkotta.com/images/video_images/216_312/" + rows[0].video_key + "_1.jpg",
									"web_image": "https://www.tentkotta.com/images/video_images/210_270/" + rows[0].video_key + "_1.jpg",
									"video_title": rows[0].video_title,
									"sub_title": rows[0].sub_title,
									"stereo_url": rows[0].mp3_url,
									"dolby_url": rows[0].mp4_url_five,
									"video_key": rows[0].video_key,
									"video_description": rows[0].video_description,
									"video_price": rows[0].video_price,
									"embeded_code": rows[0].embeded_code,
									"actors": rows[0].actors,
									"director": rows[0].director,
									"music": rows[0].music,
									"release_year": rows[0].release_year,
									"total_hours": rows[0].total_hours,
									"movie_rating": rows[0].rating,
									"isOnWatchList": "true"
								});
								res.json(result);
							} else {
								res.json({
									"error": true,
									"errorCode": 202,
									"message": "Query returned unexpected details: " + movies_query
								});
							}
						});
					} else {
						res.json({
							"error": true,
							"errorCode": 202,
							"message": "Query returned unexpected details: " + grp_cat_query
						});
					}
				});
			}
		}
	});

	router.get("/search/:name", function(req, res) {
		var result = {
			"httpCode": 200,
			"response": {
				"status": "Search results",
				"count": 0,
				"message": []
			}
		};

		var search_query = "SELECT video_id, video_key FROM video LEFT JOIN category ON video.category_id = category.category_id WHERE video_title LIKE '%"
			+ req.params.name + "%' AND category_status= 1 and  video_status = 1 and expiry_date>=" + Math.floor(Date.now() / 1000).toString() + " ORDER BY video_order ASC";
		connection.query(search_query, function(err, rows) {
			if (err) {
				if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
					self.handleDisconnect();
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
					});
				} else {
					res.json({
						"error": true,
						"errorCode": err.code,
						"message": "Error executing MySQL query: " + search_query
					});
				}
			} else if (rows != null && rows != undefined && rows.length > 0) {
				for (var i = 0; i < rows.length; i++) {
					result.response.count = rows.length;
					result.response.message.push({
						"movie_id": rows[i].video_id,
						"tv_image": "https://www.tentkotta.com/images/video_images/1280_480/" + rows[i].video_key + "_1.jpg",
						"device_image": "https://www.tentkotta.com/images/video_images/216_312/" + rows[i].video_key + "_1.jpg",
						"web_image": "https://www.tentkotta.com/images/video_images/210_270/" + rows[i].video_key + "_1.jpg"
					});
				}
				res.json(result);
			} else {
				res.json({
					"error": true,
					"errorCode": 202,
					"message": "Query returned unexpected details: " + search_query
				});
			}
		});
	});

	router.get("/user/movies/:accessToken", function(req, res) {
		var tokenParams = Base64.decode(req.params.accessToken).split('|');
		var result = {
			"movies":[]
		};
		if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
			res.json({
				"error": true,
				"errorCode": 201,
				"message": "Invalid Parameter(s): accessToken"
			});
		} else {
			var user_query = "SELECT * FROM user_movies where user_id = " + tokenParams[0];
			connection.query(user_query, function(err, rows) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
						self.handleDisconnect();
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Error executing MySQL query: " + user_query
						});
					}
				} else if (rows != null && rows != undefined && rows.length > 0) {
					for (var i = 0; i < rows.length; i++) {
						result.movies.push({
							"movieId": rows[i].movie_id,
							"movie_rating": rows[i].rating,
							"progress": rows[i].progress,
							"lastUpdatedDate": rows[i].update_date
						});
					}
					res.json(result);
				} else {
					res.json({
						"error": true,
						"errorCode": 202,
						"message": "Query returned unexpected details: " + user_query
					});
				}
			});
		}
	});

	router.get("/user/playlists/:accessToken", function(req, res) {
		var tokenParams = Base64.decode(req.params.accessToken).split('|');
		var result = {
			"playlists":[]
		};
		if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
			res.json({
				"error": true,
				"errorCode": 201,
				"message": "Invalid Parameter(s): accessToken"
			});
		} else {
			var user_query = "SELECT * FROM user_playlists WHERE user_id = " + tokenParams[0];
			connection.query(user_query, function(err, rows) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
						self.handleDisconnect();
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Error executing MySQL query: " + user_query
						});
					}
				} else if (rows != null && rows != undefined && rows.length > 0) {
					for (var i = 0; i < rows.length; i++) {
						result.playlists.push({
							"playlistId": rows[i].playlist_id,
							"playlistName": rows[i].playlist_name,
							"movies": rows[i].movies
						});
					}
					res.json(result);
				} else {
					res.json({
						"error": true,
						"errorCode": 202,
						"message": "Query returned unexpected details: " + user_query
					});
				}
			});
		}
	});

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
			connection.query(user_query, function(err, rows) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
						self.handleDisconnect();
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Error executing MySQL query: " + user_query
						});
					}
				} else if (rows != null && rows != undefined && rows.length > 0 && movies != null && movies != undefined && movies.length > 0) {
					for (var i = 0; i < rows.length; i++) {
						for (var j = 0; j < movies.length; j++) {
							if (movies[j].movieId == rows[i].movie_id) {
								user_movies_query += 'UPDATE user_movies SET rating = ' + movies[j].movie_rating + ', progress = ' + movies[j].progress
									+ ', update_date = ' + Math.floor(Date.now() / 1000) + ' WHERE user_movie_id = ' + rows[i].user_movie_id + '; ';
								movies.splice(j, 1);
							}
						}
					}
				}
				if (movies != null && movies != undefined && movies.length > 0) {
					for (var j = 0; j < movies.length; j++) {
						user_movies_query += 'INSERT INTO user_movies VALUES (NULL,' + tokenParams[0] + ', ' + movies[j].movieId + ', '
							+ movies[j].movie_rating + ', ' + movies[j].progress + ', ' + Math.floor(Date.now() / 1000) + ');';
					}
				}
				if (user_movies_query != '') {
					connection.query(user_movies_query, function(err) {
						if (err) {
							if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
								self.handleDisconnect();
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Error executing MySQL query: " + user_movies_query
								});
							}
						} else {
							res.json({
								"httpCode": 200,
								"response": {
									"status": "Movie Details Saved Successfully"
								}
							});
						}
					});
				} else {
					res.json({
						"error": true,
						"errorCode": 203,
						"message": "No details to save."
					});
				}
			});
		}
	});

	router.post("/user/playlists", function(req, res) {
		var tokenParams = Base64.decode(req.body.accessToken).split("|");
		if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
			res.json({
				"error": true,
				"errorCode": 201,
				"message": "Invalid Parameter(s): accessToken"
			});
		} else {
			var user_query = "SELECT * FROM user_playlists WHERE user_id = " + tokenParams[0];
			var playlists = req.body.playlists;
			var user_playlists_query = '';
			connection.query(user_query, function(err, rows) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
						self.handleDisconnect();
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Error executing MySQL query: " + user_query
						});
					}
				} else if (rows != null && rows != undefined && rows.length > 0 && playlists != null && playlists != undefined && playlists.length > 0) {
					for (var i = 0; i < rows.length; i++) {
						for (var j = 0; j < playlists.length; j++) {
							if (playlists[j].playlistId == rows[i].playlist_id) {
								user_playlists_query += 'UPDATE user_playlists SET playlist_name = "' + playlists[j].playlistName + '", movies = "' + playlists[j].movies
									+ '", update_date = ' + Math.floor(Date.now() / 1000) + ' WHERE user_playlist_id = ' + rows[i].user_playlist_id + '; ';
								playlists.splice(j, 1);
							}
						}
					}
				}
				if (playlists != null && playlists != undefined && playlists.length > 0) {
					for (var j = 0; j < playlists.length; j++) {
						user_playlists_query += 'INSERT INTO user_playlists VALUES (NULL,' + tokenParams[0] + ', ' + playlists[j].playlistId + ', "'
							+ playlists[j].playlistName + '", "' + playlists[j].movies + '", ' + Math.floor(Date.now() / 1000) + ');';
					}
				}
				if (user_playlists_query != '') {
					connection.query(user_playlists_query, function(err) {
						if (err) {
							if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
								self.handleDisconnect();
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
								});
							} else {
								res.json({
									"error": true,
									"errorCode": err.code,
									"message": "Error executing MySQL query: " + user_playlists_query
								});
							}
						} else {
							res.json({
								"httpCode": 200,
								"response": {
									"status": "Playlist Details Saved Successfully"
								}
							});
						}
					});
				} else {
					res.json({
						"error": true,
						"errorCode": 203,
						"message": "No details to save."
					});
				}
			});
		}
	});

	router.delete("/user/playlists", function(req, res) {
		var tokenParams = Base64.decode(req.body.accessToken).split("|");
		if (tokenParams == null || tokenParams == undefined || tokenParams.length != 3) {
			res.json({
				"error": true,
				"errorCode": 201,
				"message": "Invalid Parameter(s): accessToken"
			});
		} else {
			var user_playlists_query = "DELETE FROM user_playlists WHERE user_id=" + tokenParams[0] + ' AND playlist_id IN (' + req.body.playlistId + ');';
			connection.query(user_playlists_query, function(err) {
				if (err) {
					if (err.code == 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
						self.handleDisconnect();
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Database connection has been lost. Please wait for at lease 2000 milliseconds before retrying."
						});
					} else {
						res.json({
							"error": true,
							"errorCode": err.code,
							"message": "Error executing MySQL query: " + user_playlists_query
						});
					}
				} else {
					res.json({
						"httpCode": 200,
						"response": {
							"status": "Playlist Deleted Successfully"
						}
					});
				}
			});
		}
	});
}

module.exports = REST_ROUTER;
