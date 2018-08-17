var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const PostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true, default: " " },
  subreddit: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  user: { type: String, required: true },
  upvotes: { type: Number, default: 1, min: 0 },
  downvotes: { type: Number, default: 0, min: 0 }
});

module.exports = mongoose.model("Post", PostSchema, "posts");
