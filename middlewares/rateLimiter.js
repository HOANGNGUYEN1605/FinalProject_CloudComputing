const rateLimit = require('express-rate-limit');

// Rate limiting chuẩn cho API Cloud: tối đa 200 request / 15 phút trên 1 IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: 'Hệ thống phát hiện quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting khắt khe hơn cho Authentication (ngăn chặn Brute Force mật khẩu)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter };
