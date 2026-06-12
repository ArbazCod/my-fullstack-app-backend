const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

// =============== ADD COMMENT ==================
exports.addComment = async (req, res) => {
  try {
    const { text, postId } = req.body;

    if (!text || !postId) {
      return res.status(400).json({ message: "Text and postId are required" });
    }

    const comment = await Comment.create({
      text,
      post: postId,
      author: req.userId,
    });

    // 🔔 NOTIFICATION LOGIC
    const post = await Post.findById(postId).populate("author");

    // notify only if commenter is not owner
    if (post.author._id.toString() !== req.userId) {
      await Notification.create({
        recipient: post.author._id,
        sender: req.userId,
        type: "comment",
        message: "Someone commented on your blog",
        link: `/blog/${post.slug}`
      });
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============== GET COMMENTS FOR POST ==================
exports.getCommentsForPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =============== DELETE COMMENT ==================
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only comment author or admin can delete
    if (comment.author.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await comment.deleteOne();

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("author", "name email")
      .populate("post", "title")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


