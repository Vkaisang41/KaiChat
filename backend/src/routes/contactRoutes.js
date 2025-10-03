import express from "express";
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  toggleBlockContact,
  importContacts,
  syncContactsWithUsers,
  getContactSuggestions
} from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Contact CRUD routes
router.route("/")
  .get(getContacts)
  .post(createContact);

router.route("/:id")
  .get(getContact)
  .put(updateContact)
  .delete(deleteContact);

// Contact management routes
router.put("/:id/block", toggleBlockContact);
router.post("/import", importContacts);
router.post("/sync", syncContactsWithUsers);
router.get("/suggestions/users", getContactSuggestions);

export default router;