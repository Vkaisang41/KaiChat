import express from "express";
import asyncHandler from "express-async-handler";
import Africastalking from "africastalking";

const router = express.Router();

// ✅ Configure Africa's Talking
const at = Africastalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});

const sms = at.SMS;

// Temporary store for codes (⚠️ production apps should use DB/Redis)
const codes = {};

// @desc Send verification code
// @route POST /api/verify/send
// @access Public
router.post(
  "/send",
  asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400);
      throw new Error("Phone number is required");
    }

    const code = Math.floor(100000 + Math.random() * 900000);

    codes[phoneNumber] = code;

    await sms.send({
      to: [phoneNumber],
      message: `Your KaiChat verification code is ${code}`,
      from: "KaiChat",
    });

    res.json({ success: true, message: "Verification code sent" });
  })
);

// @desc Check verification code
// @route POST /api/verify/check
// @access Public
router.post(
  "/check",
  asyncHandler(async (req, res) => {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      res.status(400);
      throw new Error("Phone number and code are required");
    }

    if (codes[phoneNumber] && codes[phoneNumber].toString() === code.toString()) {
      delete codes[phoneNumber];
      res.json({ success: true, message: "Phone number verified!" });
    } else {
      res.status(400);
      throw new Error("Invalid verification code");
    }
  })
);

export default router;

