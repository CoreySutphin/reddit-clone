const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');
const { check, validationResult} = require('express-validator/check');

//models
let Post = require(path.join(appRoot + '/models/PostSchema'));
let User = require(path.join(appRoot + '/models/UserSchema'));

router.use(express.static(appRoot + '/public')) // Include static files

//Global GET variables so template renders dont crash
router.get('*', (req,res,next) => {
  res.locals.user = req.user || null;
  let defaultSubreddits = ['Funny', 'News','Gaming'];

  //Sets a global variable of subreddits to either the users subscribedSubs
  //or default subs if no user logged in
  res.locals.subreddits = req.user ? req.user.subscribedSubs : defaultSubreddits;

  //Checks all GET requests to make sure that an admin is signed in
  //If no admin signed in sends them to login page
  //Else continues with the routes
  if (!res.locals.user || !res.locals.user.isAdmin) {
    res.render('login', {
      title: 'Login',
      errors: [{msg: 'Please sign into admin account'}]
    });
  } else {
    next();
  }
});

/*
Dashboard Route
Has links to /users, /subreddits, /posts
*/
router.get('/dashboard', (req,res) => {
  res.render('admin_dashboard', {
    title: 'Administrator Dashboard'
  });
});

/*
  Route to table that displays all users
*/
router.get('/users', (req,res) => {
  User.find({}, (err, allUsers) => {
    if(err) {
      console.log(err);
    } else {
      res.render('admin_users', {
        title: 'Users',
        users: allUsers
      });
    }
  });
});

/*
  Route to the edit user form
 */
router.get('/edit_user/:id', (req,res) => {
  let userID = req.params.id;
  User.findOne({ _id: userID }, (err, userFromDB) => {
    if(err) {
      console.log(err);
    } else {
      res.render('admin_edit_user', {
        title: 'Edit User',
        userData: userFromDB
      });
    }
  });
});

/*
  The POST route for updating a user
  First checks that the input is valid
  If valid, finds the user in the DB and updates
  else rerenders the template with the errors
*/
router.post('/edit_user/:id', [
  check('email').not().isEmpty().withMessage('Email can\'t be empty'),
  check('email').isEmail().withMessage('Email isn\'t valid'),
  check('username').not().isEmpty().withMessage('Username can\'t be empty'),
  check('score').isNumeric().withMessage('Score must be number')
], (req,res) => {
  let userID = req.params.id; //The user to be updated

  // Checks for errors
  const errors = validationResult(req).array();
  if(errors.length !== 0) {

    // If there are errors the template gets rendered again with the array of errors
    User.findOne({ _id: userID }, (err, userFromDB) => {
      if(err) {
        console.log(err);
      } else {
        res.render('admin_edit_user', {
          title: 'Edit User',
          userData: userFromDB,
          errors: errors
        });
      }
    });
  } else {
    // If there are no errors with the input
    let username = req.body.username;
    let email = req.body.email;
    let newSubs = req.body.newSubscribedSubs.split(' '); //Set to array
    let score = req.body.score;
    let admin = req.body.admin == 'on' ? true : false;

    let query = {_id:userID}; //Query passed to DB to find user

    //The updated data to be passed to DB
    let update = {
      username: username,
      email: email,
      subscribedSubs: newSubs,
      totalScore: score,
      isAdmin: admin
    }

    //Updates the user and redirects to user table if no error
    User.findOneAndUpdate(query, update, {new:true}, (err, updatedUser) => {
      if(err) {
        console.log(err);
      } else {
        res.redirect('/admin/users');
      }
    });
  }
});

/*
  Route to catch user delete request
  Logic for delete is in /js/main.js
*/
router.delete('/delete_user/:id', (req,res) => {
  let query = {_id: req.params.id};

  User.remove(query, err => {
    if(err) {
      console.log(err);
    } else {
      res.send('Success');
    }
  })
});

module.exports = router;
