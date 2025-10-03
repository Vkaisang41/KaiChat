import asyncHandler from "express-async-handler";
import Emoji from "../models/Emoji.js";

// Upload custom emoji/sticker
export const uploadEmoji = asyncHandler(async (req, res) => {
  const { name, type = "emoji", category = "custom", isPublic = true, tags = [] } = req.body;
  const file = req.file;

  if (!file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  if (!name) {
    res.status(400);
    throw new Error("Emoji name is required");
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    res.status(400);
    throw new Error("Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed");
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    res.status(400);
    throw new Error("File size too large. Maximum size is 2MB");
  }

  const emoji = await Emoji.create({
    name,
    url: `/uploads/emojis/${file.filename}`,
    type,
    category,
    uploadedBy: req.user.id,
    isPublic: isPublic === 'true' || isPublic === true,
    tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
    fileSize: file.size,
    mimeType: file.mimetype,
  });

  const populatedEmoji = await Emoji.findById(emoji._id).populate("uploadedBy", "fullName username");

  res.status(201).json(populatedEmoji);
});

// Get all emojis (public + user's private)
export const getEmojis = asyncHandler(async (req, res) => {
  const { type, category, search, limit = 50, offset = 0 } = req.query;

  let query = {
    $or: [
      { isPublic: true },
      { uploadedBy: req.user.id }
    ]
  };

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = query.$or.map(condition => ({
      ...condition,
      $and: [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
      ]
    }));
  }

  const emojis = await Emoji.find(query)
    .populate("uploadedBy", "fullName username")
    .sort({ usageCount: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  const total = await Emoji.countDocuments(query);

  res.json({
    emojis,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + emojis.length) < total
    }
  });
});

// Get user's custom emojis
export const getUserEmojis = asyncHandler(async (req, res) => {
  const emojis = await Emoji.find({ uploadedBy: req.user.id })
    .sort({ createdAt: -1 });

  res.json(emojis);
});

// Update emoji
export const updateEmoji = asyncHandler(async (req, res) => {
  const { name, category, isPublic, tags } = req.body;
  const emoji = await Emoji.findById(req.params.id);

  if (!emoji) {
    res.status(404);
    throw new Error("Emoji not found");
  }

  // Check ownership
  if (emoji.uploadedBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied. You can only update your own emojis");
  }

  emoji.name = name || emoji.name;
  emoji.category = category || emoji.category;
  emoji.isPublic = isPublic !== undefined ? isPublic : emoji.isPublic;
  emoji.tags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : emoji.tags;

  await emoji.save();

  const updatedEmoji = await Emoji.findById(emoji._id).populate("uploadedBy", "fullName username");

  res.json(updatedEmoji);
});

// Delete emoji
export const deleteEmoji = asyncHandler(async (req, res) => {
  const emoji = await Emoji.findById(req.params.id);

  if (!emoji) {
    res.status(404);
    throw new Error("Emoji not found");
  }

  // Check ownership
  if (emoji.uploadedBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied. You can only delete your own emojis");
  }

  // TODO: Delete file from filesystem
  // const fs = require('fs');
  // const path = require('path');
  // const filePath = path.join(__dirname, '..', emoji.url);
  // if (fs.existsSync(filePath)) {
  //   fs.unlinkSync(filePath);
  // }

  await Emoji.findByIdAndDelete(req.params.id);

  res.json({ message: "Emoji deleted successfully" });
});

// Increment usage count
export const incrementUsage = asyncHandler(async (req, res) => {
  const emoji = await Emoji.findById(req.params.id);

  if (!emoji) {
    res.status(404);
    throw new Error("Emoji not found");
  }

  emoji.usageCount += 1;
  await emoji.save();

  res.json({ message: "Usage count updated" });
});

// Get popular emojis
export const getPopularEmojis = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const emojis = await Emoji.find({
    $or: [
      { isPublic: true },
      { uploadedBy: req.user.id }
    ]
  })
    .populate("uploadedBy", "fullName username")
    .sort({ usageCount: -1, createdAt: -1 })
    .limit(parseInt(limit));

  res.json(emojis);
});