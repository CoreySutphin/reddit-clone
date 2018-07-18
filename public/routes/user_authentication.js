const express = require('express');
const router = express.Router();
const passport = require('passport');
const path = require('path');
const { check, validationResult} = require('express-validator/check');

__parentDir = path.dirname(process.mainModule.filename);
let User = require(path.join(__parentDir + '/models/UserSchema'));


router.use(express.static(__parentDir + '/public')) // Include static files

// Route for serving the user registration page
router.get('/register', (req,res) => {
  res.render('user-registration');
});

//User Registration
//Array of checks comes from express-validator
router.post('/register', [
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
router.get('/login', (req,res) => {
  res.render('login');
});

//Login post Route
router.post('/login', (req,res,next) => {
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/uauth/login' })(req,res,next);
});

//Logout route
router.get('/logout', (req,res) => {
  req.logout();
  res.redirect('/uauth/login');
});

module.exports = router;
