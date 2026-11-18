const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

// 1. Quản lý dự án cơ bản
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);

// 2. Lời mời tham gia dự án (Lưu ý: đặt trước route /:id để tránh xung đột params)
router.get('/invitations/me', projectController.getPendingInvitations);
router.post('/:id/invitations/accept', projectController.acceptInvitation);
router.post('/:id/invitations/decline', projectController.declineInvitation);

// 3. Mời thêm thành viên và lấy danh sách thành viên dự án
router.post('/:id/invite', projectController.inviteMembers);
router.get('/:id/members', projectController.getProjectMembers);

// 4. Chi tiết và xóa dự án
router.get('/:id', projectController.getProjectById);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
