const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("❌ MONGODB_URI tapılmadı!");
      return;
    }
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected...");
  } catch (err) {
    console.error("❌ Baza xətası:", err.message);
  }
};

module.exports = connectDB;
