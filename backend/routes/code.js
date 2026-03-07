const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { analyzeCode } = require("../utils/aiAnalyzer");

// Analyze code with AI
router.post("/analyze-code", auth, async (req, res) => {
  try {
    const { code, language, task } = req.body;

    if (!code || !language) {
      return res
        .status(400)
        .json({ message: "Code and language are required" });
    }

    const analysis = await analyzeCode(
      code,
      language,
      task || "General code review",
    );

    res.json(analysis);
  } catch (error) {
    console.error("Code analysis error:", error);
    res.status(500).json({ message: "Failed to analyze code" });
  }
});

module.exports = router;
