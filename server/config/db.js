const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected Successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Failure: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
