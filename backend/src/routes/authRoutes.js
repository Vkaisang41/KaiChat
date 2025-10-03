import express from "express";
import {
  register,
  login,
  phoneAuth,
  sendVerificationCode,
  verifyVerificationCode,
  getVerificationCodeForTesting
} from "../controllers/authController.js";

const router = express.Router();

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/phone-auth", phoneAuth);
router.post("/send-code", sendVerificationCode);
router.post("/verify-code", verifyVerificationCode);

// Development/testing only
if (process.env.NODE_ENV !== 'production') {
  router.get("/get-code/:phone", getVerificationCodeForTesting);
}

export default router;
