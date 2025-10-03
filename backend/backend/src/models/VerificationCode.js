// src/models/VerificationCode.js
import mongoose from "mongoose";

const verificationCodeSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

export default mongoose.model("VerificationCode", verificationCodeSchema);
