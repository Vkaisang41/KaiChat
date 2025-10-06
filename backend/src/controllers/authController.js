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
  try {
    console.log('📱 Phone auth request received:', req.body);

    const { phone, firebaseUid } = req.body;

    if (!phone || !firebaseUid) {
      console.error('❌ Phone and firebaseUid are required');
      return res.status(400).json({
        message: "Phone and firebaseUid are required"
      });
    }

    console.log(`📱 Authenticating user with phone: ${phone}, firebaseUid: ${firebaseUid}`);

    // First check by firebaseUid, then by phone number
    let user = await User.findOne({
      $or: [
        { firebaseUid },
        { phone }
      ]
    });

    console.log(`📱 User lookup result:`, user ? 'found' : 'not found');

    if (!user) {
      // Create new user only if no user exists with this phone or firebaseUid
      try {
        console.log(`📱 Creating new user for phone: ${phone}`);
        user = await User.create({
          fullName: `User ${phone}`,
          username: phone,
          phone,
          firebaseUid,
        });
        console.log(`📱 New user created:`, user._id);
      } catch (error) {
        console.error('❌ Error creating user:', error);
        // Handle duplicate key error
        if (error.code === 11000) {
          console.log('📱 Duplicate key error, finding existing user');
          // If duplicate error, try to find the existing user
          user = await User.findOne({
            $or: [
              { firebaseUid },
              { phone },
              { username: phone }
            ]
          });

          if (!user) {
            console.error('❌ User creation failed due to duplicate data');
            return res.status(400).json({
              message: "User creation failed due to duplicate data"
            });
          }

          // Update the existing user with the new firebaseUid if needed
          if (!user.firebaseUid && firebaseUid) {
            user.firebaseUid = firebaseUid;
            await user.save();
            console.log(`📱 Updated existing user with firebaseUid`);
          }
        } else {
          console.error('❌ Unexpected error creating user:', error);
          return res.status(500).json({
            message: "Internal server error",
            error: error.message
          });
        }
      }
    } else {
      console.log(`📱 Found existing user:`, user._id);
      // Update existing user's firebaseUid if it's different
      if (user.firebaseUid !== firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
        console.log(`📱 Updated user firebaseUid`);
      }

      // Update phone if it's different
      if (user.phone !== phone) {
        user.phone = phone;
        await user.save();
        console.log(`📱 Updated user phone`);
      }
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not set');
      return res.status(500).json({
        message: "Server configuration error"
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    console.log(`📱 Authentication successful for user:`, user._id);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      phone: user.phone,
      profilePicture: user.profilePicture,
      status: user.status,
      token,
    });
  } catch (error) {
    console.error('❌ Error in phoneAuth:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});

// Send verification code
export const sendVerificationCode = asyncHandler(async (req, res) => {
  try {
    console.log('📱 Send verification code request received:', req.body);

    const { phone } = req.body;

    if (!phone) {
      console.error('❌ Phone number is required');
      return res.status(400).json({
        message: "Phone number is required"
      });
    }

    console.log(`📱 Generating code for phone: ${phone}`);

    // Generate and store unique verification code
    const code = storeVerificationCode(phone);

    console.log(`📱 Generated code: ${code} for phone: ${phone}`);

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
  } catch (error) {
    console.error('❌ Error in sendVerificationCode:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});

// Verify code endpoint
export const verifyVerificationCode = asyncHandler(async (req, res) => {
  try {
    console.log('📱 Verify code request received:', req.body);

    const { phone, code } = req.body;

    if (!phone || !code) {
      console.error('❌ Phone number and verification code are required');
      return res.status(400).json({
        message: "Phone number and verification code are required"
      });
    }

    console.log(`📱 Verifying code for phone: ${phone}, code: ${code}`);

    const result = verifyCode(phone, code);

    console.log(`📱 Verification result:`, result);

    if (!result.success) {
      console.error(`❌ Code verification failed: ${result.error}`);
      return res.status(400).json({
        message: result.error
      });
    }

    console.log(`📱 Code verified successfully for phone: ${phone}`);

    res.status(200).json({
      message: "Code verified successfully",
      phone: phone
    });
  } catch (error) {
    console.error('❌ Error in verifyVerificationCode:', error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
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
