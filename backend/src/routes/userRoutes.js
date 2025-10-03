import express from "express";
import User from "../models/User.js";
import { getAllUsers, getUserProfile, updateUserProfile, searchUsers } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.get("/search", protect, searchUsers);
router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile);

// Update user presence
router.put("/presence", protect, async (req, res) => {
  try {
    const { presence, typingIn } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (presence) {
      user.presence = presence;
      user.isOnline = presence === 'online';
      user.lastSeen = new Date();
    }

    if (typingIn !== undefined) {
      user.typingIn = typingIn;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;