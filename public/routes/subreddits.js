const express = require('express');
const router = express.Router();
const passport = require('passport');
const path = require('path');
const { check, validationResult} = require('express-validator/check');

//Models
let Subreddit = require(path.join(appRoot + '/models/SubredditSchema'));
let Post = require(path.join(appRoot + '/models/PostSchema'));
let User = require(path.join(appRoot + '/models/UserSchema'));

router.use(express.static(appRoot + '/public')) // Include static files

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
  if(res.locals.user) {
    res.render('create_subreddit', {
      title: 'create a subreddit',
    });
  } else {
    res.render('login', {
      title: 'Login',
      errors: [{msg: 'Must be logged in to create subreddit'}]
    });
  }
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
    });

    res.redirect('/');
  }
});

router.get('/:subreddit/submit_text_post', (req,res) => {
  let subredditName = req.params.subreddit;
  //First checks to see if the subreddit exists
  Subreddit.findOne({ name: subredditName }, (err, subredditData) => {
    if (err) console.log(err);

    //If the subreddit doesnt exist sends a 404 page
    if (subredditData === null) {
      res.render('404_error')
    }
    else {
      //Subreddit exists, then checks if a user is logged in and sends the submit post page
      if (res.locals.user) {
        res.render('submit_post', {
          title: 'Submit text post',
          subreddit: {
            name: subredditName
          }
        });
        //If user is not logged in sends them to the login page
      } else {
        res.render('login', {
          title: 'login',
          errors: [{msg: 'Must be logged in'}]
        });
      }
    }
  });
});

router.post('/:subreddit/submit_text_post',[
    check('title').not().isEmpty().withMessage('Title is required')
  ], (req, res) => {
  let subredditName = req.params.subreddit;
  const errors = validationResult(req).array();
  if(errors.length !== 0) {
    //If there are errors the template gets rendered again with the array of errors
    res.render('submit_post', {
      subreddit: {
        name: subredditName
      },
      errors: errors
    });
  } else {
    let title = req.body.title;
    let content = req.body.content;

    let newPost = new Post({
      title: title,
      content: content,
      subreddit: subredditName,
      user: res.locals.user.username
    });

    newPost.save((err, post) => {
      if(err) {
        console.log(err);
      } else {
        console.log(post);
      }
    })

    // Redirect back to subreddit
    res.redirect('.');
  }
});

// Route for serving a specific subreddit
router.get('/:subreddit', (req, res) => {
  let subredditName = req.params.subreddit;
  Subreddit.findOne({ name: subredditName }, (err, subredditData) => {
    if (err) throw err;

    if (subredditData === null) {
      res.render('404_error')
    }
    else {
      Post.find({ subreddit: subredditName }, (err, postsData) => {
        if (err) throw err;
        res.render('subreddit', { title: subredditData.title, subreddit: subredditData, posts: postsData.reverse() });
      });
    }
  });
});

// Route for serving a subreddit with posts sorted by some condition
router.get('/:subreddit/:condition', (req, res) => {
  let subredditName = req.params.subreddit;
  let condition = req.params.condition;
  Subreddit.findOne({ name: subredditName }, (err, subredditData) => {
    if (err) throw err;

    // All Post objects submitted to this subreddit
    Post.find({ subreddit: subredditName }, (err, postsData) => {
      if (err) throw err;
      switch (condition) {
        case "Top":
          // sort posts by score descending
          postsData.sort(function compare(a, b) {
            a.score = a.upvotes - a.downvotes;
            b.score = b.upvotes - b.downvotes;
            return b - a;
          });
          break;

        case "New":
          postsData.sort(function(a, b) {
            return b.timestamp.getTime() - a.timestamp.getTime();
          });
          break;
      }

      // If it's a test call just send the array of posts, else render the subreddit view
      if (req.headers.test === 'true'){
        res.send({ data: postsData });
      }
      else {
        res.render('subreddit', { title: subredditData.title, subreddit: subredditData, posts: postsData });
      }
    });
  });
});



// Route for serving a post's comments page
//router.get('/:subreddit/posts/:postId')

module.exports = router;
