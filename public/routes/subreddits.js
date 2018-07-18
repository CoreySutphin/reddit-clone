const express = require('express');
const router = express.Router();
const passport = require('passport');
const path = require('path');
const { check, validationResult} = require('express-validator/check');

__parentDir = path.dirname(process.mainModule.filename);
let Subreddit = require(path.join(__parentDir + '/models/SubredditSchema'));

router.use(express.static(__parentDir + '/public')) // Include static files

// Route for serving a specific subreddit
router.get('/:subreddit', (req, res) => {
  let subredditName = req.params.subreddit;
  Subreddit.findOne({ name: subredditName }, (err, subreddit) => {
    if (err) throw err;
    res.send(subreddit);
  });
});

module.exports = router;
