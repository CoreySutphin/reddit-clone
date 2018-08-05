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
const server = require('../index.js');

const should = chai.should();
const expect = chai.expect;
chai.use(chaiHttp);

describe('Upvoting/Downvoting Posts', function() {

  beforeEach(function(done) {
    var newUser = new User({
      username: 'TEST123456789',
      password: 'TEST',
      email: 'test.email@gmail.com'
    });
    newUser.save(function(err) {
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
  });

  afterEach(function(done) {
    User.model('User').findOneAndRemove({ username: 'TEST123456789' }, function(err) {
      Subreddit.model('Subreddit').findOneAndRemove({ name: 'tempsub' }, function(err) {
        done();
      });
    });
  });

  it('should accurately update upvotes field for a post and add post id to user upvote data', function(done) {
    var postId;

    testPost = new Post({
      title: 'TEST1', content: 'TEST', subreddit: 'tempsub', user: 'TEST123456789'
    })

    testPost.save(function(err, post) {
      postId = post._id;
      chai.request(server)
        .post('/post/vote')
        .set('content-type', 'application/json')
        .send({
          user: 'TEST123456789', id: postId, direction: '1'
        })
        .end(function(err, res) {
          Post.model('Post').findOne({ _id: postId }, function(err, post) {
            should.exist(post);
            post.upvotes.should.eql(2)
            User.model('User').findOne({ username: 'TEST123456789' }, function(err, user) {
              should.exist(user);
              expect(user.upvotedPosts).to.deep.include(postId);
            })
          })
        });

      Post.model('Post').findOneAndRemove({ _id: postId }, function(err) {
        done();
      })
    });
  });

  it('should accurately update downvotes field for a post and add post id to user downvote data', function(done) {
    var postId;

    testPost = new Post({
      title: 'TEST1', content: 'TEST', subreddit: 'tempsub', user: 'TEST123456789'
    })

    testPost.save(function(err, post) {
      postId = post._id;
      chai.request(server)
        .post('/post/vote')
        .set('content-type', 'application/json')
        .send({
          user: 'TEST123456789', id: postId, direction: '-1'
        })
        .end(function(err, res) {
          Post.model('Post').findOne({ _id: postId }, function(err, post) {
            should.exist(post);
            post.upvotes.should.eql(0)
            User.model('User').findOne({ username: 'TEST123456789' }, function(err, user) {
              should.exist(user);
              expect(user.downvotedPosts).to.deep.include(postId);
            })
          })
        });

      Post.model('Post').findOneAndRemove({ _id: postId }, function(err) {
        done();
      })
    });
  });

  it('should do nothing if a user attempts to upvote a post they already upvoted', function(done) {
    done();
  });

  it('should do nothing if a user attempts to downvote a post they already downvoted', function(done) {
    done();
  });

});
