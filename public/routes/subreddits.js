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
      name: req.body.name.toLowerCase(),
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

/*
  Route for catching subscribe to a subreddit
*/
router.get('/:subreddit/subscribe/:id', (req, res) => {
  let userId = req.params.id;
  let subredditName = req.params.subreddit;

  //Gets the user from the DB
  User.findOne({_id:userId}, (err, userData) => {
    //Server side check to make sure the user isnt already subscribed to the subreddit
    //If the user is already subscribed simply redirects them to the subreddit page
    if(!userData.subscribedSubs.includes(subredditName)) {
      //Adds the subreddit to the subscribedSubs array
      userData.subscribedSubs.push(subredditName);

      //Saves the updated user to the DB
      userData.save((err, updatedUser) => {
        if(err) {
          console.log(err);
        } else {
          res.redirect('/r/' + subredditName);
        }
      });
    } else {
      res.redirect('/r/' + subredditName);
    }
  });
});

/*
  Route for catching unsubscribe to a subreddit
*/
router.get('/:subreddit/unsubscribe/:id', (req, res) => {
  let userId = req.params.id;
  let subredditName = req.params.subreddit;

  //Gets the user from the DB
  User.findOne({_id:userId}, (err, userData) => {
    //The index of the subreddit in the user's subscribed subs, or -1 if not subscribed
    let subIndex = userData.subscribedSubs.indexOf(subredditName);
    //Server side check to make sure the user is already subscribed to the subreddit
    //If the user isn't already subscribed simply redirects them to the subreddit page
    if(subIndex !== -1) {
      //Removes the subreddit from the array
      userData.subscribedSubs.splice(subIndex, 1);

      //Saves the updated user to the DB
      userData.save((err, updatedUser) => {
        if(err) {
          console.log(err);
        } else {
          res.redirect('/r/' + subredditName);
        }
      });
    } else {
      res.redirect('/r/' + subredditName);
    }
  });
});

router.get('/:subreddit/submit_text_post', (req,res) => {
  let subredditName = req.params.subreddit.toLowerCase();
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
  let subredditName = req.params.subreddit.toLowerCase();
  const errors = validationResult(req).array();
  if (subredditName === 'home') {
    errors.push('Cannot post to r/home');
  }
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

// Route for serving the home page
router.get('/home', (req, res) => {
  Subreddit.findOne({ name: 'home' }, (err, subredditData) => {
    if (err) throw err;
    // If user is logged in will display all posts in the users' subscribedSubs
    if (res.locals.user) {
      Post.find({ subreddit: { $in: res.locals.user.subscribedSubs } }, (err, postsData) => {
        if (err) throw err;

        postsData = shuffle(postsData);
        res.render('subreddit', {
          title: subredditData.title,
          subreddit: subredditData,
          posts: postsData
        });
      });
    // If user is not logged in will display posts from all subreddits
    } else {
      Post.find({}, (err, postsData) => {
        if (err) throw err;
        postsData = shuffle(postsData);
        res.render('subreddit', {
          title: subredditData.title,
          subreddit: subredditData,
          posts: postsData
        });
      });
    }
  });
});

// Route for serving a specific subreddit
router.get('/:subreddit', (req, res) => {
  let subredditName = req.params.subreddit.toLowerCase();
  if (subredditName === 'home') {
    res.redirect('/home');
  } else {
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
  }
});

 // Route for sorting posts on the home page
router.get('/home/:condition', (req, res) => {
  let condition = req.params.condition;

  Subreddit.findOne({ name: 'home' }, (err, subredditData) => {
    // If user is logged in will display all posts in the users' subscribedSubs
    if (res.locals.user) {
      Post.find({ subreddit: { $in: res.locals.user.subscribedSubs } }, (err, postsData) => {
        if (err) throw err;
        postsData = sortPosts(postsData, condition);
        res.render('subreddit', {
          title: subredditData.title,
          subreddit: subredditData,
          posts: postsData
        });
      });
    // If user is not logged in will display posts from all subreddits
    } else {
      Post.find({}, (err, postsData) => {
        if (err) throw err;
        postsData = sortPosts(postsData, condition);
        res.render('subreddit', {
          title: subredditData.title,
          subreddit: subredditData,
          posts: postsData
        });
      });
    }
  });
});

// Route for serving a subreddit with posts sorted by some condition
router.get('/:subreddit/:condition', (req, res) => {
  let subredditName = req.params.subreddit.toLowerCase();
  let condition = req.params.condition;
  // Checks if something besides a valid condition was passed in
  if (!['Top', 'New', 'Best', 'Hot'].includes(condition)) {
    res.redirect('/r/' + subredditName);
    return;
  }
  Subreddit.findOne({ name: subredditName }, (err, subredditData) => {
    if (err) throw err;

    // All Post objects submitted to this subreddit
    Post.find({ subreddit: subredditName }, (err, postsData) => {
      if (err) throw err;
      postsData = sortPosts(postsData, condition);
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

// Used to shuffle posts pulled for the home page, attempts to shuffle so there's not a sequence of posts
// from the same subreddit
function shuffle(array) {
  for (var i = 0; i < array.length/2; i += 2 ) {
    var b = array[array.length - 1 - i];
    array[array.length -1 - i] = array[i];
    array[i] = b;
  }
  return array;
}

// Sorts posts by a user-supplied condition
function sortPosts(posts, condition) {
  switch (condition) {
    case "Top":
      // sort posts by score descending
      posts.sort(function compare(a, b) {
        a.score = a.upvotes - a.downvotes;
        b.score = b.upvotes - b.downvotes;
        return b - a;
      });
      break;

    case "New":
      posts.sort(function(a, b) {
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      break;
  }

  return posts;
}

module.exports = router;
