const express = require('express');
const router = express.Router();
const path = require('path');
const { check, validationResult} = require('express-validator/check');
const LTT = require('list-to-tree');

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
          Comment.find({postId: postID}, (err, allCommentsOnPost) => {
            if(err) {
              console.log(err);
            } else {
              res.render('text_post', {
                subreddit: subredditData,
                post: postData,
                postComments: sortComments(allCommentsOnPost, 4, 'top')
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
        postUpvote(req.body.id, res.locals.user.username);
        cb ();
      });
    }, function (){

    });
  }
  else if (req.body.direction == '-1') {
    console.log("DOWNVOTE: " + req.body.id);
    queue.push (function (cb){
      process.nextTick (function (){
        postDownvote(req.body.id, res.locals.user.username);
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
    Post.findOne({ _id: id }, (err, postData) => {
      if (userData.downvotedPosts.includes(id)) {
        // Remove downvote then add upvote
        postData.downvotes--;
        postData.upvotes++;
        userData.downvotedPosts.splice(userData.downvotedPosts.indexOf(id), 1);
      }
      else {
        // Add upvote to post
        postData.upvotes++;
      }
      postData.save(function(err) {
        if (err) throw err;
      });
      userData.save(function(err) {
        if (err) throw err;
      });
      User.findOne({ username: postData.user }, (err, postUser) => {
        postUser.totalScore++;
        postUser.save(function(err) {
          if (err) throw err;
        });
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
    Post.findOne({ _id: id }, (err, postData) => {
      if (userData.upvotedPosts.includes(id)) {
        // Remove upvote then add downvote
        postData.upvotes--;
        postData.downvotes++;
        userData.upvotedPosts.splice(userData.upvotedPosts.indexOf(id), 1);
      }
      else {
        postData.downvotes++;
      }

      postData.save(function(err) {
        if (err) throw err;
      });
      userData.save(function(err) {
        if (err) throw err;
      });
      User.findOne({ username: postData.user }, (err, postUser) => {
        postUser.totalScore--;
        postUser.save(function(err) {
          if (err) throw err;
        });
      });
    });
  });
}

/* Routes for comments*/

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
      //Adds the comment ID to the user's comments and updates their karma
      User.findOne({username: savedComment.user}, (err, userFromDB) => {
        userFromDB.allCommentIDs.push(savedComment._id);
        userFromDB.totalScore += 1;

        userFromDB.save((err, savedUser) => {
          if(err) {
            console.log(err);
          } else {
            res.redirect('/post/' + postID);
          }
        });
      });
    }
  });
});

//Route for replies to comments
router.post('/:postId/submitComment/:commentId/:depth', (req, res) => {
  let postID = req.params.postId;
  let parentCommentID = req.params.commentId;
  let commentContent = req.body.commentContent;
  let user = res.locals.user.username;
  let parentDepth = req.params.depth;

  let newComment = new Comment({
    postId: postID,
    parentId: parentCommentID,
    depth: +parentDepth + 1,
    user: user,
    content: commentContent
  });

  newComment.save((err, savedComment) => {
    if(err) {
      console.log(err);
    } else {
      console.log(savedComment);
      //Adds the comment ID to the user's comments and updates their karma
      User.findOne({username: savedComment.user}, (err, userFromDB) => {
        userFromDB.allCommentIDs.push(savedComment._id);
        userFromDB.totalScore += 1;

        userFromDB.save((err, savedUser) => {
          if(err) {
            console.log(err);
          } else {
            res.redirect('/post/' + postID);
          }
        });
      });
    }
  });
});



//Given array of comments
//Returns sorted by score
function sortComments(comments, maxDepth, condition) {
  let sortedComments = [];
  let sortedByDepth = splitByDepthAndSort(comments, maxDepth, condition);

  let topLevelComments = sortedByDepth[0];
  
  topLevelComments.forEach(comment => {
    sortedComments.push(...buildTree(comment, maxDepth, sortedByDepth));
  });

  return sortedComments;
}

function getChildrenComments(comment, commentsByDepth) {
  let currentDepth = comment.depth;
  let children = commentsByDepth[currentDepth + 1].filter(eachComment => eachComment.parentId == comment._id);
  if(children.length == 0) {
    return null;
  } else {
    return children;
  }
}

function getChildComment(comment, commentsByDepth) {
  let currentDepth = comment.depth;
  let children = commentsByDepth[currentDepth + 1].filter(eachComment => eachComment.parentId == comment._id);
  if(children.length == 0) {
    return null;
  } else {
    return children[0];
  }
}

function buildTree(comment, maxDepth, commentsByDepth) {
  let tree = [comment];
  let children = getChildrenComments(comment, commentsByDepth);
  if(!children) {
    return tree;
  }
  children.forEach(eachComment => {
    tree.push(...commentChain(eachComment, maxDepth, commentsByDepth));
  });

  return tree;
}

function commentChain(comment, maxDepth, commentsByDepth) {
  let chain = [comment];
  let parent = comment;
  let depth = 0;
  while (depth < maxDepth) {
    let child = getChildComment(parent, commentsByDepth);
    if (child) {
      chain.push(child);
      parent = child;
      depth++;
    } else {
      break;
    }
  }

  return chain;
}

//Sorts the posts by depth and condition passed
function splitByDepthAndSort(comments, maxDepth, condition) {
  let commentsSubArrays = [];

  for(let i = 0; i <= maxDepth; i++) {
    let commentsAtDepth = comments.filter(comment => comment.depth === i);
    commentsSubArrays.push(sortCommentsByCondition(commentsAtDepth, condition));
  }
  return commentsSubArrays;
}

function sortCommentsByCondition(comments, condition) {
  switch(condition) {
    case 'top':
      comments.sort((a,b) => {
        aScore = a.upvotes - a.downvotes;
        bScore = b.upvotes - b.downvotes;
        return bScore - aScore;
      });
    break;
  }

  return comments;
}

module.exports = router;
