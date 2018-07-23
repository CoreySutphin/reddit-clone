const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator/check');
const session = require('express-session');
const passport = require('passport');

const port = process.env.port || 3000;

const app = express();

global.appRoot = path.resolve(__dirname);

app.set("view engine", "pug");
app.set('views', path.join(__dirname, '/public/views'));

app.use(express.static(__dirname + '/public')) // Include static files
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
//Express Session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));
//Passport config for local user sessions
require('./config/passport')(passport);
//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Replace with your db username and password
mongoose.connect('mongodb://joseph:Woodside1@ds129831.mlab.com:29831/reddit-clone-cs', { useNewUrlParser: true },
 function(err) {
  if (err) throw err;
});

//Models
let User = require('./models/UserSchema')
let Posts = require('./models/PostSchema')

//Sets a global user variable if user is logged in
app.get('*', (req,res,next) => {
  res.locals.user = req.user || null;
  let defaultSubreddits = ['Funny', 'News','Gaming'];

  //Sets a global variable of subreddits to either the users subscribedSubs
  //or default subs if no user logged in
  res.locals.topBarSubreddits = req.user ? defaultSubreddits.concat(req.user.subscribedSubs) : defaultSubreddits;
  next();
});

app.post('*', (req,res,next) => {
  res.locals.user = req.user || null;
  let defaultSubreddits = ['Funny', 'News','Gaming'];

  //Sets a global variable of subreddits to either the users subscribedSubs
  //or default subs if no user logged in
  res.locals.topBarSubreddits = req.user ? req.user.subscribedSubs : defaultSubreddits;
  next();
});

app.get('/', (req, res) => {
  Posts.find({}, (err, posts) => {
    res.render("subreddit", {
      subreddit: {
        name: 'Home'
      },
      posts: posts
    });
  });
});

/* Route for serving a specific subreddit
app.get('/r/:subreddit', (req, res) => {
  let subreddit = req.params.subreddit;
  res.send(subreddit);
});
*/

//Serve subreddit routes
let subredditRoutes = require(path.join(__dirname + '/public/routes/subreddits'));
app.use('/r', subredditRoutes);

//Serve user authentication i.e. Login,Register,logout
let uauth = require(path.join(__dirname + '/public/routes/user_authentication'));
app.use('/uauth', uauth);

app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
