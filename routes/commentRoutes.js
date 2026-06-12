const express = require("express");
const {
  addComment,
  getCommentsForPost,
  deleteComment,
  getAllComments
} = require("../controllers/commentController");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// ================= ADMIN =================

// Get ALL comments (Admin dashboard)
router.get("/", authMiddleware, adminOnly, getAllComments);

// ================= PUBLIC =================

// Get comments for a specific post
router.get("/:postId", getCommentsForPost);

// ================= AUTHENTICATED USERS =================

// Add a comment
router.post("/", authMiddleware, addComment);

// Delete a comment (author or admin)
router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;

