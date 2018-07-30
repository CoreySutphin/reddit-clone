const express = require('express');
const router = express.Router();
const passport = require('passport');
const path = require('path');
const { check, validationResult} = require('express-validator/check');

let User = require(path.join(appRoot + '/models/UserSchema'));

router.use(express.static(appRoot + '/public')) // Include static files

// Route for serving the user registration page
router.get('/register', (req,res) => {
  res.render('user-registration', {
    title: 'Register'
  });
});

// User Registration
// Array of checks comes from express-validator
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
  // Checks for errors
  const errors = validationResult(req).array();
  if(errors.length !== 0) {
    // If there are errors the template gets rendered again with the array of errors
    res.render('user-registration', {
      title: 'register',
      errors: errors
    })
  } else {
    // If there are no errors with the input
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    let newUser = new User({
      username: username,
      password: password,
      email: email,
      subscribedSubs: ['funny', 'news', 'gaming', 'rva'] //These are our default subreddits 
    });
    // When the user is saved to the database
    // Password is hashed from the UserSchema file
    newUser.save((err, user) => {
      // An Error will arise when either the username or email is already in the
      // Database as the UserSchema fields are both unique
      // The errors thrown are the same so need to search for both in the database
      // In order to get individual error messages
      if (err) {
        let saveErrors = [];
        User.find({username: newUser.username}, (err, userByUsername) => {
          if(userByUsername.length >= 1) {
            saveErrors.push({msg:'User already exists!'});
          }
          User.find({email: newUser.email}, (err, userByEmail) => {
            if(userByEmail.length >= 1) {
              saveErrors.push({msg: 'Email already in use!'});
            }
            res.render('user-registration', {
              title: 'register',
              errors: saveErrors
            })
          });
        });
      } else {
        console.log(user);
        res.redirect('/');
      }
    });
  }
});

//Login route
router.get('/login', (req,res) => {
  res.render('login', {
    title: 'login'
  });
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
