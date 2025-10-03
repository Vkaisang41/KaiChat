import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Get all users (for explore page)
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('fullName username email profilePicture status createdAt updatedAt');
  res.json(users);
});

// Get user profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    // Update fields if provided
    if (req.body.profilePicture !== undefined) {
      user.profilePicture = req.body.profilePicture;
    }
    if (req.body.status !== undefined) {
      user.status = req.body.status;
    }
    if (req.body.fullName !== undefined) {
      user.fullName = req.body.fullName;
    }
    if (req.body.username !== undefined) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({
        username: req.body.username,
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        res.status(400);
        throw new Error("Username already exists");
      }
      
      user.username = req.body.username;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      username: updatedUser.username,
      phone: updatedUser.phone,
      profilePicture: updatedUser.profilePicture,
      status: updatedUser.status,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Search users with advanced filtering
export const searchUsers = asyncHandler(async (req, res) => {
  const {
    q, // search query
    online, // filter by online status
    limit = 20,
    offset = 0,
    excludeCurrentUser = true
  } = req.query;

  let query = {};

  // Text search on name, username, email
  if (q) {
    query.$or = [
      { fullName: { $regex: q, $options: 'i' } },
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ];
  }

  // Filter by online status
  if (online === 'true') {
    query.isOnline = true;
  } else if (online === 'false') {
    query.isOnline = false;
  }

  // Exclude current user
  if (excludeCurrentUser === 'true') {
    query._id = { $ne: req.user.id };
  }

  const users = await User.find(query)
    .select('fullName username email phone profilePicture status isOnline lastSeen presence createdAt')
    .sort({ isOnline: -1, lastSeen: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  // Get total count for pagination
  const total = await User.countDocuments(query);

  res.json({
    users,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + users.length) < total
    }
  });
});