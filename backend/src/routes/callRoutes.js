import express from "express";
import {
  getCallHistory,
  getCallDetails,
  updateCallRecording,
  registerDevice,
  sendPushNotification
} from "../controllers/callController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route("/history").get(getCallHistory);
router.route("/:id").get(getCallDetails);
router.route("/:id/recording").put(updateCallRecording);
router.route("/register-device").post(registerDevice);
router.route("/send-notification").post(sendPushNotification);

export default router;