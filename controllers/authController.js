const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    email = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    // AUTO LOGIN (important)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
  .cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
      .status(201)
      .json({
        message: "Registration successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || null,
        },
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

  res
  .cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
      .json({
        message: "Login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || null,
        },
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= LOGOUT =================
exports.logout = async (req, res) => {
  res.clearCookie("token", {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
})

  res.json({ message: "Logged out successfully" });
};

// ================= CURRENT USER =================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE PROFILE PHOTO =================
exports.updateProfilePhoto = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (imageUrl === "") {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { avatar: null },
        { new: true }
      ).select("-password");

      return res.json({
        message: "Avatar removed",
        user,
      });
    }

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "profile_photos",
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: result.secure_url },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile photo updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile photo",
      error: error.message,
    });
  }
};


// ================= DELETE ACCOUNT =================
exports.deleteAccount = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;
    const role = req.userRole;

    // Only self or admin allowed
    if (targetUserId !== currentUserId && role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Find all posts created by user
    const userPosts = await Post.find({
      author: targetUserId,
    }).select("_id");

    const postIds = userPosts.map(post => post._id);

    // Delete comments written by user
    await Comment.deleteMany({
      author: targetUserId,
    });

    // Delete comments on user's posts
    await Comment.deleteMany({
      post: { $in: postIds },
    });

    // Delete reviews written by user
    await Review.deleteMany({
      user: targetUserId,
    });

    // Delete reviews on user's posts
    await Review.deleteMany({
      post: { $in: postIds },
    });

    // Delete user's posts
    await Post.deleteMany({
      author: targetUserId,
    });

    // Delete notifications
    await Notification.deleteMany({
      $or: [
        { sender: targetUserId },
        { recipient: targetUserId },
      ],
    });

    // Finally delete user
    await User.findByIdAndDelete(targetUserId);

    // Clear cookie if deleting own account
    if (targetUserId === currentUserId) {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res.json({
      message: "Account deleted successfully",
    });

  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getTotalUsers = async (req, res) => {
  try {
    const total = await User.countDocuments();
    res.json({ totalUsers: total });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user count" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ================= UPDATE PROFILE (name + bio) =================
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, bio },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 1) find logged in user
    const user = await User.findById(req.userId);

    // 2) verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    // 3) hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Password change failed" });
  }
};



exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    res.json({
      message: "Role updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

