var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  upvotedPosts: [{ type: String, default: [] }],
  downvotedPosts: [{ type: String, default: [] }],
  email: { type: String, required: true, unique: true },
  subscribedSubs: [{ type: String, default: [] }],
  totalScore: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false},
  accountCreationTimestamp:{ type: Date, default: Date.now },
  allCommentIDs: [{type: String, default: [] }]
});

// Checks to make sure a user isn't already subscribed to a subreddit
UserSchema.methods.checkSubscribedSubs = function(user, sub, cb) {
  this.model('Post').findOne({ username: user }, (err, userData) => {
    if (err) return false;
    return (userData.subscribedSubs.indexOf(sub) >  -1);
  });
}

// Hashes the new account's password before sending it to the database
UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

// Called when a user attempts to authenticate
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model("User", UserSchema, "users");
