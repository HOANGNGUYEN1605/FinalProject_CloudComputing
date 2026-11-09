const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên người dùng không được để trống'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email không được để trống'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    password: {
      type: String,
      default: ''
    },
    googleId: {
      type: String,
      default: null
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
