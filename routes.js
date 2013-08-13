var crypto = require('crypto');
var db = require('./models/db');
var markdown = require('markdown').markdown;

module.exports = function(app){
  app.get('/',function(req,res){
    db.posts.find().sort({date: 1}).toArray(function (err, docs) {
      if(err) docs = [];
      docs.forEach(function(post){
        post.content = markdown.toHTML(post.content);
      });
      res.render('index', { 
        title: 'home'
      , user: req.session.user
      , error: req.flash('error').toString()
      , success: req.flash('success').toString()
      , posts: docs
      });
    });
  });

  app.get('/reg', checkNotLogin, function(req,res){
    res.render('reg', {
      title: 'reg'
    , user: req.session.user
    , error: req.flash('error').toString()
    , success: req.flash('success').toString()
    });
  });

  app.post('/reg', checkNotLogin, function(req,res){
    var userinfo = [req.body.name, req.body.password, req.body['password-repeat']];
    if(0==userinfo[0].length){
      req.flash('error', 'User name is necessary!');
      return res.redirect('/reg');
    }
    if(6>userinfo[1].length){
      req.flash('error', 'The password should be 6 chars at least!');
      return res.redirect('/reg');
    }
    if(userinfo[2] != userinfo[1]){
      req.flash('error', 'The password is different!');
      return res.redirect('/reg');
    }

    var md5 = crypto.createHash('md5');
    var password = md5.update(userinfo[1]).digest('hex');

    var newUser = {
      name: userinfo[0],
      password: password,
      email: req.body.email
    }

    db.users.findOne({name: newUser.name}, function (err, user) {
      if(user){
        req.flash('error', 'This user has already existed.');
        return res.redirect('/reg');
      } else {
        db.users.save(newUser, function (err, val) {
          if (err) {
            req.flash('error', err);
            return res.redirect('/');
          }
            req.session.user = newUser;
            req.flash('success', 'It works now!');
            res.redirect('/');
        });
      }
    });
  });

  app.get('/login', checkNotLogin, function(req,res){
    res.render('login', {
      title: 'login'
    , user: req.session.user
    , error: req.flash('error').toString()
    , success: req.flash('success').toString()
    });
  });

  app.post('/login', checkNotLogin, function(req,res){
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    
    db.users.findOne({name: req.body.name}, function (err, user) {
      if(!user) {
        req.flash('error', 'This user does not exist.');
        return res.redirect('/login');
      }
      if(user.password != password) {
        req.flash('error', 'Invalid password.');
        return res.redirect('/login');
      }

      req.session.user = user;
      req.flash('success', 'Welcome, '+user.name);
      res.redirect('/');
    });
  });

  app.get('/post', checkLogin, checkAdmin, function(req,res){
    res.render('post', {
      title: 'post' 
    , user: req.session.user
    , error: req.flash('error').toString()
    , success: req.flash('success').toString()
    });
  });

  app.post('/post', checkLogin, checkAdmin, function(req,res){
    var currentUser = req.session.user;
    var post = {
      owner: currentUser,
      title: req.body.title,
      content: req.body.post,
      date: new Date
    }
    db.posts.save(post, function (err, val) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success', 'Published successfully.');
      res.redirect('/');
    });
  });

  app.get('/logout', checkLogin, function(req,res){
    req.session.user = null;
    req.flash('success', 'See you!');
    res.redirect('/');
  });

  app.get('/archive', function (req, res) {
    db.posts.find().limit(20).sort({date: -1}).toArray(function (err, docs) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      docs.forEach(function(post){
        post.content = markdown.toHTML(post.content);
      });
      res.render('archive', {
        title: 'Archive',
        posts: docs,
        user: req.session.user
        , error: req.flash('error').toString()
        , success: req.flash('success').toString()
      });
    });
  });

  app.get('/u/:name', function (req, res) {
    db.users.findOne({name: req.params.name}, function (err, user) {
      if(!user) {
        req.flash('error', 'This user does not exist.');
        return res.redirect('/');
      }

      // return all comments of this user.
      db.comments.find({owner: user.name}).sort({date: 1}).toArray(function (err, docs) {
        if(err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        docs.forEach(function(c){
          c.content = markdown.toHTML(c.content);
        });
        res.render('user', { 
          title: user.name
        , user: req.session.user
        , error: req.flash('error').toString()
        , success: req.flash('success').toString()
        , posts: docs
        });
      });
    });
  });

  app.get('/p/:id', function (req, res) {
    db.posts.findOne({_id: db.objID(req.params.id)},function (err, post) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      post.content = markdown.toHTML(post.content);
      db.comments.find({post: req.params.id}).sort({date: 1}).toArray(function (err, comm) {
        comm.forEach(function (c) {
          c.content = markdown.toHTML(c.content);
        });
        res.render('article', { 
            title: post.title
          , user: req.session.user
          , error: req.flash('error').toString()
          , success: req.flash('success').toString()
          , post: post
          , comments: comm
        });
      });
    });
  });

  app.post('/p/:id', function (req, res) {
    var comment = {
          post: req.params.id, 
          owner: req.body.name,
          title: req.body.title,
          date: new Date,
          content: req.body.content
    }
    db.comments.save(comment, function (err, val) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success', 'Commented successfully.');
      res.redirect('back');
    });
  });
};

function checkLogin (req, res, next) {
  if(!req.session.user){
    req.flash('error', 'Please login first.');
    return res.redirect('/login');
  }
  next();
};

function checkNotLogin (req, res, next) {
  if(req.session.user){
    req.flash('error', 'You have logged in.');
    return res.redirect('/');
  }
  next(); 
};

function checkAdmin (req, res, next) {
  if(req.session.user.name!="admin"){
    req.flash('error', 'Only the owner of this site is allowed to do so.');
    return res.redirect('/');
  }
  next();
};