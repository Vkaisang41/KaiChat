import asyncHandler from "express-async-handler";
import Call from "../models/Call.js";
import User from "../models/User.js";

// Get call history for user
const getCallHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const calls = await Call.find({
    $or: [{ caller: userId }, { callee: userId }]
  })
    .populate('caller', 'fullName username profilePicture')
    .populate('callee', 'fullName username profilePicture')
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Call.countDocuments({
    $or: [{ caller: userId }, { callee: userId }]
  });

  res.json({
    calls,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get call details
const getCallDetails = asyncHandler(async (req, res) => {
  const call = await Call.findById(req.params.id)
    .populate('caller', 'fullName username profilePicture')
    .populate('callee', 'fullName username profilePicture')
    .populate('participants.user', 'fullName username profilePicture');

  if (!call) {
    res.status(404);
    throw new Error("Call not found");
  }

  const isParticipant = call.caller.toString() === req.user._id.toString() ||
                        call.callee.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error("Not authorized");
  }

  res.json(call);
});

// Update call recording
const updateCallRecording = asyncHandler(async (req, res) => {
  const { recordingUrl, recordingFileName } = req.body;
  const call = await Call.findById(req.params.id);

  if (!call) {
    res.status(404);
    throw new Error("Call not found");
  }

  const isParticipant = call.caller.toString() === req.user._id.toString() ||
                        call.callee.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error("Not authorized");
  }

  call.recordingUrl = recordingUrl;
  call.recordingFileName = recordingFileName;
  await call.save();

  res.json(call);
});

// Register device for push notifications
const registerDevice = asyncHandler(async (req, res) => {
  const { deviceToken, platform } = req.body;

  if (!deviceToken) {
    res.status(400);
    throw new Error("Device token required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.deviceToken = deviceToken;
  user.platform = platform || 'web';
  await user.save();

  res.json({ message: "Device registered" });
});

// Send push notification (stub)
const sendPushNotification = asyncHandler(async (req, res) => {
  const { userId, title, body } = req.body;
  const user = await User.findById(userId);

  if (!user || !user.deviceToken) {
    return res.json({ sent: false, reason: "No device token" });
  }

  // Here you would integrate with FCM
  // For now, just return success
  console.log(`Push notification to ${userId}: ${title} - ${body}`);

  res.json({ sent: true });
});

export {
  getCallHistory,
  getCallDetails,
  updateCallRecording,
  registerDevice,
  sendPushNotification
};