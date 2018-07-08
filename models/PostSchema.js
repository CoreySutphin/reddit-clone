var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PostSchema = new Schema({
  postId: String,
  commentIds: [{ type: String, unique: true }],
  title: String,
  content: String,
  subreddit: String,
  timestamp: Date,
  user: String,
  upvotes: Number,
  downvotes: Number
});

module.exports = mongoose.model("Post", PostSchema, "posts");
