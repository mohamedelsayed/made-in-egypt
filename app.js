const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const muler = require('multer');
const mongoose = require('mongoose');
global.Promise = require('bluebird');


const index = require('./routes/index');
const api = require('./routes/api');
const users = require('./routes/users');
// const admins = require('./routes/admins');

mongoose.connect(`mongodb://${process.env.MONGO_URL || 'localhost:27017/madeInEgypt'}`, { useNewUrlParser: true }, function(err){
  if(err){
    return console.error(err);
  }
  console.log("connected to mongodb")
})

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())

app.use('/api', api);
app.use('/admin', function(req, res){
  res.render('admin');
});
// app.use('/users', users);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  // next(err);
  console.error(err.message);
  res.sendStatus(404);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
