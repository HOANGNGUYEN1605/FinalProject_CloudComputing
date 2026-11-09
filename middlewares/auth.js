const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vku_cloud_computing_super_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Yêu cầu token xác thực (Vui lòng đăng nhập)' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Bạn không có quyền truy cập (Yêu cầu vai trò: ${role})` });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, JWT_SECRET };
