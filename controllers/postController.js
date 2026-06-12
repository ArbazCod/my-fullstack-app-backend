const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

// ================= CREATE POST =================
exports.createPost = async (req, res) => {
  try {
    const { title, content, tags, coverImage, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (!req.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // ---- PROCESS TAGS ----
    let processedTags = [];

    if (typeof tags === "string") {
      processedTags = tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t !== "");
    } else if (Array.isArray(tags)) {
      processedTags = tags
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t !== "");
    }

    const post = await Post.create({
      title,
      content,
      coverImage: coverImage || "",
      category: category.trim().toLowerCase(),
      tags: processedTags,
      author: req.userId,
      likes: [],
      isPublished: true,
    });

    // 🔔 NOTIFY ALL USERS (EXCEPT CREATOR)
    const users = await User.find({ _id: { $ne: req.userId } });

    await Notification.insertMany(
      users.map((u) => ({
        recipient: u._id,
        sender: req.userId,
        type: "new_blog",
        message: "New blog published",
        link: `/blog/${post.slug}`,
      }))
    );

    return res.status(201).json({
      message: "Post created successfully",
      post,
    });

  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    return res.status(500).json({
      message: "Server error creating post",
      error: error.message,
    });
  }
};

// ================= GET ALL POSTS =================
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email role")
      .sort({ createdAt: -1 });

    return res.json(posts);

  } catch (error) {
    console.error("GET ALL POSTS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET SINGLE POST BY ID =================
exports.getPostById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id)
      .populate("author", "name email role avatar");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json(post);

  } catch (error) {
    console.error("GET POST BY ID ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE POST =================
exports.updatePost = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category.trim().toLowerCase();

    // ---- UPDATE TAGS ----
    if (tags) {
      if (typeof tags === "string") {
        post.tags = tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t !== "");
      } else if (Array.isArray(tags)) {
        post.tags = tags
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t !== "");
      }
    }

    await post.save();

    return res.json({
      message: "Post updated successfully",
      post,
    });

  } catch (error) {
    console.error("UPDATE POST ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE POST =================
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();

    return res.json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error("DELETE POST ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= LIKE POST =================
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.userId;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      await Post.findByIdAndUpdate(
        post._id,
        { $pull: { likes: userId } },
        { new: true }
      );

      const updated = await Post.findById(post._id);
      return res.json({ likes: updated.likes.length });
    }

    await Post.findByIdAndUpdate(
      post._id,
      { $addToSet: { likes: userId } },
      { new: true }
    );

    // 🔔 NOTIFY BLOG OWNER (IF NOT SELF)
    if (post.author._id.toString() !== userId) {
      await Notification.create({
        recipient: post.author._id,
        sender: userId,
        type: "like",
        message: "Someone liked your blog",
        link: `/blog/${post.slug}`,
      });
    }

    const updated = await Post.findById(post._id);
    return res.json({ likes: updated.likes.length });

  } catch (error) {
    console.error("LIKE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// =============== SEARCH INCLUDING CATEGORY & TAGS ==================
exports.searchPosts = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) return res.json([]);

    const posts = await Post.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } }
      ]
    }).populate("author", "name");

    res.json(posts);

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ message: "Search failed" });
  }
};

// ================= GET BY SLUG =================
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate(
      "author",
      "name email role avatar"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.json(post);

  } catch (error) {
    console.error("GET POST BY SLUG ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET POSTS BY CATEGORY =================
exports.getPostsByCategory = async (req, res) => {
  try {
    const category = req.params.category.toLowerCase();

    const posts = await Post.find({ category })
      .populate("author", "name email role avatar")
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (error) {
    console.error("GET POSTS BY CATEGORY ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET POSTS BY TAG =================
exports.getPostsByTag = async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();

    const posts = await Post.find({ tags: tag })
      .populate("author", "name email role avatar")
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (error) {
    console.error("GET POSTS BY TAG ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



