var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const CommentSchema = new Schema({
  commentId: String,
  parentId: String,
  user: String,
  content: String,
  timestamp: Date,
  upvotes: Number,
  downvotes: Number
});

module.exports = mongoose.model("Comment", CommentSchema, "comments");
