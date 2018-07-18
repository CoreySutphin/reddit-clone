const express = require('express');
const router = express.Router();
const passport = require('passport');
const path = require('path');
const { check, validationResult} = require('express-validator/check');

__parentDir = path.dirname(process.mainModule.filename);
let SubredditModel = require(path.join(__parentDir + '/models/SubredditSchema'));

router.use(express.static(__parentDir + '/public')) // Include static files

router.get('*', (req,res,next) => {
  res.locals.user = req.user || null;
  let defaultSubreddits = ['Funny', 'News','Gaming'];

  //Sets a global variable of subreddits to either the users subscribedSubs
  //or default subs if no user logged in
  res.locals.subreddits = req.user ? req.user.subscribedSubs : defaultSubreddits;
  next();
});

//Subreddit creation form
router.get('/create', (req,res) => {
  res.render('create_subreddit');
});

router.post('/create', [
  check('name').not().isEmpty().withMessage('Name is required'),
  check('title').not().isEmpty().withMessage('Title is required'),
  check('description').not().isEmpty().withMessage('Description is required'),
  check('sidebar').not().isEmpty().withMessage('Sidebar is required')
], (req,res) => {
  const errors = validationResult(req).array();
  if(errors.length !== 0) {
    //If there are errors the template gets rendered again with the array of errors
    res.render('create_subreddit', {
      errors: errors
    });
  } else {
    res.redirect('/');
  }
});

// Route for serving a specific subreddit
router.get('/:subreddit', (req, res) => {
  let subredditName = req.params.subreddit;
  SubredditModel.findOne({ name: subredditName }, (err, subreddit) => {
    if (err) throw err;
    res.send(subreddit);
  });
});

module.exports = router;
