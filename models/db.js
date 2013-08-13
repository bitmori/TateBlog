var config = require('../config');

var mongolian = require('mongolian');
var objectID = require('mongolian').ObjectId;
var server = new mongolian;

var db = server.db(config.db);
module.exports = {
	objID: objectID,
	users: db.collection('users'),
	posts: db.collection('posts'),
	comments: db.collection('comments')
};

    // var post = {
    //   owner: currentUser,
    //   title: req.body.title,
    //   content: req.body.post,
    //   date: new Date
    // }

    // var newUser = {
    //   name: userinfo[0],
    //   password: password,
    //   email: req.body.email
    // }

    /*comment = {
		post: postid, 
		owner: username
		title:
		date:
		content:
    }*/