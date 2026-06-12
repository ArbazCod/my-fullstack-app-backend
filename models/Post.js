const mongoose = require("mongoose");
const slugify = require("slugify");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [30, "Content must be at least 30 characters long"],
      trim: true,
    },

    coverImage: {
      type: String,
      default: null,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isPublished: {
      type: Boolean,
      default: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      lowercase: true,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * AUTO GENERATE UNIQUE SEO SLUG
 */
postSchema.pre("validate", async function (next) {
  if (!this.title) return next();

  if (!this.isModified("title") && this.slug) {
    return next();
  }

  const baseSlug = slugify(this.title, {
    lower: true,
    strict: true,
  });

  let slugToUse = baseSlug;
  let counter = 1;

  const Post = mongoose.models.Post || mongoose.model("Post");

  while (
    await Post.findOne({
      slug: slugToUse,
      _id: { $ne: this._id },
    })
  ) {
    slugToUse = `${baseSlug}-${counter++}`;
  }

  this.slug = slugToUse;
  next();
});

/**
 * NORMALIZE TAGS & CATEGORY
 */
postSchema.pre("save", function (next) {
  if (Array.isArray(this.tags)) {
    this.tags = this.tags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
  }

  if (this.category) {
    this.category = this.category.trim().toLowerCase();
  }

  next();
});

/**
 * TEXT INDEX FOR SEARCH
 */
postSchema.index({
  title: "text",
  content: "text",
  tags: "text",
  category: "text",
});

module.exports = mongoose.model("Post", postSchema);