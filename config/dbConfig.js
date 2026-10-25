const mongoose = require('mongoose');
const { appEnv } = require('./env');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Fail fast so /health can report the problem instead of hanging.
      serverSelectionTimeoutMS: 5000,
      // Production indexes are created by migrations (scripts/migrate.js), not on boot.
      autoIndex: appEnv() !== 'production',
    });
    console.log(`MongoDB connected Successfully`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;
