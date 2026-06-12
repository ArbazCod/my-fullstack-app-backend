const express = require("express");

const {
  register,
  login,
  logout,
  getMe,
  updateProfilePhoto,
  deleteAccount,
  getTotalUsers,
  getAllUsers,
  updateProfile,
  changePassword,
  changeUserRole,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// ================= PUBLIC =================
router.post("/register", register);
router.post("/login", login);

// ================= PROTECTED =================
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);

router.put("/profile/photo", authMiddleware, updateProfilePhoto);

router.put("/profile", authMiddleware, updateProfile);

router.put("/change-password", authMiddleware, changePassword);

router.delete("/delete/:id", authMiddleware, deleteAccount);

// ================= ADMIN ONLY =================

// Change user role
router.put(
  "/change-role/:id",
  authMiddleware,
  adminOnly,
  changeUserRole
);

// Count of all registered users
router.get(
  "/stats/total-users",
  authMiddleware,
  adminOnly,
  getTotalUsers
);

// List of all users with details
router.get(
  "/stats/users",
  authMiddleware,
  adminOnly,
  getAllUsers
);

module.exports = router;