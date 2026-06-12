const express = require("express");
const {
  addOrUpdateReview,
  deleteReview,
  getReviewsForPost,
  getAllReviews
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// ================= ADMIN =================

// Get ALL reviews for Admin Dashboard
router.get("/", authMiddleware, adminOnly, getAllReviews);

// ================= PUBLIC =================

// Get reviews for a specific post
router.get("/:postId", getReviewsForPost);

// ================= AUTHENTICATED USERS =================

// Add or update a review
router.post("/", authMiddleware, addOrUpdateReview);

// Delete a review (owner or admin)
router.delete("/:id", authMiddleware, deleteReview);

module.exports = router;

