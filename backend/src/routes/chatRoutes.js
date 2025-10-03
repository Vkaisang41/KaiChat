import express from "express";
import Message from "../models/Message.js";
import Group from "../models/Group.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Middleware to check group membership
const checkGroupMembership = async (req, res, next) => {
  const { room } = req.params;

  // If it's not a group room (doesn't start with 'group-'), skip this check
  if (!room.startsWith('group-')) {
    return next();
  }

  const groupId = room.replace('group-', '');
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(member =>
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied. You are not a member of this group" });
    }

    req.group = group;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a room (global or group)
router.get("/messages/:room", protect, checkGroupMembership, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .populate('replyTo')
      .populate('threadId')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add reaction to message
router.post("/messages/:id/reactions", protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user === req.user.id && r.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({ message: "Already reacted with this emoji" });
    }

    message.reactions.push({
      user: req.user.id,
      emoji,
      timestamp: new Date()
    });

    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove reaction from message
router.delete("/messages/:id/reactions/:emoji", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.reactions = message.reactions.filter(
      r => !(r.user === req.user.id && r.emoji === req.params.emoji)
    );

    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.post("/messages/:id/read", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if already read
    const alreadyRead = message.readBy.find(r => r.user === req.user.id);
    if (alreadyRead) {
      return res.status(400).json({ message: "Already marked as read" });
    }

    message.readBy.push({
      user: req.user.id,
      timestamp: new Date()
    });

    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search messages
router.get("/messages/search", protect, async (req, res) => {
  try {
    const { q, room } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Search query required" });
    }

    const query = {
      $or: [
        { content: { $regex: q, $options: 'i' } },
        { fileName: { $regex: q, $options: 'i' } }
      ]
    };
    if (room) {
      query.room = room;
    }

    const messages = await Message.find(query).sort({ timestamp: -1 }).limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;