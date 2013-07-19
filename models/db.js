var config = require('../config');

var mongolian = require('mongolian');
var objectID = require('mongolian').ObjectId;
var server = new mongolian;

var db = server.db(config.db);
module.exports = {
	objID: objectID,
	users: db.collection('users'),
	posts: db.collection('posts')
};