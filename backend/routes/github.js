const express = require("express");
const router = express.Router();
const { Octokit } = require("@octokit/rest");
const CryptoJS = require("crypto-js");
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const CodeShare = require("../models/CodeShare");

// Get GitHub repos
router.get("/repos", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.githubToken) {
      return res.status(400).json({ message: "GitHub not connected" });
    }

    // Decrypt token
    const decryptedToken = CryptoJS.AES.decrypt(
      user.githubToken,
      process.env.ENCRYPTION_KEY,
    ).toString(CryptoJS.enc.Utf8);

    const octokit = new Octokit({ auth: decryptedToken });

    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    res.json(
      repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
      })),
    );
  } catch (error) {
    console.error("GitHub repos error:", error);
    res.status(500).json({ message: "Failed to fetch repositories" });
  }
});

// Save code to GitHub
router.post("/save", auth, async (req, res) => {
  try {
    const {
      repoName,
      fileName,
      content,
      description,
      isPublic = true,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user.githubToken) {
      return res.status(400).json({ message: "GitHub not connected" });
    }

    // Decrypt token
    const decryptedToken = CryptoJS.AES.decrypt(
      user.githubToken,
      process.env.ENCRYPTION_KEY,
    ).toString(CryptoJS.enc.Utf8);

    const octokit = new Octokit({ auth: decryptedToken });

    // Check if repo exists
    let repo;
    try {
      const { data } = await octokit.repos.get({
        owner: user.githubUsername,
        repo: repoName,
      });
      repo = data;
    } catch (e) {
      // Repo doesn't exist, create it
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: description || "Created from Frontend Learning Platform",
        private: !isPublic,
        auto_init: true,
      });
      repo = data;
    }

    // Create or update file
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: user.githubUsername,
        repo: repoName,
        path: fileName,
      });
      sha = data.sha;
    } catch (e) {
      // File doesn't exist yet
    }

    const result = await octokit.repos.createOrUpdateFileContents({
      owner: user.githubUsername,
      repo: repoName,
      path: fileName,
      message: `Update ${fileName} from Frontend Learning Platform`,
      content: Buffer.from(content).toString("base64"),
      sha: sha,
    });

    res.json({
      message: "Code saved to GitHub",
      url: result.data.content.html_url,
      repo: repo.html_url,
    });
  } catch (error) {
    console.error("GitHub save error:", error);
    res
      .status(500)
      .json({ message: "Failed to save to GitHub", error: error.message });
  }
});

// Create gist
router.post("/gist", auth, async (req, res) => {
  try {
    const { description, files, public = true } = req.body;

    const user = await User.findById(req.user._id);

    if (!user.githubToken) {
      return res.status(400).json({ message: "GitHub not connected" });
    }

    const decryptedToken = CryptoJS.AES.decrypt(
      user.githubToken,
      process.env.ENCRYPTION_KEY,
    ).toString(CryptoJS.enc.Utf8);

    const octokit = new Octokit({ auth: decryptedToken });

    const { data: gist } = await octokit.gists.create({
      description,
      public,
      files,
    });

    res.json({
      message: "Gist created",
      url: gist.html_url,
      id: gist.id,
    });
  } catch (error) {
    console.error("Gist creation error:", error);
    res.status(500).json({ message: "Failed to create gist" });
  }
});

module.exports = router;
