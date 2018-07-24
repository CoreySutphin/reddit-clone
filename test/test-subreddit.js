/*
  Test file for subreddit interactions: visiting a subreddit, liking/disliking posts, sorting posts,
  subscribing, navigation items on posts
*/

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const path = require('path');
const process = require('process');

// Change working directory to project root folder
process.chdir(path.join(__dirname, '..'));

const Subreddit = require(path.join(path.dirname(__dirname) + '/models/SubredditSchema'));
const Post = require(path.join(path.dirname(__dirname) + '/models/PostSchema'));
const server = require('../index.js');

const should = chai.should();
const expect = chai.expect();
chai.use(chaiHttp);

// Replace with your db username and password
mongoose.connect('mongodb://joseph:Woodside1@ds129831.mlab.com:29831/reddit-clone-cs', { useNewUrlParser: true },
 function(err) {
  if (err) throw err;
});

describe('Sorting Posts', function() {

  before(function(done) {
    var newSubreddit = new Subreddit({
      name: 'TempSub',
      title: 'TEMP',
      description: 'TEST',
      sidebar: 'TEST'
    });

    newSubreddit.save(function(err, subreddit) {
      if (err) throw err;
      done();
    });
  });

  after(function(done) {
    Subreddit.model('Subreddit').findOneAndRemove({ name: 'TempSub' }, function(err) {
      done();
    });
  });

  beforeEach(function(done) {
    var newPosts = [
      { title: 'Test1', content: 'TEST', subreddit: 'TempSub', user: 'tempUser', upvotes: 5 },
      { title: 'Test2', content: 'TEST', subreddit: 'TempSub', user: 'tempUser' }
    ];
    Post.insertMany(newPosts, function(err, docs) {
      if (err) throw err;
      done();
    });
  });

  afterEach(function(done) {
    Post.deleteMany({ title: { $in: ['Test1', 'Test2'] } }, function(err) {
      done();
    });
  });

  it('should sort posts by their score with the highest rated score at the top', function(done) {
    done();
  });

});
