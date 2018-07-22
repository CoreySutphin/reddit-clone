var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const CommentSchema = new Schema({
  postId: { type: String, required: true },
  parentId: String,
  user: { type: String, required: true },
  content: String,
  timestamp: Date,
  upvotes: Number,
  downvotes: Number
});

module.exports = mongoose.model("Comment", CommentSchema, "comments");
