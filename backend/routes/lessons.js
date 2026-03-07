const express = require("express");
const router = express.Router();
const Lesson = require("../models/Lesson");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

// Get all lessons
router.get("/", auth, async (req, res) => {
  try {
    const lessons = await Lesson.find()
      .sort({ order: 1, category: 1 })
      .select("-starterCode.javascript"); // Exclude large code blocks for list

    // Mark completed lessons
    const user = await User.findById(req.user._id);
    const lessonsWithStatus = lessons.map((lesson) => ({
      ...lesson.toObject(),
      completed: user.completedLessons.includes(lesson._id),
    }));

    res.json(lessonsWithStatus);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get single lesson
router.get("/:id", auth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const user = await User.findById(req.user._id);
    const isCompleted = user.completedLessons.includes(lesson._id);

    // Get previous score if exists
    const previousScore = user.lessonScores.find(
      (s) => s.lesson.toString() === lesson._id.toString(),
    );

    res.json({
      ...lesson.toObject(),
      completed: isCompleted,
      previousScore: previousScore?.score || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Complete lesson
router.post("/:id/complete", auth, async (req, res) => {
  try {
    const { score } = req.body;
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const user = await User.findById(req.user._id);

    // Check if already completed
    const alreadyCompleted = user.completedLessons.includes(lesson._id);

    if (!alreadyCompleted) {
      user.completedLessons.push(lesson._id);

      // Calculate points based on AI score
      const earnedPoints = Math.round((score / 100) * lesson.points);
      user.points += earnedPoints;

      // Add to lesson scores
      user.lessonScores.push({
        lesson: lesson._id,
        score: score,
        completedAt: new Date(),
      });

      // Check for badges
      if (user.completedLessons.length === 1) {
        if (!user.badges.includes("First Lesson")) {
          user.badges.push("First Lesson");
        }
      }

      if (user.completedLessons.length === 10) {
        if (!user.badges.includes("10 Lessons")) {
          user.badges.push("10 Lessons");
        }
      }

      if (score === 100) {
        if (!user.badges.includes("Perfect Code")) {
          user.badges.push("Perfect Code");
        }
      }

      // Update level
      user.updateLevel();

      await user.save();
    }

    res.json({
      message: "Lesson completed",
      points: user.points,
      level: user.level,
      badges: user.badges,
      earnedPoints: alreadyCompleted
        ? 0
        : Math.round((score / 100) * lesson.points),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Seed lessons (for initial setup)
router.post("/seed", async (req, res) => {
  try {
    const lessons = [
      {
        title: "HTML Basics: Your First Web Page",
        description: "Learn the fundamental structure of HTML documents",
        difficulty: "Beginner",
        points: 100,
        category: "HTML",
        instructions: `
# Welcome to HTML!

In this lesson, you'll create your first HTML page. HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.

## What you'll learn:
- Basic HTML document structure
- Common HTML tags
- How to create headings and paragraphs

## Task:
Create a simple HTML page with:
1. A main heading (h1) with text "Hello World"
2. A paragraph (p) with a short description about yourself
3. An unordered list (ul) with 3 of your favorite hobbies
        `,
        starterCode: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My First Page</title>
</head>
<body>
    <!-- Add your code here -->
    
</body>
</html>`,
          css: "",
          javascript: "",
        },
        task: "Create an HTML page with a heading, paragraph, and list of hobbies",
        hints: [
          "Use <h1> for the main heading",
          "Use <p> for paragraphs",
          "Use <ul> and <li> for lists",
        ],
        order: 1,
      },
      {
        title: "CSS Styling: Colors and Fonts",
        description: "Learn how to style your HTML with CSS",
        difficulty: "Beginner",
        points: 100,
        category: "CSS",
        instructions: `
# CSS Basics

CSS (Cascading Style Sheets) is used to style and layout web pages.

## Task:
Style the provided HTML by:
1. Making the heading blue and centered
2. Changing the paragraph font to Arial
3. Adding a background color to the page
        `,
        starterCode: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>Styled Page</title>
    <style>
        /* Add your CSS here */
        
    </style>
</head>
<body>
    <h1>Welcome to My Page</h1>
    <p>This is a paragraph that needs styling.</p>
</body>
</html>`,
          css: "",
          javascript: "",
        },
        task: "Style the HTML page with colors, fonts, and alignment",
        hints: [
          "Use color property for text color",
          "Use text-align: center",
          "Use font-family for fonts",
        ],
        order: 2,
      },
      {
        title: "JavaScript Basics: Variables and Functions",
        description: "Introduction to JavaScript programming",
        difficulty: "Beginner",
        points: 150,
        category: "JavaScript",
        instructions: `
# JavaScript Fundamentals

JavaScript is the programming language of the web. In this lesson, you'll learn about variables and functions.

## Task:
1. Create a function called 'greet' that takes a name parameter
2. The function should return "Hello, [name]!"
3. Call the function and display the result in the console
        `,
        starterCode: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>JavaScript Basics</title>
</head>
<body>
    <h1>Check the Console!</h1>
    <script>
        // Write your JavaScript here
        
    </script>
</body>
</html>`,
          css: "",
          javascript: "",
        },
        task: "Create a greet function that returns a greeting message",
        hints: [
          "Use function keyword to declare functions",
          "Use return to send back a value",
          "Use console.log to output",
        ],
        order: 3,
      },
      {
        title: "Interactive DOM Manipulation",
        description: "Learn to manipulate the DOM with JavaScript",
        difficulty: "Intermediate",
        points: 200,
        category: "JavaScript",
        instructions: `
# DOM Manipulation

The Document Object Model (DOM) allows JavaScript to interact with HTML elements.

## Task:
1. Create a button that changes the background color when clicked
2. Add an input field that updates a heading text in real-time
3. Create a counter that increments when a button is clicked
        `,
        starterCode: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>DOM Manipulation</title>
</head>
<body>
    <h1 id="main-heading">Interactive Page</h1>
    <input type="text" id="name-input" placeholder="Enter your name">
    <button id="color-btn">Change Color</button>
    <div>
        <p>Count: <span id="counter">0</span></p>
        <button id="count-btn">Increment</button>
    </div>
    
    <script>
        // Add your JavaScript here
        
    </script>
</body>
</html>`,
          css: "",
          javascript: "",
        },
        task: "Add interactivity with event listeners and DOM manipulation",
        hints: [
          "Use document.getElementById()",
          "Use addEventListener for clicks",
          "Use textContent to update text",
        ],
        order: 4,
      },
      {
        title: "CSS Flexbox Layout",
        description: "Master modern CSS layout with Flexbox",
        difficulty: "Intermediate",
        points: 200,
        category: "CSS",
        instructions: `
# CSS Flexbox

Flexbox is a one-dimensional layout method for laying out items in rows or columns.

## Task:
Create a responsive navigation bar using Flexbox:
1. Horizontal menu items
2. Space between items
3. Centered vertically
4. Responsive: stack on mobile
        `,
        starterCode: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>Flexbox Nav</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Add your flexbox styles here */
        
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">MySite</div>
        <ul class="nav-links">
            <li><a href="#">Home</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Services</a></li>
            <li><a href="#">Contact</a></li>
        </ul>
    </nav>
</body>
</html>`,
          css: "",
          javascript: "",
        },
        task: "Create a responsive flexbox navigation bar",
        hints: [
          "Use display: flex",
          "Use justify-content: space-between",
          "Use align-items: center",
          "Use @media queries for mobile",
        ],
        order: 5,
      },
    ];

    await Lesson.deleteMany({});
    await Lesson.insertMany(lessons);

    res.json({ message: "Lessons seeded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
