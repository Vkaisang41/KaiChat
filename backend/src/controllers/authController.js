import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import {
  storeVerificationCode,
  verifyCode,
  getVerificationCode
} from "../utils/verificationCodes.js";

// Register user
export const register = asyncHandler(async (req, res) => {
  const { fullName, username, email, password, confirmPassword } = req.body;

  if (!fullName || !username || !email || !password || !confirmPassword) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  // Check if user exists
  const userExists = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    fullName,
    username,
    email,
    password: hashedPassword,
  });

  if (user) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    res.status(400);
    throw new Error("Please provide username/email and password");
  }

  // Find user by username or email
  const user = await User.findOne({
    $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      token,
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

// Phone auth
export const phoneAuth = asyncHandler(async (req, res) => {
  const { phone, firebaseUid } = req.body;

  if (!phone || !firebaseUid) {
    res.status(400);
    throw new Error("Phone and firebaseUid are required");
  }

  // First check by firebaseUid, then by phone number
  let user = await User.findOne({
    $or: [
      { firebaseUid },
      { phone }
    ]
  });

  if (!user) {
    // Create new user only if no user exists with this phone or firebaseUid
    try {
      user = await User.create({
        fullName: `User ${phone}`,
        username: phone,
        phone,
        firebaseUid,
      });
    } catch (error) {
      // Handle duplicate key error
      if (error.code === 11000) {
        // If duplicate error, try to find the existing user
        user = await User.findOne({
          $or: [
            { firebaseUid },
            { phone },
            { username: phone }
          ]
        });
        
        if (!user) {
          res.status(400);
          throw new Error("User creation failed due to duplicate data");
        }
        
        // Update the existing user with the new firebaseUid if needed
        if (!user.firebaseUid && firebaseUid) {
          user.firebaseUid = firebaseUid;
          await user.save();
        }
      } else {
        throw error;
      }
    }
  } else {
    // Update existing user's firebaseUid if it's different
    if (user.firebaseUid !== firebaseUid) {
      user.firebaseUid = firebaseUid;
      await user.save();
    }
    
    // Update phone if it's different
    if (user.phone !== phone) {
      user.phone = phone;
      await user.save();
    }
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.status(200).json({
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    phone: user.phone,
    profilePicture: user.profilePicture,
    status: user.status,
    token,
  });
});

// Send verification code
export const sendVerificationCode = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error("Phone number is required");
  }

  // Generate and store unique verification code
  const code = storeVerificationCode(phone);
  
  // Always return the code for testing (remove this in production)
  console.log(`📱 Verification code for ${phone}: ${code}`);
  return res.status(200).json({
    message: "Verification code sent successfully",
    code: code, // For testing purposes
    phone: phone
  });

  // In production, you would send SMS here and NOT return the code
  // Example: await sendSMS(phone, `Your KaiChat verification code is: ${code}`);
  /*
  res.status(200).json({
    message: "Verification code sent successfully",
    phone: phone
  });
  */
});

// Verify code endpoint
export const verifyVerificationCode = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400);
    throw new Error("Phone number and verification code are required");
  }

  const result = verifyCode(phone, code);
  
  if (!result.success) {
    res.status(400);
    throw new Error(result.error);
  }

  res.status(200).json({
    message: "Code verified successfully",
    phone: phone
  });
});

// Get verification code (for development/testing only)
export const getVerificationCodeForTesting = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  if (process.env.NODE_ENV === 'production') {
    res.status(403);
    throw new Error("This endpoint is not available in production");
  }

  const code = getVerificationCode(phone);
  
  if (!code) {
    res.status(404);
    throw new Error("No verification code found for this phone number");
  }

  res.status(200).json({
    phone: phone,
    code: code
  });
});
