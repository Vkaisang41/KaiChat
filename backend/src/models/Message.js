import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    }
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document', 'voice'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    required: function() {
      return ['image', 'video', 'document', 'voice'].includes(this.messageType);
    }
  },
  fileName: {
    type: String,
    required: function() {
      return ['image', 'video', 'document', 'voice'].includes(this.messageType);
    }
  },
  fileSize: {
    type: Number,
    required: function() {
      return ['image', 'video', 'document', 'voice'].includes(this.messageType);
    }
  },
  mimeType: {
    type: String,
    required: function() {
      return ['image', 'video', 'document', 'voice'].includes(this.messageType);
    }
  },
  sender: {
    type: String, // phone or user id
    required: true
  },
  room: {
    type: String,
    default: "global"
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  reactions: [{
    user: {
      type: String, // user id
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  readBy: [{
    user: {
      type: String, // user id
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

const Message = mongoose.model("Message", messageSchema);

export default Message;