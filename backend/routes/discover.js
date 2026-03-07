const express = require("express");
const router = express.Router();
const CodeShare = require("../models/CodeShare");
const Comment = require("../models/Comment");
const { auth } = require("../middleware/auth");

// Get shared codes
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || "recent"; // recent, popular

    let sortOption = {};
    if (sort === "popular") {
      sortOption = { likesCount: -1, createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const shares = await CodeShare.find()
      .populate("user", "name")
      .populate("lesson", "title category")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await CodeShare.countDocuments();

    res.json({
      shares,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Share code
router.post("/share", auth, async (req, res) => {
  try {
    const { lessonId, title, description, code, language } = req.body;

    const share = new CodeShare({
      user: req.user._id,
      lesson: lessonId,
      title,
      description,
      code,
      language,
    });

    await share.save();

    res.status(201).json({
      message: "Code shared successfully",
      share,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to share code" });
  }
});

// Like code
router.post("/:id/like", auth, async (req, res) => {
  try {
    const share = await CodeShare.findById(req.params.id);

    if (!share) {
      return res.status(404).json({ message: "Share not found" });
    }

    const userIndex = share.likes.indexOf(req.user._id);

    if (userIndex > -1) {
      // Unlike
      share.likes.splice(userIndex, 1);
      share.likesCount--;
    } else {
      // Like
      share.likes.push(req.user._id);
      share.likesCount++;
    }

    await share.save();

    res.json({
      liked: userIndex === -1,
      likesCount: share.likesCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get comments
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ codeShare: req.params.id })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add comment
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { content } = req.body;

    const share = await CodeShare.findById(req.params.id);
    if (!share) {
      return res.status(404).json({ message: "Share not found" });
    }

    const comment = new Comment({
      codeShare: req.params.id,
      user: req.user._id,
      content,
    });

    await comment.save();

    share.commentsCount++;
    await share.save();

    await comment.populate("user", "name");

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment" });
  }
});

module.exports = router;
