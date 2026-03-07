const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth, generateTokens } = require("../middleware/auth");

// Register
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user
      user = new User({
        name,
        email,
        password,
      });

      await user.save();

      const { accessToken, refreshToken } = generateTokens(user._id);

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          points: user.points,
          level: user.level,
          badges: user.badges,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
        level: user.level,
        badges: user.badges,
        completedLessons: user.completedLessons,
        githubConnected: !!user.githubToken,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Refresh Token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokens = generateTokens(user._id);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// Get User Profile
router.get("/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("completedLessons", "title category points")
      .select("-password -refreshToken -githubToken");

    const totalLessons = await require("../models/Lesson").countDocuments();
    const progress =
      totalLessons > 0
        ? Math.round((user.completedLessons.length / totalLessons) * 100)
        : 0;

    res.json({
      ...user.toObject(),
      progress,
      githubConnected: !!user.githubToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Profile
router.put("/user", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      points: user.points,
      level: user.level,
      badges: user.badges,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GitHub OAuth Callback
router.post("/github/connect", auth, async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for access token
    const tokenResponse = await require("axios").post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      },
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res
        .status(400)
        .json({ message: "Failed to get GitHub access token" });
    }

    // Get GitHub user info
    const userResponse = await require("axios").get(
      "https://api.github.com/user",
      {
        headers: { Authorization: `token ${accessToken}` },
      },
    );

    const githubUser = userResponse.data;

    // Encrypt token before saving
    const encryptedToken = CryptoJS.AES.encrypt(
      accessToken,
      process.env.ENCRYPTION_KEY,
    ).toString();

    const user = await User.findById(req.user._id);
    user.githubToken = encryptedToken;
    user.githubId = githubUser.id;
    user.githubUsername = githubUser.login;
    await user.save();

    res.json({
      message: "GitHub connected successfully",
      username: githubUser.login,
    });
  } catch (error) {
    console.error("GitHub connection error:", error);
    res.status(500).json({ message: "Failed to connect GitHub" });
  }
});

module.exports = router;
