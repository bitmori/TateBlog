var crypto = require('crypto');
var db = require('./models/db');

module.exports = function(app){
  app.get('/',function(req,res){
    db.posts.find().sort({date: 1}).toArray(function (err, posts) {
      if(err) posts = [];
      res.render('index', { 
        title: '主页'
      , user: req.session.user
      , error: req.flash('error').toString()
      , success: req.flash('success').toString()
      , posts: posts
      });      
    });
  });

  app.get('/reg', checkNotLogin, function(req,res){
    res.render('reg', {
      title: '注册'
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
      title: '登录'
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

  app.get('/post', checkLogin, function(req,res){
    res.render('post', {
      title: '发表' 
    , user: req.session.user
    , error: req.flash('error').toString()
    , success: req.flash('success').toString()
    });
  });

  app.post('/post', checkLogin, function(req,res){
    var currentUser = req.session.user;
    var post = {
      name: currentUser,
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