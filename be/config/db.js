const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

const DBConnect = () => {
  try {
    mongoose.connect(MONGO_URI);
    console.log("Successfully connected to MongoDB.");
  } catch (err) {
    console.error("Connection error", err);
  }
};

module.exports = DBConnect;
