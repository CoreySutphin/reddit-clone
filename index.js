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
  console.log("Successfully connected to MongoDB");
});

//Models
let User = require('./models/UserSchema')

//Sets a global user variable if user is logged in
app.get('*', (req,res,next) => {
  res.locals.user = req.user || null;
  next();
});

app.get('/', (req, res) => {
  res.render("subreddit");
});

// Route for serving a specific subreddit
app.get('/r/:subreddit', (req, res) => {
  let subreddit = req.params.subreddit;
  res.send(subreddit);
});

// Route for serving the user registration page
app.get('/register', (req,res) => {
  res.render('user-registration');
});

//User Registration
//Array of checks comes from express-validator
app.post('/register', [
  check('email').not().isEmpty().withMessage('Email can\'t be empty'),
  check('email').isEmail().withMessage('Email isn\'t valid'),
  check('username').not().isEmpty().withMessage('Username can\'t be empty'),
  check('password').not().isEmpty().withMessage('Password can\'t be empty'),
  check('pass_confirmation').not().isEmpty().withMessage('Must confirm password'),
  check('password').custom((value, {req, loc, path}) => {
            if (value !== req.body.pass_confirmation) {
                return false;
            } else {
                return value;
            }
        }).withMessage("Passwords don't match."),
], (req,res) => {
  //Checks for errors
  const errors = validationResult(req).array();
  if(errors.length !== 0) {
    //If there are errors the template gets rendered again with the array of errors
    res.render('user-registration', {
      errors: errors
    })
  } else {
    //If there are no errors with the input
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    let newUser = new User({
      username: username,
      password: password,
      email: email
    });
    //When the user is saved to the database
    //Password is hashed from the UserSchema file
    newUser.save((err, user) => {
      if(err) {
        console.log(err);
      } else {
        console.log(user);
      }
    });
  }
});

//Login route
app.get('/login', (req,res) => {
  res.render('login');
});

//Login post Route
app.post('/login', (req,res,next) => {
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login' })(req,res,next);
});

//Logout route
app.get('/logout', (req,res) => {
  req.logout();
  res.redirect('/login');
});


app.listen(port, () => console.log(`Listening on port ${port}`));
