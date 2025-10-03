import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import Call from "../models/Call.js";

let connectedUsers = 0;
let typingUsers = new Map(); // room -> Set of user IDs

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    connectedUsers++;
    console.log("User connected:", socket.id, "Total users:", connectedUsers);

    const userId = socket.user._id.toString();

    // Join global room
    socket.join("global");

    // Update user presence to online
    User.findByIdAndUpdate(userId, {
      isOnline: true,
      presence: 'online',
      lastSeen: new Date()
    }).then(() => {
      io.to("global").emit("presenceUpdate", { userId, presence: 'online' });
    });

    // Join user's groups
    socket.on("joinGroup", async (data) => {
      const { groupId } = data;
      try {
        const group = await Group.findById(groupId);
        if (group) {
          const isMember = group.members.some(member =>
            member.user.toString() === userId
          );

          if (isMember) {
            const roomName = `group-${groupId}`;
            socket.join(roomName);
            console.log(`User ${userId} joined group room: ${roomName}`);
          }
        }
      } catch (error) {
        console.error("Error joining group:", error);
      }
    });

    // Leave group room
    socket.on("leaveGroup", (data) => {
      const { groupId } = data;
      const roomName = `group-${groupId}`;
      socket.leave(roomName);
      console.log(`User ${userId} left group room: ${roomName}`);
    });

    // Emit user count to all users
    io.to("global").emit("userCount", connectedUsers);

    // Send message
    socket.on("sendMessage", async (data) => {
      const { message, user, replyTo, threadId, messageType, fileUrl, fileName, fileSize, mimeType, room = "global" } = data;

      // Check group membership if it's a group room
      if (room.startsWith('group-')) {
        const groupId = room.replace('group-', '');
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit("error", { message: "Group not found" });
          return;
        }

        const isMember = group.members.some(member =>
          member.user.toString() === userId
        );

        if (!isMember) {
          socket.emit("error", { message: "You are not a member of this group" });
          return;
        }

        // Update group's last message and message count
        group.lastMessage = null; // Will be set after message creation
        group.messageCount += 1;
        await group.save();
      }

      const newMessage = new Message({
        content: messageType === 'text' ? message : null,
        messageType: messageType || 'text',
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        sender: user.phone || user.id,
        room,
        replyTo: replyTo || null,
        threadId: threadId || null
      });
      await newMessage.save();

      // Update group's last message if it's a group message
      if (room.startsWith('group-')) {
        const groupId = room.replace('group-', '');
        await Group.findByIdAndUpdate(groupId, { lastMessage: newMessage._id });
      }

      // Broadcast to the appropriate room
      io.to(room).emit("receiveMessage", {
        _id: newMessage._id,
        content: newMessage.content,
        messageType: newMessage.messageType,
        fileUrl: newMessage.fileUrl,
        fileName: newMessage.fileName,
        fileSize: newMessage.fileSize,
        mimeType: newMessage.mimeType,
        sender: user.phone || user.username,
        timestamp: newMessage.timestamp,
        replyTo: newMessage.replyTo,
        threadId: newMessage.threadId,
        reactions: newMessage.reactions,
        readBy: newMessage.readBy,
        room: newMessage.room
      });
    });

    // Start typing
    socket.on("startTyping", (data) => {
      const { room = "global" } = data;

      // Check group membership for group rooms
      if (room.startsWith('group-')) {
        const groupId = room.replace('group-', '');
        // We assume the user is already in the room if they can send typing events
        // Additional validation could be added here if needed
      }

      if (!typingUsers.has(room)) {
        typingUsers.set(room, new Set());
      }
      typingUsers.get(room).add(userId);

      socket.to(room).emit("typingStarted", { userId, room });
    });

    // Stop typing
    socket.on("stopTyping", (data) => {
      const { room = "global" } = data;
      if (typingUsers.has(room)) {
        typingUsers.get(room).delete(userId);
        socket.to(room).emit("typingStopped", { userId, room });
      }
    });

    // Message read
    socket.on("messageRead", async (data) => {
      const { messageId, room = "global" } = data;
      try {
        const message = await Message.findById(messageId);
        if (message && !message.readBy.find(r => r.user === userId)) {
          message.readBy.push({ user: userId, timestamp: new Date() });
          await message.save();

          io.to(room).emit("messageReadUpdate", {
            messageId,
            userId,
            timestamp: new Date(),
            room
          });
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // Call signaling events
    socket.on("callRequest", async (data) => {
      const { calleeId, type, isGroupCall = false } = data;
      try {
        const callee = await User.findById(calleeId);
        if (!callee) {
          socket.emit("callError", { message: "User not found" });
          return;
        }

        const roomId = `call-${userId}-${calleeId}-${Date.now()}`;
        const call = new Call({
          caller: userId,
          callee: calleeId,
          type,
          roomId,
          isGroupCall
        });
        await call.save();

        // Join call room
        socket.join(roomId);
        io.to(calleeId.toString()).emit("incomingCall", {
          callId: call._id,
          caller: {
            _id: socket.user._id,
            fullName: socket.user.fullName,
            username: socket.user.username,
            profilePicture: socket.user.profilePicture
          },
          type,
          roomId
        });
      } catch (error) {
        console.error("Error initiating call:", error);
        socket.emit("callError", { message: "Failed to initiate call" });
      }
    });

    socket.on("callAccept", async (data) => {
      const { callId } = data;
      try {
        const call = await Call.findById(callId);
        if (!call || call.callee.toString() !== userId) {
          socket.emit("callError", { message: "Call not found or unauthorized" });
          return;
        }

        call.status = 'ongoing';
        call.participants = [
          { user: call.caller, joinedAt: call.startTime },
          { user: call.callee, joinedAt: new Date() }
        ];
        await call.save();

        socket.join(call.roomId);
        io.to(call.roomId).emit("callAccepted", {
          callId: call._id,
          participants: call.participants
        });
      } catch (error) {
        console.error("Error accepting call:", error);
        socket.emit("callError", { message: "Failed to accept call" });
      }
    });

    socket.on("callReject", async (data) => {
      const { callId } = data;
      try {
        const call = await Call.findById(callId);
        if (!call || call.callee.toString() !== userId) {
          return;
        }

        call.status = 'declined';
        call.endTime = new Date();
        await call.save();

        io.to(call.roomId).emit("callRejected", { callId });
      } catch (error) {
        console.error("Error rejecting call:", error);
      }
    });

    socket.on("callEnd", async (data) => {
      const { callId } = data;
      try {
        const call = await Call.findById(callId);
        if (!call) return;

        const isCaller = call.caller.toString() === userId;
        const isCallee = call.callee.toString() === userId;

        if (!isCaller && !isCallee) return;

        call.status = 'ended';
        call.endTime = new Date();
        if (call.startTime && call.endTime) {
          call.duration = Math.floor((call.endTime - call.startTime) / 1000);
        }
        await call.save();

        io.to(call.roomId).emit("callEnded", { callId, duration: call.duration });
      } catch (error) {
        console.error("Error ending call:", error);
      }
    });

    // WebRTC signaling
    socket.on("offer", (data) => {
      const { offer, roomId } = data;
      socket.to(roomId).emit("offer", { offer, from: userId });
    });

    socket.on("answer", (data) => {
      const { answer, roomId } = data;
      socket.to(roomId).emit("answer", { answer, from: userId });
    });

    socket.on("iceCandidate", (data) => {
      const { candidate, roomId } = data;
      socket.to(roomId).emit("iceCandidate", { candidate, from: userId });
    });

    socket.on("disconnect", () => {
      connectedUsers--;
      console.log("User disconnected:", socket.id, "Total users:", connectedUsers);

      // Update user presence to offline
      if (userId) {
        User.findByIdAndUpdate(userId, {
          isOnline: false,
          presence: 'offline',
          lastSeen: new Date(),
          typingIn: null
        }).then(() => {
          io.to("global").emit("presenceUpdate", { userId, presence: 'offline' });
        });
      }

      // Remove from typing users
      typingUsers.forEach((users, room) => {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(room).emit("typingStopped", { userId, room });
        }
      });

      io.to("global").emit("userCount", connectedUsers);
    });
  });
};

export default chatSocket;