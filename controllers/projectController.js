const Project = require('../models/Project');
const Task = require('../models/Task');
const { getCache, setCache, clearCache } = require('../services/cacheService');

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
      .sort({ updatedAt: -1 });

    // Lưu cache 60s
    await setCache(cacheKey, projects, 60);

    res.status(200).json({ source: 'database', data: projects });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải danh sách dự án: ' + err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên dự án là bắt buộc' });
    }

    const project = await Project.create({
      name,
      description: description || '',
      owner: req.user.id,
      members: [req.user.id]
    });

    await clearCache('user_projects_');

    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: 'Tạo dự án thất bại: ' + err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải dự án: ' + err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    // Chỉ owner hoặc admin mới được xóa project
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
