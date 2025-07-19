const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    google_id: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    access_token: {
      type: String,
      required: true,
    },
    refresh_token: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
