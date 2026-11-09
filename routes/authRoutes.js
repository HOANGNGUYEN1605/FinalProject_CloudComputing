const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

router.get('/config', authController.getAuthConfig);
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.googleLogin);
router.get('/me', authenticateToken, authController.getMe);
router.get('/users', authenticateToken, authController.getAllUsers);

module.exports = router;
