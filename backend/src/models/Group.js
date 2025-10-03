import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a group name"],
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    settings: {
      isPrivate: {
        type: Boolean,
        default: false,
      },
      allowInvites: {
        type: Boolean,
        default: true,
      },
      maxMembers: {
        type: Number,
        default: 100,
      },
      messageApproval: {
        type: Boolean,
        default: false,
      },
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
groupSchema.index({ "members.user": 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ name: "text", description: "text" });

// Pre-save middleware to generate invite code for private groups
groupSchema.pre("save", function(next) {
  if (this.settings.isPrivate && !this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  next();
});

const Group = mongoose.model("Group", groupSchema);

export default Group;