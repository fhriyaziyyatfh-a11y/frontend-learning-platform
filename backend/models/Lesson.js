const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },
  points: {
    type: Number,
    default: 100,
  },
  category: {
    type: String,
    enum: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },
  starterCode: {
    html: String,
    css: String,
    javascript: String,
  },
  task: {
    type: String,
    required: true,
  },
  hints: [String],
  expectedOutput: {
    type: String,
    description: String,
  },
  order: {
    type: Number,
    default: 0,
  },
  prerequisites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Lesson", lessonSchema);
