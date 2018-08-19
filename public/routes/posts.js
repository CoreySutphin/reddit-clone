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
router.get('/:id/sort/:condition', (req,res) => {
  let postID = req.params.id;
  let condition = req.params.condition;

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
                postComments: sortComments(allCommentsOnPost, 4, condition)
              });
            }
          });
        }
      });
    }
  });
});

router.get('/:id', (req, res) => {
  res.redirect('/post/' + req.params.id + '/sort/top');
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
      if(commentData.user === '[deleted]') {
        return;
      }
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
      if(commentData.user === '[deleted]') {
        return;
      }
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
        userFromDB.totalScore += 1;
        userFromDB.upvotedComments.push(savedComment._id);

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

//Route for editing comments
router.post('/:postID/editComment/:commentID', (req, res) => {
  let commentID = req.params.commentID;
  let postId = req.params.postID;

  let update = {content: req.body.commentContent}

  Comment.findByIdAndUpdate({_id: commentID}, update, (err, updatedComment) => {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/post/' + postId);
    }
  });
});

//Route for deleting comment
router.post('/deleteComment/:id', (req, res) => {
  let commentID = req.params.id;
  let update = {
    user: '[deleted]',
    content: '[deleted]'
  }

  Comment.findByIdAndUpdate({_id: commentID}, update, (err, updatedComment) => {
    if(err) {
      res.send(err);
    } else {
      res.send('Success');
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

//Returns all children comments of the given comment
function getChildrenComments(comment, commentsByDepth) {
  let currentDepth = comment.depth;
  let children = commentsByDepth[currentDepth + 1].filter(eachComment => eachComment.parentId == comment._id);
  if(children.length == 0) {
    return null;
  } else {
    return children;
  }
}

//Given a comment builds a hierarchial tree with all children and subsequent nodes
function buildTree(comment, maxDepth, commentsByDepth) {
  let tree = [comment];
  let currentDepth = comment.depth;
  let children = getChildrenComments(comment, commentsByDepth);
  if(!children || currentDepth === maxDepth) {
    return tree;
  }
  children.forEach(eachComment => {
    tree.push(...buildTree(eachComment, maxDepth, commentsByDepth));
  });


  return tree;
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

    case 'new':
      comments.sort((a,b) => {
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
    break;

    //Default sort will be top
    default:
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
