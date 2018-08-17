const express = require('express');
const router = express.Router();
const path = require('path');
const { check, validationResult} = require('express-validator/check');

// Creating a queue for upvote/downvote requests
const dq = require('deferred-queue');
var queue = dq ();

//Models
let Post = require(path.join(appRoot + '/models/PostSchema'));
let Subreddit = require(path.join(appRoot + '/models/SubredditSchema'));
let User = require(path.join(appRoot + '/models/UserSchema'));
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

router.post('*', (req,res,next) => {
  res.locals.user = req.user || null;
  let defaultSubreddits = ['Funny', 'News','Gaming'];

  //Sets a global variable of subreddits to either the users subscribedSubs
  //or default subs if no user logged in
  res.locals.subreddits = req.user ? req.user.subscribedSubs : defaultSubreddits;

  if (!res.locals.user) {
    res.render('login', {
      title: 'Login',
      errors: [{msg: 'Please sign in'}]
    });
  } else {
    next();
  }
});

/*
  Route for individual post
*/
router.get('/:id', (req,res) => {
  let postID = req.params.id;

  Post.findOne({_id: postID}, (err, postData) => {
    if(err) {
      console.log(err);
    } else {
      let subPostIn = postData.subreddit;

      Subreddit.findOne({name: subPostIn}, (err, subredditData) => {
        if(err) {
          console.log(err);
        } else {
          Comment.find({ postId: postID }, (err, allCommentsOnPost) => {
            if(err) {
              console.log(err);
            } else {
              res.render('text_post', {
                subreddit: subredditData,
                post: postData,
                postComments: allCommentsOnPost
              });
            }
          });
        }
      });
    }
  });
});

router.post('/vote', (req, res) => {
  if (!res.locals.user) {
    return;
  }

  if (req.body.direction === '1') {
    console.log("UPVOTE: " + req.body.id);
    queue.push (function (cb){
      process.nextTick (function (){
        if (req.body.type === 'post') {
          postUpvote(req.body.id, res.locals.user.username);
        }
        else {
          commentUpvote(req.body.id, res.locals.user.username);
        }
        cb ();
      });
    }, function (){

    });
  }
  else if (req.body.direction == '-1') {
    console.log("DOWNVOTE: " + req.body.id);
    queue.push (function (cb){
      process.nextTick (function (){
        if (req.body.type === 'post') {
          postDownvote(req.body.id, res.locals.user.username);
        }
        else {
          commentDownvote(req.body.id, res.locals.user.username);
        }
        cb ();
      });
    }, function (){

    });
  }
});

/*
  Functions for logging upvotes/downvotes for posts and comments
*/
function postUpvote(id, user) {
  User.findOne({ username: user }, (err, userData) => {
    if (err) throw err;

    Post.findOne({ _id: id }, (err, postData) => {
      User.findOne({ username: postData.user }, (err, postUser) => {
        if (userData.upvotedPosts.includes(id)) {
          postData.upvotes--;
          userData.upvotedPosts.splice(userData.upvotedPosts.indexOf(id), 1);
          postUser.totalScore--;
        }
        else if (userData.downvotedPosts.includes(id)) {
          userData.upvotedPosts.push(id);
          // Remove downvote then add upvote
          postData.downvotes--;
          postData.upvotes++;
          userData.downvotedPosts.splice(userData.downvotedPosts.indexOf(id), 1);
          postUser.totalScore += 2;
        }
        else {
          userData.upvotedPosts.push(id);
          // Add upvote to post
          postData.upvotes++;
          postUser.totalScore++;
        }

        postData.save(function(err) {

        });
        userData.save(function(err) {
          postUser.save(function(err) {

          });
        });
      });
    });
  });
}

function postDownvote(id, user) {
  User.findOne({ username: user }, (err, userData) => {
    if (err) throw err;

    Post.findOne({ _id: id }, (err, postData) => {
      User.findOne({ username: postData.user }, (err, postUser) => {
        if (userData.downvotedPosts.includes(id)) {
          postData.downvotes--;
          userData.downvotedPosts.splice(userData.downvotedPosts.indexOf(id), 1);
          postUser.totalScore++;
        }
        else if (userData.upvotedPosts.includes(id)) {
          userData.downvotedPosts.push(id);
          // Remove downvote then add upvote
          postData.upvotes--;
          postData.downvotes++;
          userData.upvotedPosts.splice(userData.upvotedPosts.indexOf(id), 1);
          postUser.totalScore -= 2;
        }
        else {
          userData.downvotedPosts.push(id);
          // Add upvote to post
          postData.downvotes++;
          postUser.totalScore--;
        }

        postData.save(function(err) {

        });
        userData.save(function(err) {
          postUser.save(function(err) {

          });
        });
      });
    });
  });
}

function commentUpvote(id, user) {
  User.findOne({ username: user }, (err, userData) => {
    if (err) throw err;

    Comment.findOne({ _id: id }, (err, commentData) => {
      User.findOne({ username: commentData.user }, (err, commentUser) => {
        if (userData.upvotedComments.includes(id)) {
          commentData.upvotes--;
          userData.upvotedComments.splice(userData.upvotedComments.indexOf(id), 1);
          commentUser.totalScore--;
        }
        else if (userData.downvotedComments.includes(id)) {
          userData.upvotedComments.push(id);
          // Remove downvote then add upvote
          commentData.downvotes--;
          commentData.upvotes++;
          userData.downvotedComments.splice(userData.downvotedComments.indexOf(id), 1);
          commentUser.totalScore += 2;
        }
        else {
          userData.upvotedComments.push(id);
          // Add upvote to post
          commentData.upvotes++;
          commentUser.totalScore++;
        }

        commentData.save(function(err) {

        });
        userData.save(function(err) {
          commentUser.save(function(err) {

          });
        });
      });
    });
  });
}

function commentDownvote(id, user) {
  User.findOne({ username: user }, (err, userData) => {
    if (err) throw err;

    Comment.findOne({ _id: id }, (err, commentData) => {
      User.findOne({ username: commentData.user }, (err, commentUser) => {
        if (userData.downvotedComments.includes(id)) {
          commentData.downvotes--;
          userData.downvotedComments.splice(userData.downvotedComments.indexOf(id), 1);
          commentUser.totalScore++;
        }
        else if (userData.upvotedComments.includes(id)) {
          userData.downvotedComments.push(id);
          // Remove downvote then add upvote
          commentData.upvotes--;
          commentData.downvotes++;
          userData.upvotedComments.splice(userData.upvotedComments.indexOf(id), 1);
          commentUser.totalScore -= 2;
        }
        else {
          userData.downvotedComments.push(id);
          // Add upvote to post
          commentData.downvotes++;
          commentUser.totalScore--;
        }

        commentData.save(function(err) {

        });
        userData.save(function(err) {
          commentUser.save(function(err) {

          });
        });
      });
    });
  });
}

/* Routes for comments */

//Route for top level comment reply
router.post('/:id/submitComment', (req, res) => {
  let postID = req.params.id;
  let commentContent = req.body.commentContent;
  let user = res.locals.user.username;

  let newComment = new Comment({
    postId: postID,
    user: user,
    content: commentContent
  });

  newComment.save((err, savedComment) => {
    if(err) {
      console.log(err);
    } else {
      User.findOne({ username: savedComment.user }, (err, userFromDB) => {
        userFromDB.allCommentIDs.push(savedComment._id);
        userFromDB.totalScore += (savedComment.upvotes - savedComment.downvotes);
        userFromDB.upvotedComments.push(savedComment._id);

        userFromDB.save((err, savedUser) => {
          if(err) {
            console.log(err);
          } else {
            console.log(savedUser);
            res.redirect('/post/' + postID);
          }
        });
      });
    }
  });

});

module.exports = router;
