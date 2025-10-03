// src/utils/sms.js
import africastalking from "africastalking";

const at = africastalking({
  apiKey: process.env.AT_API_KEY,    // from .env
  username: process.env.AT_USERNAME, // usually "sandbox" for testing
});

export const sendSms = async (phone, message) => {
  try {
    const result = await at.SMS.send({
      to: phone,        // e.g. "+254712345678"
      message: message, // message content
    });
    console.log("✅ SMS sent:", result);
    return result;
  } catch (err) {
    console.error("❌ SMS failed:", err);
    throw new Error("Failed to send SMS");
  }
};
