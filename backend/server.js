require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// BAZA BAĞLANTISI
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("❌ MONGODB_URI tapılmadı!");
} else {
  mongoose
    .connect(mongoURI)
    .then(() => console.log("✅ MongoDB Atlas-a qoşulduq!"))
    .catch((err) => console.log("❌ Baza xətası:", err.message));
}

// Middleware
app.use(cors());
app.use(express.json());

// Marşrutlar (Routes)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/lessons", require("./routes/lessons"));

// Yoxlama
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server canlidir!" });
});

// Vercel üçün mütləq lazımdır
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server ${PORT} portunda açıldı`));
}

module.exports = app;
