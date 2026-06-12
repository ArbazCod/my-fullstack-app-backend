const Review = require("../models/Review");
const Post = require("../models/Post");

// =============== ADD or UPDATE REVIEW ==================
exports.addOrUpdateReview = async (req, res) => {
  try {
    const { postId, rating, comment } = req.body;

    if (!postId || !rating) {
      return res.status(400).json({ message: "postId and rating are required" });
    }

    // Upsert: add new or update existing review
    const review = await Review.findOneAndUpdate(
      { post: postId, user: req.userId },
      { rating, comment },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Recalculate post average rating
    const stats = await Review.aggregate([
      { $match: { post: review.post } },
      {
        $group: {
          _id: "$post",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    await Post.findByIdAndUpdate(postId, {
      averageRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
    });

    res.status(200).json({
      message: "Review saved successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============== DELETE REVIEW ==================
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await review.deleteOne();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =============== GET REVIEWS FOR POST ==================
exports.getReviewsForPost = async (req, res) => {
  try {
    const reviews = await Review.find({ post: req.params.postId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("post", "title")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

