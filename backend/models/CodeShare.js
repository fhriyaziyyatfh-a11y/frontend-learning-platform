const mongoose = require("mongoose");

const codeShareSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  code: {
    html: String,
    css: String,
    javascript: String,
  },
  language: {
    type: String,
    enum: ["html", "css", "javascript", "react"],
  },
  githubRepo: String,
  githubFile: String,
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  likesCount: {
    type: Number,
    default: 0,
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CodeShare", codeShareSchema);
