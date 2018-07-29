var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const SubredditSchema = new Schema({
  name: {type: String, required: true, unique: true},
  numSubbed: {type: Number, default: 0},
  title: {type: String, required: true},
  description: {type: String, required: true},
  sidebar: {type: String, required: true}
});

SubredditSchema.pre('save', function(next) {
  var subreddit = this;
  this.name = this.name.toLowerCase();
  next();
})

module.exports = mongoose.model("Subreddit", SubredditSchema, "subreddits");
