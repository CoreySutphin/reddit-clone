/*
  Test file for all user auth interactions, creating an account, logging in, logging out,
  accesing restricted API endpoints, etc...
*/

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const path = require('path');
const process = require('process');

// Change working directory to project root folder
process.chdir(path.join(__dirname, '..'));

const User = require(path.join(path.dirname(__dirname) + '/models/UserSchema'));
const server = require('../index.js');

const should = chai.should();
const expect = chai.expect();
chai.use(chaiHttp);

// Replace with your db username and password
mongoose.connect('mongodb://joseph:Woodside1@ds129831.mlab.com:29831/reddit-clone-cs', { useNewUrlParser: true },
 function(err) {
  if (err) throw err;
});

describe('User Account Creation', function() {

  // Deletes dummy user after test cases are ran
  afterEach(function(done) {
    User.model('User').findOneAndRemove({ username: 'TEST123456789' }, function(err) {
      done();
    });
  })

  it('should add newly registered users to the database from the /uauth/register route', function(done) {
    chai.request(server)
      .post('/uauth/register')
      .send({
        username: 'TEST12345678', password: 'TEST', email: 'test.email@gmail.com', pass_confirmation: 'true'
      })
      .end(function(err, res) {
        should.exist(res);
        res.should.have.status('200');
        done();
      });
  });

});

describe('User Authentication', function() {

  // Sets up dummy user
  beforeEach(function(done) {
    var newUser = new User({
      username: 'TEST123456789',
      password: 'TEST',
      email: 'test.email@gmail.com'
    });
    newUser.save(function(err, user) {
      done();
    });
  });

  // Deletes dummy user before each test
  afterEach(function(done) {
    User.model('User').findOneAndRemove({ username: 'TEST123456789' }, function(err) {
      done();
    });
  });

  it('should log in users who pass in successful credentials to /uauth/login', function(done) {
    chai.request(server)
      .post('/uauth/login')
      .send({ username: 'TEST123456789', password: 'TEST' })
      .end(function(err, res) {
        should.exist(res);
        res.req.path.should.equal('/')
        res.should.have.status(200);
        done();
      });
  });

  it('should refuse authentication for users who pass in incorrect credentials to /uauth/login',
  function(done) {
    chai.request(server)
      .post('/uauath/login')
      .send({ username: 'TEST123456789', password: 'NOTRIGHTPASSWORD' })
      .end(function(err, res) {
        should.exist(res);
        res.req.path.should.eql('/uauath/login');
        res.should.have.status(404);
        done();
      });
  });

});
