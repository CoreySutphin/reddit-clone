const express = require('express');
const router = express.Router();
const path = require('path');

//Models
let Post = require(path.join(appRoot + '/models/PostSchema'));
let Subreddit = require(path.join(appRoot + '/models/SubredditSchema'));

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

module.exports = router;
