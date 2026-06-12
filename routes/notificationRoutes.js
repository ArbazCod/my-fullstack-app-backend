const express = require("express");
const protect = require("../middleware/authMiddleware"); // ✅ FIXED
const {
  getMyNotifications,
  markRead
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.put("/:id/read", protect, markRead);

module.exports = router;


