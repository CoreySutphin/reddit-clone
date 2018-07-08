var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const SubredditSchema = new Schema({
  name: String,
  posts: [{ type: String, unique: true }],
  numSubbed: Number,
  description: String
});

module.exports = mongoose.model("Subreddit", SubredditSchema, "subreddits");
