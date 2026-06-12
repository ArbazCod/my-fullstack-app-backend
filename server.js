const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

// ---------- LOAD ENV ----------
dotenv.config();

// ---------- INITIALIZE APP ----------
const app = express();

// ---------- MIDDLEWARES ----------
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://my-fullstack-app-frontend-7uwt.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------- ROUTES IMPORT ----------
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require("./routes/notificationRoutes"); // ✅ ADDED

// ---------- ROUTES USE ----------
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes); // ✅ ADDED

// ---------- TEST ROUTE ----------
app.get("/", (req, res) => {
  res.send("Backend server is running successfully");
});

// ---------- DATABASE ----------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

connectDB();

// ---------- START SERVER ----------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ---------- EXPORT FOR TESTING ----------
module.exports = app;  



