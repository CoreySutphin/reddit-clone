const express = require('express');
const router = express.Router();
const passport = require('passport');
const path = require('path');
const { check, validationResult} = require('express-validator/check');

__parentDir = path.dirname(process.mainModule.filename);
let Subreddit = require(path.join(__parentDir + '/models/SubredditSchema'));
let Post = require(path.join(__parentDir + '/models/PostSchema'));

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
  res.render('create_subreddit', {
    title: 'create a subreddit',
  });
});

router.get('/:subreddit/submit_text_post', (req,res) => {
  let subredditName = req.params.subreddit;
  res.render('submit_post', {
    title: 'Submit text post',
    subreddit: {
      name: subredditName
    }
  });
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
      title: 'create a subreddit',
      errors: errors
    });
  } else {
    let newSubreddit = new Subreddit({
      name: req.body.name,
      posts: [],
      title: req.body.title,
      description: req.body.description,
      sidebar: req.body.sidebar
    });

    newSubreddit.save((err, subreddit) => {
      if (err) throw err;
      console.log(subreddit);
    });

    res.redirect('/');
  }
});

// Route for serving a specific subreddit
router.get('/:subreddit', (req, res) => {
  let subredditName = req.params.subreddit;
  Subreddit.findOne({ name: subredditName }, (err, subredditData) => {
    if (err) throw err;

    Post.find({ subreddit: subredditName }, (err, postsData) => {
      if (err) throw err;

      res.render('subreddit', { title: subredditData.title, subreddit: subredditData, posts: postsData });
    });
  });
});

// Route for serving a subreddit with posts sorted by some condition
router.get('/:subreddit/:condition', (req, res) => {
  let subredditName = req.params.subreddits;
  let condition = req.params.condition;
  Subreddit.findOne({ name: subredditName }, (err, subreddit) => {
    if (err) throw err;

    // All Post objects submitted to this subreddit
    var subredditPosts;
    Post.find({ subreddit: subredditName }, (err, postsData) => {
      if (err) throw err;
      subredditPosts = postsData
    });

    switch (condition) {
      case "Top":
        // sort posts by score descending
        subredditPosts.sort(function compare(a, b) {
          a.score = a.upvotes - a.downvotes;
          b.score = b.upvotes = b.downvotes;
          return b - a;
        });
        break;
    }
  });
});



// Route for serving a post's comments page
//router.get('/:subreddit/posts/:postId')

module.exports = router;
