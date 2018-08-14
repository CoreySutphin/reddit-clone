const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');

//Models
let User = require(path.join(appRoot + '/models/UserSchema'));
let Post = require(path.join(appRoot + '/models/PostSchema'));
let Comment = require(path.join(appRoot + '/models/CommentSchema'));

router.use(express.static(appRoot + '/public')) // Include static files

router.get('*', (req,res,next) => {
  res.locals.user = req.user || null;
  let defaultSubreddits = ['Funny', 'News','Gaming'];

  //Sets a global variable of subreddits to either the users subscribedSubs
  //or default subs if no user logged in
  res.locals.subreddits = req.user ? req.user.subscribedSubs : defaultSubreddits;

  next();
});

// Renders the overview page for a user
router.get('/:username', (req, res) => {
  let username = req.params.username;

  User.findOne({ username: username }, (err, userData) => {
    if (userData === null) {
      res.redirect('/');
    }
    res.render('user_page', { title: userData.username, userScore: userData.totalScore });
  });
});

router.get('/:username/:tab', (req, res) => {
  let username = req.params.username;
  let tab = req.params.tab;

  User.findOne({ username: username }, (err, userData) => {
    if (userData === null) {
      res.redirect('/');
    }
    switch(tab) {
      case 'Posts':
        Post.find({ user: username }, (err, postData) => {
          res.render('user_page', { title: userData.username,
            userScore: userData.totalScore,
            posts: postData
          });
        });
        break;
      case 'Comments':
        Comment.find({ user: username }, (err, commentData) => {
          res.render('user_page', { title: userData.username,
            userScore: userData.totalScore,
            posts: commentData
          });
        });
        break;
      case 'Upvotes':
        Post.find({ _id: { $in: userData.upvotedPosts } }, (err, posts) => {
          res.render('user_page', { title: userData.username,
            userScore: userData.totalScore,
            posts: posts
          });
        });
        break;
      case 'Downvotes':
        Post.find({ _id: { $in: userData.downvotedPosts } }, (err, posts) => {
          res.render('user_page', { title: userData.username,
            userScore: userData.totalScore,
            posts: posts
          });
        });
        break;
      default:
        res.redirect('/user/' + username);
        break;
    }
  });
});

module.exports = router;
