import asyncHandler from "express-async-handler";
import Group from "../models/Group.js";
import User from "../models/User.js";

// Create a new group
export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, avatar, isPrivate, maxMembers } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Group name is required");
  }

  const group = await Group.create({
    name,
    description: description || "",
    avatar: avatar || "",
    creator: req.user.id,
    admins: [req.user.id],
    members: [{
      user: req.user.id,
      role: "admin",
      joinedAt: new Date(),
    }],
    settings: {
      isPrivate: isPrivate || false,
      maxMembers: maxMembers || 100,
    },
  });

  const populatedGroup = await Group.findById(group._id)
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture");

  res.status(201).json(populatedGroup);
});

// Get all groups for a user
export const getUserGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({
    "members.user": req.user.id,
  })
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  res.json(groups);
});

// Get group details
export const getGroupDetails = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture")
    .populate("lastMessage");

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check if user is a member
  const isMember = group.members.some(member =>
    member.user._id.toString() === req.user.id
  );

  if (!isMember) {
    res.status(403);
    throw new Error("Access denied. You are not a member of this group");
  }

  res.json(group);
});

// Update group settings
export const updateGroup = asyncHandler(async (req, res) => {
  const { name, description, avatar, settings } = req.body;
  const group = await Group.findById(req.params.id);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check if user is admin
  const isAdmin = group.admins.some(admin =>
    admin.toString() === req.user.id
  );

  if (!isAdmin) {
    res.status(403);
    throw new Error("Access denied. Only admins can update group settings");
  }

  // Update fields
  if (name !== undefined) group.name = name;
  if (description !== undefined) group.description = description;
  if (avatar !== undefined) group.avatar = avatar;
  if (settings) {
    group.settings = { ...group.settings, ...settings };
  }

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture");

  res.json(updatedGroup);
});

// Add member to group
export const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const group = await Group.findById(req.params.id);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check if user is admin or if invites are allowed
  const isAdmin = group.admins.some(admin =>
    admin.toString() === req.user.id
  );

  if (!isAdmin && !group.settings.allowInvites) {
    res.status(403);
    throw new Error("Access denied. Only admins can add members");
  }

  // Check if user is already a member
  const existingMember = group.members.find(member =>
    member.user.toString() === userId
  );

  if (existingMember) {
    res.status(400);
    throw new Error("User is already a member of this group");
  }

  // Check member limit
  if (group.members.length >= group.settings.maxMembers) {
    res.status(400);
    throw new Error("Group has reached maximum member limit");
  }

  // Add member
  group.members.push({
    user: userId,
    role: "member",
    joinedAt: new Date(),
  });

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture");

  res.json(updatedGroup);
});

// Remove member from group
export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const group = await Group.findById(req.params.id);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check permissions
  const isAdmin = group.admins.some(admin =>
    admin.toString() === req.user.id
  );
  const isSelfRemoval = userId === req.user.id;
  const targetMember = group.members.find(member =>
    member.user.toString() === userId
  );

  if (!targetMember) {
    res.status(404);
    throw new Error("User is not a member of this group");
  }

  // Only admins can remove others, users can remove themselves
  if (!isAdmin && !isSelfRemoval) {
    res.status(403);
    throw new Error("Access denied. Only admins can remove other members");
  }

  // Cannot remove the creator
  if (userId === group.creator.toString()) {
    res.status(400);
    throw new Error("Cannot remove the group creator");
  }

  // Remove from members
  group.members = group.members.filter(member =>
    member.user.toString() !== userId
  );

  // Remove from admins if they were admin
  group.admins = group.admins.filter(admin =>
    admin.toString() !== userId
  );

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture");

  res.json(updatedGroup);
});

// Promote member to admin
export const promoteToAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const group = await Group.findById(req.params.id);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check if requester is admin
  const isAdmin = group.admins.some(admin =>
    admin.toString() === req.user.id
  );

  if (!isAdmin) {
    res.status(403);
    throw new Error("Access denied. Only admins can promote members");
  }

  // Check if user is a member
  const member = group.members.find(member =>
    member.user.toString() === userId
  );

  if (!member) {
    res.status(404);
    throw new Error("User is not a member of this group");
  }

  // Check if already admin
  const isAlreadyAdmin = group.admins.some(admin =>
    admin.toString() === userId
  );

  if (isAlreadyAdmin) {
    res.status(400);
    throw new Error("User is already an admin");
  }

  // Add to admins
  group.admins.push(userId);
  member.role = "admin";

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture");

  res.json(updatedGroup);
});

// Demote admin to member
export const demoteFromAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const group = await Group.findById(req.params.id);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check if requester is admin
  const isAdmin = group.admins.some(admin =>
    admin.toString() === req.user.id
  );

  if (!isAdmin) {
    res.status(403);
    throw new Error("Access denied. Only admins can demote admins");
  }

  // Cannot demote the creator
  if (userId === group.creator.toString()) {
    res.status(400);
    throw new Error("Cannot demote the group creator");
  }

  // Check if user is admin
  const isTargetAdmin = group.admins.some(admin =>
    admin.toString() === userId
  );

  if (!isTargetAdmin) {
    res.status(400);
    throw new Error("User is not an admin");
  }

  // Remove from admins
  group.admins = group.admins.filter(admin =>
    admin.toString() !== userId
  );

  // Update member role
  const member = group.members.find(member =>
    member.user.toString() === userId
  );
  if (member) {
    member.role = "member";
  }

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture");

  res.json(updatedGroup);
});

// Join group via invite code
export const joinGroupByCode = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;

  const group = await Group.findOne({ inviteCode });

  if (!group) {
    res.status(404);
    throw new Error("Invalid invite code");
  }

  if (!group.settings.isPrivate) {
    res.status(400);
    throw new Error("This group is not private");
  }

  // Check if user is already a member
  const existingMember = group.members.find(member =>
    member.user.toString() === req.user.id
  );

  if (existingMember) {
    res.status(400);
    throw new Error("You are already a member of this group");
  }

  // Check member limit
  if (group.members.length >= group.settings.maxMembers) {
    res.status(400);
    throw new Error("Group has reached maximum member limit");
  }

  // Add member
  group.members.push({
    user: req.user.id,
    role: "member",
    joinedAt: new Date(),
  });

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate("creator", "fullName username profilePicture")
    .populate("admins", "fullName username profilePicture")
    .populate("members.user", "fullName username profilePicture");

  res.json(updatedGroup);
});

// Delete group
export const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Only creator can delete group
  if (group.creator.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied. Only the group creator can delete the group");
  }

  await Group.findByIdAndDelete(req.params.id);

  res.json({ message: "Group deleted successfully" });
});