const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');
const { check, validationResult} = require('express-validator/check');

//models
let Post = require(path.join(appRoot + '/models/PostSchema'));
let User = require(path.join(appRoot + '/models/UserSchema'));
let Subreddits = require(path.join(appRoot + '/models/SubredditSchema'));

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

router.post('*', (req,res,next) => {
  res.locals.user = req.user || null;
  let defaultSubreddits = ['Funny', 'News','Gaming'];

  //Sets a global variable of subreddits to either the users subscribedSubs
  //or default subs if no user logged in
  res.locals.subreddits = req.user ? req.user.subscribedSubs : defaultSubreddits;

  if (!res.locals.user || !res.locals.user.isAdmin) {
    res.render('login', {
      title: 'Login',
      errors: [{msg: 'Please sign into admin account'}]
    });
  } else {
    next();
  }
});

router.post('*', (req, res, next) => {
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

/*
  /admin/subreddits routes
*/

//Route for displaying admin subreddits page
router.get('/subreddits', (req, res) => {
  Subreddits.find({}, (err, allsubreddits) => {
    res.render('admin_subreddits', {
      title: 'Subreddits',
      subreddits: allsubreddits
    })
  });
});

//Route for editing the subreddit
router.get('/edit_sub/:id', (req, res) => {
  let subID = req.params.id;
  Subreddits.findOne({ _id: subID }, (err, subFromDB) => {
    if(err) {
      console.log(err);
    } else {
      res.render('admin_edit_sub', {
        title: 'Edit Subreddit',
        subData: subFromDB
      });
    }
  });
});

//Route for editing the subreddit
router.post('/edit_sub/:id',[
  check('title').not().isEmpty().withMessage('Title is required'),
  check('description').not().isEmpty().withMessage('Description is required'),
  check('sidebar').not().isEmpty().withMessage('Sidebar is required')
], (req, res) => {
  let subID = req.params.id;

  //Check for any errors in the validation
  const errors = validationResult(req).array();
  //if there are errors the template gets rerendered with the error messages
  if(errors.length !== 0) {
    Subreddits.findOne({_id: subID}, (err, subFromDB) => {
      if(err) {
        console.log(err);
      } else {
        res.render('admin_edit_sub', {
          title: 'Edit subreddit',
          subData: subFromDB,
          errors: errors
        });
      }
    });
    //else No errors with input validation
  } else {
    //All of the fields from the form to be updated
    let title = req.body.title;
    let description = req.body.description;
    let sidebar = req.body.sidebar;

    //The updated fields to be passed to the DB
    let update = {
      title:title,
      description:description,
      sidebar:sidebar
    }

    //Updates the subreddit and redirects to subreddits page if no errors
    Subreddits.findOneAndUpdate({_id: subID}, update, {new:true}, (err, updatedSub) => {
      if(err) {
        console.log(err);
      } else {
        res.redirect('/admin/subreddits');
      }
    });
  }
});

//Route to handle the deleting a subreddit
//First finds all users subscribed to that sub and removes the subscription
//Then deletes the subreddit
router.delete('/delete_sub/:id', (req, res) => {
  //ID of sub to be deleted
  let query = {_id: req.params.id};

  //Finds the subreddit in the DB
  //If the home subreddit was requested to be deleted returns a 500 error
  Subreddits.findOne(query, (err, subFromDB) => {
    if(err) {
      console.log(err);
    } else if (subFromDB.name === 'home') {
      res.status(500).send('/r/home cannot be deleted');
    } else {
      //Finds all users subscribed to the subreddit
      User.find({subscribedSubs: subFromDB.name}, (err, usersSubbed) => {
        if(err) {
          console.log(err);
        } else {
          //Unsubscribes each user that subscribes to the sub to be deleted
          usersSubbed.forEach(userData => {
            //Removes the subreddit from the subscribedSubs array
            let subIndex = userData.subscribedSubs.indexOf(subFromDB.name);
            userData.subscribedSubs.splice(subIndex, 1);

            userData.save((err, updatedUser) => {
              if(err) {
                console.log(err);
              } else {
                console.log(userData.username + ' unsubscribed from ' + subFromDB.name);
              }
            });
          });

          //Delete subreddit after unsubbing all the users
          Subreddits.remove(query, err => {
            if(err) {
              console.log(err);
            } else {
              res.send('Success');
            }
          });
        }
      });
    }
  });
});

//Route for showing posts
router.get('/posts', (req, res) => {
  Post.find({}, (err, allPosts) => {
    if(err) {
      console.log(err);
    } else {
      res.render('admin_posts', {
        title: 'Posts',
        posts: allPosts
      });
    }
  });
});

//Route for editing individual post
router.get('/edit_post/:id', (req, res) => {
  Post.findOne({_id: req.params.id}, (err, postFromDB) => {
    if(err) {
      console.log(err);
    } else {
      res.render('admin_edit_post', {
        title: 'Edit Post',
        postData: postFromDB
      });
    }
  });
});

router.post('/edit_post/:id',[
  check('title').not().isEmpty().withMessage('Title is required'),
  check('content').not().isEmpty().withMessage('Content is required'),
  check('upvotes').not().isEmpty().withMessage('Upvotes are required'),
  check('downvotes').not().isEmpty().withMessage('Downvotes are required'),
], (req, res) => {
  let postID = req.params.id;

  //Check for any errors in the validation
  const errors = validationResult(req).array();

  //If there are errors, form gets rendered again with errors
  if(errors.length !== 0) {
    Post.findOne({_id: postID}, (err, postFromDB) => {
      if(err) {
        console.log(err);
      } else {
        res.render('admin_edit_post', {
          title: 'Edit Post',
          postData: postFromDB,
          errors: errors
        });
      }
    });
    //If there are no errors with input validation
  } else {
    //All of the fields to be updated
    let update = {
      title: req.body.title,
      content: req.body.content,
      upvotes: +req.body.upvotes,
      downvotes: +req.body.downvotes
    }

    Post.findOneAndUpdate({_id: postID}, update, {new: true}, (err, updatedPost) => {
      if(err) {
        console.log(err);
      } else {
        res.redirect('/admin/posts');
      }
    });
  }
});

router.delete('/delete_post/:id', (req, res) => {
  let postID = req.params.id;

  Post.remove({_id: postID}, err => {
    if(err) {
      console.log(err);
    } else {
      res.send('Success');
    }
  });
});

module.exports = router;
