import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  addMember,
  removeMember,
  promoteToAdmin,
  demoteFromAdmin,
  joinGroupByCode,
  deleteGroup,
} from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Group CRUD operations
router.route("/")
  .post(createGroup)      // Create new group
  .get(getUserGroups);    // Get user's groups

router.route("/:id")
  .get(getGroupDetails)   // Get group details
  .put(updateGroup)       // Update group settings
  .delete(deleteGroup);   // Delete group

// Member management
router.post("/:id/members", addMember);           // Add member
router.delete("/:id/members", removeMember);      // Remove member

// Admin management
router.post("/:id/admins", promoteToAdmin);       // Promote to admin
router.delete("/:id/admins", demoteFromAdmin);    // Demote from admin

// Join group
router.post("/join/code", joinGroupByCode);       // Join via invite code

export default router;