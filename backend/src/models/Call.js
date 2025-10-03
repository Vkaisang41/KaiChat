import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['ringing', 'ongoing', 'ended', 'missed', 'declined'],
    default: 'ringing'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date
    }
  }],
  recordingUrl: {
    type: String
  },
  recordingFileName: {
    type: String
  },
  roomId: {
    type: String, // for group calls or unique call room
    required: true
  },
  isGroupCall: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
callSchema.index({ caller: 1, startTime: -1 });
callSchema.index({ callee: 1, startTime: -1 });
callSchema.index({ roomId: 1 });

const Call = mongoose.model("Call", callSchema);

export default Call;