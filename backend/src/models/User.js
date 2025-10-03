import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please add a full name"],
    },
    username: {
      type: String,
      required: [true, "Please add a username"],
      unique: true,
    },
    email: {
      type: String,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      sparse: true,
      unique: true,
    },
    firebaseUid: {
      type: String,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Hey there! I'm using KaiChat",
      maxlength: 100,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    presence: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'offline',
    },
    typingIn: {
      type: String, // room or chat id
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
