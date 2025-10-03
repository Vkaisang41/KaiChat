import mongoose from "mongoose";

const emojiSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Emoji name is required"],
      maxlength: 50,
    },
    url: {
      type: String,
      required: [true, "Emoji URL is required"],
    },
    type: {
      type: String,
      enum: ["emoji", "sticker"],
      default: "emoji",
    },
    category: {
      type: String,
      default: "custom",
      maxlength: 50,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      maxlength: 30,
    }],
    usageCount: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
emojiSchema.index({ name: "text", category: "text", tags: "text" });
emojiSchema.index({ uploadedBy: 1 });
emojiSchema.index({ isPublic: 1, usageCount: -1 });

const Emoji = mongoose.model("Emoji", emojiSchema);

export default Emoji;