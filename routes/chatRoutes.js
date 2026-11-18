const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const chatController = require('../controllers/chatController');
const { JWT_SECRET } = require('../middlewares/auth');

// Middleware optionalAuth: Nhận diện người dùng nếu đã đăng nhập mà không chặn nếu chưa đăng nhập
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
};

// 1. Gửi tin nhắn đến Trợ lý thông minh
router.post('/message', optionalAuth, chatController.processMessage);

// 2. Lấy tóm tắt nhanh số lượng việc cần nhắc nhở (cho badge thông báo)
router.get('/reminders', optionalAuth, chatController.getReminders);

module.exports = router;
