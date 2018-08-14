var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const CommentSchema = new Schema({
  postId: { type: String, required: true },
  parentId: String,
  user: { type: String, required: true },
  content: {type: String, required: true},
  timestamp: {type: Date, default: Date.now},
  upvotes: {type: Number, default: 1},
  downvotes: {type: Number, default: 0}
});

module.exports = mongoose.model("Comment", CommentSchema, "comments");
