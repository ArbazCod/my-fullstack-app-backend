const express = require("express");
const upload = require("../config/multer");
const authMiddleware = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

/**
 * 1) Upload single image from FILE (form-data)
 *    Field name: image
 */
router.post(
  "/image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file received" });
      }

      res.status(200).json({
        message: "Image uploaded successfully",
        url: req.file.path || req.file.secure_url,
        public_id: req.file.filename || req.file.public_id
      });
    } catch (error) {
      res.status(500).json({
        message: "Upload failed",
        error: error.message
      });
    }
  }
);

/**
 * 2) Upload image BY URL (JSON body)
 *    Body: { "imageUrl": "https://..." }
 */
router.post("/image-by-url", authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "blog_uploads"
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message
    });
  }
});

module.exports = router;


