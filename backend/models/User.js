const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  githubId: {
    type: String,
    default: null,
  },
  githubToken: {
    type: String,
    default: null,
  },
  githubUsername: {
    type: String,
    default: null,
  },
  points: {
    type: Number,
    default: 0,
  },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner",
  },
  badges: [
    {
      type: String,
      enum: [
        "First Lesson",
        "10 Lessons",
        "Perfect Code",
        "Helper",
        "Contributor",
        "Master",
      ],
    },
  ],
  completedLessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
  ],
  lessonScores: [
    {
      lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
      score: Number,
      completedAt: Date,
    },
  ],
  refreshToken: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update level based on points
userSchema.methods.updateLevel = function () {
  if (this.points >= 1500) {
    this.level = "Advanced";
  } else if (this.points >= 500) {
    this.level = "Intermediate";
  } else {
    this.level = "Beginner";
  }
};

module.exports = mongoose.model("User", userSchema);
