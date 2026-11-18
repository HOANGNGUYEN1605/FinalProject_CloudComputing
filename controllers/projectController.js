const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { getCache, setCache, clearCache } = require('../services/cacheService');
const { addQueueJob } = require('../services/queueService');

// Helper tách chuỗi email phân cách bởi dấu phẩy, chấm phẩy hoặc khoảng trắng
function parseEmailList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(e => String(e).trim().toLowerCase()).filter(Boolean);
  return String(raw)
    .split(/[,;\s]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 3 && e.includes('@'));
}

// 1. Lấy danh sách dự án của người dùng hiện tại
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `user_projects_${userId}`;

    // Kiểm tra cache từ Redis
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ source: 'cache', data: cached });
    }

    const projects = await Project.find({
      $or: [{ owner: userId }, { members: userId }]
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('invitations.invitedBy', 'name email')
      .sort({ updatedAt: -1 });

    // Lưu cache 60s
    await setCache(cacheKey, projects, 60);

    res.status(200).json({ source: 'database', data: projects });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải danh sách dự án: ' + err.message });
  }
};

// 2. Tạo dự án mới kèm gửi lời mời qua Gmail/Email
exports.createProject = async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Tên dự án là bắt buộc' });
    }

    const ownerUser = await User.findById(req.user.id);
    const ownerEmail = (ownerUser && ownerUser.email) ? ownerUser.email.toLowerCase() : (req.user.email || '').toLowerCase();
    const ownerName = (ownerUser && ownerUser.name) ? ownerUser.name : (req.user.name || 'Chủ dự án');

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      owner: req.user.id,
      members: [req.user.id],
      invitations: []
    });

    // Xử lý gửi lời mời đến các Gmail được nhập
    const emailsToInvite = parseEmailList(memberEmails);
    const validInvites = [];

    for (const email of emailsToInvite) {
      if (email === ownerEmail) continue; // Bỏ qua nếu nhập email chính mình
      if (validInvites.some(iv => iv.email === email)) continue; // Bỏ qua trùng lặp

      validInvites.push({
        email,
        invitedBy: req.user.id,
        status: 'PENDING',
        invitedAt: new Date()
      });

      // Bắn job gửi Email lời mời bất đồng bộ qua Queue / Nodemailer
      await addQueueJob('send-email', {
        to: email,
        subject: `[CloudBoard] Bạn nhận được lời mời tham gia dự án: ${project.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #4f46e5;">Lời mời tham gia dự án nhóm trên CloudBoard</h2>
            <p>Xin chào,</p>
            <p><b>${ownerName}</b> (${ownerEmail}) vừa mời bạn tham gia vào dự án nhóm: <b style="font-size: 16px; color: #0f172a;">${project.name}</b>.</p>
            ${description ? `<p style="background: #f1f5f9; padding: 12px; border-left: 4px solid #6366f1; border-radius: 4px;"><i>"${description}"</i></p>` : ''}
            <p>Vui lòng đăng nhập vào hệ thống tại: <a href="https://finalproject-cloudcomputing.onrender.com" style="color: #4f46e5; font-weight: bold;">CloudBoard Platform</a> để xem và <b>Chấp nhận</b> lời mời này.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Đây là email tự động từ nền tảng quản lý dự án CloudBoard (VKU Cloud Computing Final Project).</p>
          </div>
        `
      });
    }

    if (validInvites.length > 0) {
      project.invitations = validInvites;
      await project.save();
    }

    await clearCache('user_projects_');

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(201).json({
      message: `Tạo dự án thành công và đã gửi ${validInvites.length} lời mời!`,
      project: populatedProject,
      invitedCount: validInvites.length
    });
  } catch (err) {
    res.status(400).json({ error: 'Tạo dự án thất bại: ' + err.message });
  }
};

// 3. Mời thêm thành viên vào dự án hiện có bằng Gmail
exports.inviteMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberEmails } = req.body;

    const project = await Project.findById(id).populate('owner', 'name email');
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    // Chỉ chủ dự án hoặc admin mới có quyền mời thành viên
    if (project.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ chủ dự án mới có quyền gửi lời mời' });
    }

    const emailsToInvite = parseEmailList(memberEmails);
    if (emailsToInvite.length === 0) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ít nhất một địa chỉ email hợp lệ' });
    }

    const ownerName = req.user.name || project.owner.name;
    const ownerEmail = req.user.email || project.owner.email;
    let newlyInvited = 0;

    for (const email of emailsToInvite) {
      if (email === ownerEmail.toLowerCase()) continue;

      // Kiểm tra xem đã trong danh sách mời hay chưa
      const existingInvite = project.invitations.find(iv => iv.email === email && iv.status === 'PENDING');
      if (existingInvite) continue;

      // Thêm vào danh sách lời mời
      project.invitations.push({
        email,
        invitedBy: req.user.id,
        status: 'PENDING',
        invitedAt: new Date()
      });
      newlyInvited++;

      // Gửi email thông báo
      await addQueueJob('send-email', {
        to: email,
        subject: `[CloudBoard] Bạn nhận được lời mời tham gia dự án: ${project.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #4f46e5;">Lời mời tham gia dự án nhóm trên CloudBoard</h2>
            <p>Xin chào,</p>
            <p><b>${ownerName}</b> vừa mời bạn tham gia vào dự án nhóm: <b style="font-size: 16px; color: #0f172a;">${project.name}</b>.</p>
            <p>Vui lòng đăng nhập vào hệ thống tại: <a href="https://finalproject-cloudcomputing.onrender.com" style="color: #4f46e5; font-weight: bold;">CloudBoard Platform</a> để xem và <b>Chấp nhận</b> lời mời này.</p>
          </div>
        `
      });
    }

    await project.save();
    await clearCache('user_projects_');

    res.status(200).json({
      message: `Đã gửi lời mời thành công tới ${newlyInvited} địa chỉ email`,
      invitations: project.invitations
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi gửi lời mời: ' + err.message });
  }
};

// 4. Lấy danh sách các lời mời đang chờ xử lý của người dùng đang đăng nhập
exports.getPendingInvitations = async (req, res) => {
  try {
    const userEmail = (req.user.email || '').toLowerCase().trim();
    if (!userEmail) {
      return res.status(200).json([]);
    }

    const projects = await Project.find({
      'invitations': {
        $elemMatch: {
          email: userEmail,
          status: 'PENDING'
        }
      }
    })
      .populate('owner', 'name email avatar')
      .populate('invitations.invitedBy', 'name email avatar')
      .select('name description owner invitations createdAt');

    const pendingList = [];
    projects.forEach(p => {
      const myInvite = p.invitations.find(iv => iv.email === userEmail && iv.status === 'PENDING');
      if (myInvite) {
        pendingList.push({
          projectId: p._id,
          projectName: p.name,
          projectDesc: p.description,
          owner: p.owner,
          invitedBy: myInvite.invitedBy || p.owner,
          invitedAt: myInvite.invitedAt
        });
      }
    });

    res.status(200).json(pendingList);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách lời mời: ' + err.message });
  }
};

// 5. Chấp nhận lời mời tham gia dự án
exports.acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase().trim();

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    const inviteIndex = project.invitations.findIndex(
      iv => iv.email === userEmail && iv.status === 'PENDING'
    );

    if (inviteIndex === -1) {
      return res.status(400).json({ error: 'Không tìm thấy lời mời đang chờ cho tài khoản này' });
    }

    // Đổi trạng thái lời mời sang ACCEPTED
    project.invitations[inviteIndex].status = 'ACCEPTED';

    // Thêm user vào members nếu chưa có
    if (!project.members.some(m => m.toString() === userId)) {
      project.members.push(userId);
    }

    await project.save();
    await clearCache('user_projects_');

    res.status(200).json({
      message: `Bạn đã tham gia thành công vào dự án "${project.name}"!`,
      project
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi chấp nhận lời mời: ' + err.message });
  }
};

// 6. Từ chối lời mời tham gia dự án
exports.declineInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = (req.user.email || '').toLowerCase().trim();

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    const inviteIndex = project.invitations.findIndex(
      iv => iv.email === userEmail && iv.status === 'PENDING'
    );

    if (inviteIndex === -1) {
      return res.status(400).json({ error: 'Không tìm thấy lời mời đang chờ' });
    }

    project.invitations[inviteIndex].status = 'DECLINED';
    await project.save();
    await clearCache('user_projects_');

    res.status(200).json({ message: 'Đã từ chối lời mời tham gia dự án' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi từ chối lời mời: ' + err.message });
  }
};

// 7. Lấy danh sách thành viên của một dự án cụ thể (dành cho việc phân công task)
exports.getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    // Tạo danh sách thành viên hợp nhất (bao gồm cả owner)
    const membersMap = new Map();
    if (project.owner) {
      membersMap.set(project.owner._id.toString(), {
        _id: project.owner._id,
        name: project.owner.name,
        email: project.owner.email,
        avatar: project.owner.avatar,
        isOwner: true
      });
    }

    if (project.members && project.members.length > 0) {
      project.members.forEach(m => {
        if (!membersMap.has(m._id.toString())) {
          membersMap.set(m._id.toString(), {
            _id: m._id,
            name: m.name,
            email: m.email,
            avatar: m.avatar,
            isOwner: false
          });
        }
      });
    }

    res.status(200).json(Array.from(membersMap.values()));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải thành viên dự án: ' + err.message });
  }
};

// 8. Lấy chi tiết dự án theo ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('invitations.invitedBy', 'name email avatar');

    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải dự án: ' + err.message });
  }
};

// 9. Xóa dự án (chỉ Owner hoặc Admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ chủ dự án hoặc Admin mới có quyền xóa' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ project: req.params.id });

    await clearCache('user_projects_');
    await clearCache('tasks_');

    res.status(200).json({ message: 'Đã xóa dự án và toàn bộ công việc liên quan' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa dự án: ' + err.message });
  }
};
