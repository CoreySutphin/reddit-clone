var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PostSchema = new Schema({
  commentIds: [{ type: String, unique: true }],
  title: String,
  content: String,
  subreddit: String,
  timestamp: {type: Date, default: Date.now},
  user: String,
  upvotes: {type: Number, default: 1},
  downvotes: {type: Number, default: 0}
});

module.exports = mongoose.model("Post", PostSchema, "posts");
