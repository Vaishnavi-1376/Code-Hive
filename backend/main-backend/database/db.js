const mongoose = require('mongoose');

const DBConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connection established');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = { DBConnection };
