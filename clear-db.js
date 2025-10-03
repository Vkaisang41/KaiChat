const mongoose = require('mongoose');

async function clearDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/KaiChat');
    console.log('Connected to MongoDB');

    // Drop the entire database
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

clearDatabase();