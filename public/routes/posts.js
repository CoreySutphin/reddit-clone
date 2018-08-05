const express = require('express');
const router = express.Router();
const path = require('path');

// Creating a queue for upvote/downvote requests
const dq = require('deferred-queue');
var queue = dq ();

//Models
let Post = require(path.join(appRoot + '/models/PostSchema'));
let Subreddit = require(path.join(appRoot + '/models/SubredditSchema'));
let User = require(path.join(appRoot + '/models/UserSchema'))

router.use(express.static(appRoot + '/public')) // Include static files

router.get('*', (req,res,next) => {
  res.locals.user = req.user || null;
  let defaultSubreddits = ['Funny', 'News','Gaming'];

  //Sets a global variable of subreddits to either the users subscribedSubs
  //or default subs if no user logged in
  res.locals.subreddits = req.user ? req.user.subscribedSubs : defaultSubreddits;

  next();
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
          res.render('text_post', {
            subreddit: subredditData,
            post: postData
          })
        }
      });
    }
  });
});

router.post('/vote', (req, res) => {
  if (req.body.direction === '1') {
    console.log("UPVOTE: " + req.body.user + " " + req.body.id);
    queue.push (function (cb){
      process.nextTick (function (){
        postUpvote(req.body.id, req.body.user);
        cb ();
      });
    }, function (){

    });
  }
  else if (req.body.direction == '-1') {
    console.log("DOWNVOTE: " + req.body.user + " " + req.body.id);
    queue.push (function (cb){
      process.nextTick (function (){
        postDownvote(req.body.id, req.body.user);
        cb ();
      });
    }, function (){

    });
  }
});

function postUpvote(id, user) {
  User.findOne({ username: user }, (err, userData) => {
    if (err) throw err;
    if (userData.upvotedPosts.includes(id)) {
      return null;
    }

    // Update user with new upvote and removes id from downvotes array if it exists
    userData.upvotedPosts.push(id);
    if (userData.downvotedPosts.includes(id)) {
      userData.downvotedPosts.splice(userData.downvotedPosts.indexOf(id), 1);
    }
    userData.save(function(err) {
      // Update post
      Post.findOneAndUpdate({ _id: id }, { $inc: { upvotes: 1 } }, (err, postData) => {
        if (err) throw err;
      });
    });

  });
}

function postDownvote(id, user) {
  User.findOne({ username: user }, (err, userData) => {
    if (err) throw err;
    if (userData.downvotedPosts.includes(id)) {
      return null;
    }

    // Update user with new downvote and removes id from upvotes array if it exists
    userData.downvotedPosts.push(id);
    if (userData.upvotedPosts.includes(id)) {
      userData.upvotedPosts.splice(userData.upvotedPosts.indexOf(id), 1);
    }
    userData.save(function(err) {
      // Update post
      Post.findOneAndUpdate({ _id: id }, { $inc: { downvotes: 1 } }, (err, postData) => {
        if (err) throw err;
      });
    });
  });
}

module.exports = router;
