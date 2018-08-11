/*
  Test file for interacting with a post: upvoting/downvoting, saving, reporting, etc...
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
const User = require(path.join(path.dirname(__dirname) + '/models/UserSchema'));

const should = chai.should();
const expect = chai.expect;
chai.use(chaiHttp);
var server = require('../index.js');

describe('Upvoting/Downvoting Posts', function() {

  before(function(done) {
    var testSub = new Subreddit({
      name: 'tempsub',
      title: 'TEMP',
      description: 'TEST',
      sidebar: 'TEST'
    });
    testSub.save(function(err, subreddit) {
      done();
    });
  });

  after(function(done) {
    Subreddit.model('Subreddit').findOneAndRemove({ name: 'tempsub' }, function(err) {
      done();
    });
  });

  beforeEach(function(done) {
    var newUser = new User({
      username: 'TEST123456789',
      password: 'TEST',
      email: 'test.email@gmail.com'
    });
    var newPost = new Post({
      title: 'TEST POST',
      content: 'TEST',
      subreddit: 'tempsub',
      user: 'TEST123456789'
    });
    newUser.save(function(err) {
      newPost.save(function(err) {
        done();
      });
    });
  });

  afterEach(function(done) {
    User.model('User').findOneAndRemove({ username: 'TEST123456789' }, function(err) {
      Post.model('Post').findOneAndRemove({ user: 'TEST123456789', subreddit: 'tempsub' }, function(err) {
        done();
      });
    });
  });

});
