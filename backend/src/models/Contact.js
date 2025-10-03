import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    avatar: {
      type: String,
      default: "👤", // Default avatar emoji
    },
    status: {
      type: String,
      default: "",
      maxlength: 100,
    },
    isRegistered: {
      type: Boolean,
      default: false, // Whether this contact is a registered KaiChat user
    },
    registeredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Reference to User if they're registered
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastMessageTime: {
      type: Date,
      default: null,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    // Additional contact info
    nickname: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    // Contact source (manual, imported, synced)
    source: {
      type: String,
      enum: ['manual', 'imported', 'synced', 'auto'],
      default: 'manual',
    },
    // Sync info for phone contacts
    phoneContactId: {
      type: String,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
contactSchema.index({ owner: 1, phone: 1 }, { unique: true });
contactSchema.index({ owner: 1, name: 1 });
contactSchema.index({ owner: 1, isFavorite: -1, lastMessageTime: -1 });
contactSchema.index({ registeredUser: 1 });

// Virtual for checking if contact is online (if registered)
contactSchema.virtual('isOnline').get(function() {
  return this.registeredUser && this.registeredUser.isOnline;
});

// Method to check if contact is a registered user
contactSchema.methods.checkRegistration = async function() {
  const User = mongoose.model('User');
  const user = await User.findOne({ phone: this.phone });
  
  if (user) {
    this.isRegistered = true;
    this.registeredUser = user._id;
    await this.save();
    return user;
  }
  
  return null;
};

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;