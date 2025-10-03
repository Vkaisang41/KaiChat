import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "./src/models/User.js";

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function fixDuplicateUsers() {
  try {
    console.log("🔍 Checking for duplicate users...");
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} total users`);
    
    // Group users by phone number
    const phoneGroups = {};
    const usernameGroups = {};
    
    users.forEach(user => {
      if (user.phone) {
        if (!phoneGroups[user.phone]) {
          phoneGroups[user.phone] = [];
        }
        phoneGroups[user.phone].push(user);
      }
      
      if (user.username) {
        if (!usernameGroups[user.username]) {
          usernameGroups[user.username] = [];
        }
        usernameGroups[user.username].push(user);
      }
    });
    
    // Find duplicates by phone
    let duplicatesRemoved = 0;
    
    for (const [phone, userList] of Object.entries(phoneGroups)) {
      if (userList.length > 1) {
        console.log(`📱 Found ${userList.length} users with phone ${phone}`);
        
        // Keep the first user (oldest), remove the rest
        const keepUser = userList[0];
        const removeUsers = userList.slice(1);
        
        console.log(`  ✅ Keeping user: ${keepUser._id} (${keepUser.fullName})`);
        
        for (const user of removeUsers) {
          console.log(`  🗑️ Removing duplicate user: ${user._id} (${user.fullName})`);
          await User.findByIdAndDelete(user._id);
          duplicatesRemoved++;
        }
      }
    }
    
    // Find duplicates by username
    for (const [username, userList] of Object.entries(usernameGroups)) {
      if (userList.length > 1) {
        console.log(`👤 Found ${userList.length} users with username ${username}`);
        
        // Keep the first user (oldest), remove the rest
        const keepUser = userList[0];
        const removeUsers = userList.slice(1);
        
        console.log(`  ✅ Keeping user: ${keepUser._id} (${keepUser.fullName})`);
        
        for (const user of removeUsers) {
          // Only remove if it's not already removed by phone cleanup
          const stillExists = await User.findById(user._id);
          if (stillExists) {
            console.log(`  🗑️ Removing duplicate user: ${user._id} (${user.fullName})`);
            await User.findByIdAndDelete(user._id);
            duplicatesRemoved++;
          }
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete! Removed ${duplicatesRemoved} duplicate users.`);
    
    // Show final count
    const finalCount = await User.countDocuments();
    console.log(`📊 Final user count: ${finalCount}`);
    
  } catch (error) {
    console.error("❌ Error fixing duplicate users:", error);
  } finally {
    mongoose.connection.close();
  }
}

fixDuplicateUsers();