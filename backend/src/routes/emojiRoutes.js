import express from "express";
import multer from "multer";
import path from "path";
import {
  uploadEmoji,
  getEmojis,
  getUserEmojis,
  updateEmoji,
  deleteEmoji,
  incrementUsage,
  getPopularEmojis,
} from "../controllers/emojiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/emojis/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// All routes require authentication
router.use(protect);

// Emoji CRUD operations
router.route("/")
  .get(getEmojis)
  .post(upload.single('emoji'), uploadEmoji);

router.get("/popular", getPopularEmojis);
router.get("/my", getUserEmojis);

router.route("/:id")
  .put(updateEmoji)
  .delete(deleteEmoji);

router.post("/:id/use", incrementUsage);

export default router;