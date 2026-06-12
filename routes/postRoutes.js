const express = require("express");

const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  searchPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
} = require("../controllers/postController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ================= PUBLIC ROUTES =================

// get all posts
router.get("/", getAllPosts);

// search using ?q=
router.get("/search", searchPosts);

// get by category
router.get("/category/:category", getPostsByCategory);

// get by tag
router.get("/tag/:tag", getPostsByTag);

// get post by SEO slug
router.get("/slug/:slug", getPostBySlug);

// get post by id (fallback)
router.get("/:id", getPostById);

// ================= PROTECTED ROUTES =================

router.post("/", authMiddleware, createPost);

router.put("/:id", authMiddleware, updatePost);

router.delete("/:id", authMiddleware, deletePost);

router.put("/like/:id", authMiddleware, likePost);

module.exports = router;




