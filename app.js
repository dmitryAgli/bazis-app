var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const hbs = require('hbs');
const compression = require('compression');

const index = require('./routes/index');
const dashboard = require('./routes/dashboard');
const orders = require('./routes/orders');
const users = require('./routes/users');
const bush = require('./routes/bush');
const rigs = require('./routes/rigs');
const importdb = require('./routes/importdb');
const excel = require('./routes/excel');
const rfs = require('rotating-file-stream');
const error = require('debug')('notes:error');

let user;

const usersObj = require('./models/users-m');

function isAuthenticated(req, res, next) {
  if(user.userRole === 'admin') {
    return next()
  } else {
    const err = new Error('Access Denied');
    err.status = 500;
    next(err);
  }
}

var app = express();

console.log(app.get('env'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'partials'));
hbs.registerHelper('if_eq', function(a, b, opts) {
  if (a == b) {
      return opts.fn(this);
  } else {
      return opts.inverse(this);
  }
});
hbs.registerHelper('if_notEq', function(a, b, opts) {
  if (a != b) {
      return opts.fn(this);
  } else {
      return opts.inverse(this);
  }
});
hbs.registerHelper('json', function (content) {
  return JSON.stringify(content);
});

// GZIP all assets
app.use(compression());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// create a write stream (in append mode)
var accessLogStream = rfs('file.log', {
      size:     '10M', // rotate every 10 MegaBytes written
      interval: '1d',  // rotate daily
      compress: 'gzip' // compress rotated files
});

// setup the logger
app.use(logger('combined', {stream: accessLogStream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
// Если имеется cookie
app.use(async function(req, res, next) {
  if(req.cookies.userId) {
      if(!user) {
        user = await usersObj.find(req.cookies.userId);
      }
      res.locals.userName = user.userName;
      res.locals.userDescription = user.userDescription;
      res.locals.userRole = user.userRole;
      res.locals.userOrgUnity = user.userOrgUnity;
  } else {
    user = false;
  }

  //Alert Messages
  if(req.cookies.alert) {
    res.locals.alert = req.cookies.alert;
    res.clearCookie('alert');
  }

  //Sorting order
  res.locals.sortOrd = 1;
  if(req.query.sortOrd == 1 ) {
    res.locals.sortOrd = -1;
  }

  next()
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets/vendor/bootstrap', express.static(
  path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/assets/vendor/fontawesome', express.static(
  path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free')));
app.use('/assets/vendor/jquery', express.static(
  path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use('/assets/vendor/popper.js', express.static(
  path.join(__dirname, 'node_modules', 'popper.js', 'dist')));
app.use('/assets/vendor/feather-icons', express.static(
  path.join(__dirname, 'node_modules', 'feather-icons', 'dist')));
app.use('/assets/vendor/normalize', express.static(
  path.join(__dirname, 'node_modules', 'normalize.css')));
app.use('/assets/vendor/d3', express.static(
  path.join(__dirname, 'node_modules', 'd3v3')));
app.use('/assets/vendor/babel', express.static(
  path.join(__dirname, 'node_modules', '@babel', 'polyfill', 'dist')));

app.use('/', index);
app.use('/dashboard', dashboard);
app.use('/orders', orders);
app.use('/bushList', bush);
app.use('/rigs', rigs);
app.use('/excel', excel);
app.use('/importdb', importdb);
app.use('/users', isAuthenticated , users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

process.on('uncaughtException', function(err) { 
  error("I've crashed!!! - "+ (err.stack || err)); 
}); 

process.on('unhandledRejection', (reason, p) => {
  error(`Unhandled Rejection at: ${util.inspect(p)} reason: ${reason}`);
});

if (app.get('env') === 'development') { 
  app.use(function(err, req, res, next) { 
    // util.log(err.message); 
    res.status(err.status || 500); 
    error((err.status || 500) +' DEV ERROR '+ err.stack);
    // error(util.inspect(err)); 
    res.render('error', { 
      message: err.message, 
      error: err 
    }); 
  }); 
}

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;