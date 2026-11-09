const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const taskController = require('../controllers/taskController');
const upload = require('../middlewares/upload');
const { JWT_SECRET } = require('../middlewares/auth');

// Optional auth middleware: nếu có token hợp lệ thì gán req.user, nếu token lỗi/hết hạn thì vẫn cho qua (không block)
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

router.get('/', optionalAuth, taskController.getTasks);
router.post('/', optionalAuth, taskController.createTask);
router.put('/:id', optionalAuth, taskController.updateTask);
router.delete('/:id', optionalAuth, taskController.deleteTask);

// Đính kèm tệp lên Task
router.post('/:id/attachments', upload.single('file'), taskController.uploadAttachment);

// Xuất báo cáo công việc ra Excel
router.get('/actions/export', taskController.exportTasksReport);

module.exports = router;
