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

// Redirects to the posts page for a user
router.get('/:username', (req, res) => {
  let username = req.params.username;
  res.redirect('/user/' + username + '/posts');
});

// Route for getting a user's upvoted/downvoted posts or comments
router.get('/:username/:tab(upvotes|downvotes)/:content(posts|comments)', (req, res) => {
  let username = req.params.username;
  let tab = req.params.tab;
  let content = req.params.content;

  User.findOne({ username: username }, (err, userData) => {
    switch(tab) {
      case 'upvotes':
        if (content === 'posts') {
          Post.find({ _id: { $in: userData.upvotedPosts } }, (err, postData) => {
            res.render('user_page', { title: userData.username,
              userScore: userData.totalScore,
              posts: postData,
              contentType: 'posts',
              tab: 'upvotes'
            });
          });
        }
        else if (content === 'comments') {
          Comment.find({ _id: { $in: userData.upvotedComments } }, (err, commentData) => {
            res.render('user_page', { title: userData.username,
              userScore: userData.totalScore,
              contentType: 'comments',
              comments: commentData,
              tab: 'upvotes'
           });
          });
        }
        break;
      case 'downvotes':
        if (content === 'posts') {
          Post.find({ _id: { $in: userData.downvotedPosts } }, (err, postData) => {
            res.render('user_page', { title: userData.username,
              userScore: userData.totalScore,
              posts: postData,
              contentType: 'posts',
              tab: 'downvotes'
            });
          });
        }
        else if (content === 'comments') {
          Comment.find({ _id: { $in: userData.downvotedComments } }, (err, commentData) => {
            res.render('user_page', { title: userData.username,
              userScore: userData.totalScore,
              comments: commentData,
              contentType: 'comments',
              tab: 'downvotes'
            });
          });
        }
        break;
      default:
        break;
    }
  });

});

// returns a user's upvoted/downvoted posts or comments sorted by some condition
router.get('/:username/:tab(upvotes|downvotes)/:content(posts|comments)/:condition(top|new)', (req, res) => {
  let username = req.params.username;
  let tab = req.params.tab;
  let content = req.params.content;
  let condition = req.params.condition;

  User.findOne({ username: username }, (err, userData) => {
    switch(tab) {
      case 'upvotes':
        if (content === 'posts') {
          Post.find({ _id: { $in: userData.upvotedPosts } }, (err, postData) => {
            res.render('user_page', { title: userData.username,
              userScore: userData.totalScore,
              posts: sortContent(postData, condition),
              contentType: 'posts',
              tab: 'upvotes',
              condition: condition
            });
          });
        }
        else if (content === 'comments') {
          Comment.find({ _id: { $in: userData.upvotedComments } }, (err, commentData) => {
            res.render('user_page', { title: userData.username,
              userScore: userData.totalScore,
              contentType: 'comments',
              comments: sortContent(commentData, condition),
              tab: 'upvotes',
              condition: condition
           });
          });
        }
        break;
      case 'downvotes':
        if (content === 'posts') {
          Post.find({ _id: { $in: userData.downvotedPosts } }, (err, postData) => {
            res.render('user_page', { title: userData.username,
              userScore: userData.totalScore,
              posts: sortContent(postData, condition),
              contentType: 'posts',
              tab: 'downvotes',
              condition: condition
            });
          });
        }
        else if (content === 'comments') {
          Comment.find({ _id: { $in: userData.downvotedComments } }, (err, commentData) => {
            res.render('user_page', { title: userData.username,
              userScore: userData.totalScore,
              comments: sortContent(commentData, condition),
              contentType: 'comments',
              tab: 'downvotes',
              condition: condition
            });
          });
        }
        break;
      default:
        break;
    }
  });
});

// Returns a user's submitted posts or comments
router.get('/:username/:tab', (req, res) => {
  let username = req.params.username;
  let tab = req.params.tab.toLowerCase();

  User.findOne({ username: username }, (err, userData) => {
    if (userData === null) {
      res.redirect('/');
    }
    switch(tab) {
      case 'posts':
        Post.find({ user: username }, (err, postData) => {
          res.render('user_page', { title: userData.username,
            userScore: userData.totalScore,
            posts: postData,
            contentType: 'posts'
          });
        });
        break;
      case 'comments':
        Comment.find({ user: username }, (err, commentData) => {
          res.render('user_page', { title: userData.username,
            userScore: userData.totalScore,
            comments: commentData,
            contentType: 'comments'
          });
        });
        break;
      case 'upvotes':
        res.redirect('/user/' + username + '/upvotes/posts');
        break;
      case 'downvotes':
        res.redirect('/user/' + username + '/downvotes/posts');
        break;
      default:
        res.redirect('/user/' + username);
        break;
    }
  });
});

// Returns a user's submitted posts or comments sorted by some condition
router.get('/:username/:tab/:condition(top|new)', (req, res) => {
  let username = req.params.username;
  let tab = req.params.tab.toLowerCase();
  let condition = req.params.condition;

  User.findOne({ username: username }, (err, userData) => {
    if (userData === null) {
      res.redirect('/');
    }
    switch(tab) {
      case 'posts':
        Post.find({ user: username }, (err, postData) => {
          res.render('user_page', { title: userData.username,
            userScore: userData.totalScore,
            posts: sortContent(postData, condition),
            contentType: 'posts',
            condition: condition
          });
        });
        break;
      case 'comments':
        Comment.find({ user: username }, (err, commentData) => {
          res.render('user_page', { title: userData.username,
            userScore: userData.totalScore,
            comments: sortContent(commentData, condition),
            contentType: 'comments',
            condition: condition
          });
        });
        break;
      case 'upvotes':
        res.redirect('/user/' + username + '/upvotes/posts');
        break;
      case 'downvotes':
        res.redirect('/user/' + username + '/downvotes/posts');
        break;
      default:
        res.redirect('/user/' + username);
        break;
    }
  });
});

// Sorts array of posts or comments by a user-supplied condition
function sortContent(content, condition) {
  switch (condition) {
    case "top":
      // sort posts by score descending
      content.sort(function compare(a, b) {
        a.score = a.upvotes - a.downvotes;
        b.score = b.upvotes - b.downvotes;
        return b.score - a.score;
      });
      break;

    case "new":
      content.sort(function(a, b) {
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      break;
  }

  return content;
}

module.exports = router;
