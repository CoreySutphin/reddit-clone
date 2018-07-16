const LocalStrategy = require('passport-local').Strategy;
const UserSchema = require('../models/UserSchema');
const bcrypt = require('bcrypt');

module.exports = function(passport) {
  //Local Strategy
  passport.use(new LocalStrategy(function(username, password, done) {
    //Match Username
    let query = {username:username};
    UserSchema.findOne(query,(err, user) => {
      if(err) console.log(err);
      if(!user) {
        console.log('No user Found');
        return done(null,false, {message: 'No user found'});
      }

      //Match password
      bcrypt.compare(password, user.password, (err,isMatch) => {
        if(err) console.log(err);
        if(isMatch) {
          console.log('Logged in');
          return done(null, user);
        } else {
          console.log('Wrong password');
          return done(null,false, {message: 'Wrong password'});
        }
      });
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    UserSchema.findById(id, (err, user) => {
      done(err, user);
    });
  });
}
