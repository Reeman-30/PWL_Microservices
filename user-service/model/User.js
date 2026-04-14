const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  email: String,
  username: String,
  password: String,
  is_active: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
