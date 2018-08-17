var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const CommentSchema = new Schema({
  postId: { type: String, required: true, default: null },
  parentId: { type: String, default: null },
  depth: { type: Number, default: 0 },
  user: { type: String, required: true },
  content: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 1, min: 0 },
  downvotes: { type: Number, default: 0, min: 0 }
});

module.exports = mongoose.model("Comment", CommentSchema, "comments");
