const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const { getCache, setCache, clearCache } = require('../services/cacheService');
const { addQueueJob, generateExcelReport } = require('../services/queueService');

// 1. Lấy danh sách công việc tách biệt theo từng tài khoản (User Multi-tenancy)
exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority } = req.query;

    // Nếu người dùng chưa đăng nhập, trả về danh sách trống để bảo mật dữ liệu riêng tư
    if (!req.user) {
      return res.status(200).json({
        source: 'database',
        data: [],
        message: 'Yêu cầu đăng nhập để xem công việc riêng'
      });
    }

    const userId = req.user.id;

    // Lấy danh sách ID các dự án mà user là chủ sở hữu hoặc là thành viên
    const accessibleProjects = await Project.find({
      $or: [{ owner: userId }, { members: userId }]
    }).select('_id');
    const projectIds = accessibleProjects.map(p => p._id);

    // Điều kiện phân quyền: User chỉ xem task do mình tạo, hoặc được gán cho mình, hoặc thuộc dự án của mình
    let userFilter = {
      $or: [
        { creator: userId },
        { assignee: userId },
        { project: { $in: projectIds } }
      ]
    };

    // Nếu là Admin thì có quyền xem toàn bộ hệ thống
    if (req.user.role === 'admin') {
      userFilter = {};
    }

    const filter = { ...userFilter };
    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const cacheKey = `tasks_${userId}_${JSON.stringify(filter)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ source: 'cache', data: cached });
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    await setCache(cacheKey, tasks, 30);

    res.status(200).json({ source: 'database', data: tasks });
  } catch (err) {
    res.status(500).json({ error: 'Không thể tải danh sách công việc: ' + err.message });
  }
};

// 2. Tạo công việc mới gắn với tài khoản đang đăng nhập
exports.createTask = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập trước khi tạo công việc' });
    }

    const { title, description, priority, dueDate, projectId, assigneeId, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Tiêu đề công việc là bắt buộc' });
    }

    const newTask = await Task.create({
      title,
      description: description || '',
      priority: priority || 'Medium',
      dueDate: dueDate || '',
      status: status || 'TODO',
      project: projectId || null,
      assignee: assigneeId || null,
      creator: req.user.id // Luôn gắn với User ID của tài khoản đang đăng nhập
    });

    // Xóa cache danh sách task
    await clearCache('tasks_');

    // Nếu có gán người thực hiện, bắn job gửi Email thông báo bất đồng bộ qua Queue
    if (assigneeId) {
      const assigneeUser = await User.findById(assigneeId);
      if (assigneeUser && assigneeUser.email) {
        await addQueueJob('send-email', {
          to: assigneeUser.email,
          subject: `[Cloud Collaboration] Bạn được giao công việc mới: ${newTask.title}`,
          html: `
            <h3>Xin chào ${assigneeUser.name},</h3>
            <p>Bạn vừa được chỉ định thực hiện công việc mới trên hệ thống <b>Cloud Task Manager</b>:</p>
            <ul>
              <li><b>Tên công việc:</b> ${newTask.title}</li>
              <li><b>Độ ưu tiên:</b> ${newTask.priority}</li>
              <li><b>Hạn chót:</b> ${newTask.dueDate || 'Không xác định'}</li>
            </ul>
            <p>Vui lòng đăng nhập vào hệ thống để cập nhật tiến độ.</p>
          `
        });
      }
    }

    const populatedTask = await Task.findById(newTask._id)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email');

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(400).json({ error: 'Tạo công việc thất bại: ' + err.message });
  }
};

// 3. Cập nhật công việc
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email');

    if (!updatedTask) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }

    await clearCache('tasks_');

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: 'Cập nhật thất bại: ' + err.message });
  }
};

// 4. Xóa công việc
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }

    // Kiểm tra quyền xóa: Chỉ người tạo, người được gán, hoặc admin mới được xóa
    if (req.user && req.user.role !== 'admin') {
      const isCreator = task.creator && task.creator.toString() === req.user.id;
      const isAssignee = task.assignee && task.assignee.toString() === req.user.id;
      if (!isCreator && !isAssignee) {
        return res.status(403).json({ error: 'Bạn chỉ có quyền xóa công việc do chính mình tạo hoặc được phân công' });
      }
    }

    await Task.findByIdAndDelete(id);
    await clearCache('tasks_');

    res.status(200).json({ message: 'Đã xóa công việc thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa: ' + err.message });
  }
};

// 5. Upload tệp đính kèm vào Task
exports.uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn tệp tin cần tải lên' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy công việc để đính kèm tệp' });
    }

    const newAttachment = {
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedAt: new Date()
    };

    task.attachments.push(newAttachment);
    await task.save();

    await clearCache('tasks_');

    res.status(200).json({
      message: 'Tải lên tệp đính kèm thành công',
      attachment: newAttachment,
      task
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải lên tệp: ' + err.message });
  }
};

// 6. Xuất báo cáo Excel công việc bất đồng bộ theo quyền hạn
exports.exportTasksReport = async (req, res) => {
  try {
    const { projectId } = req.query;

    let filter = {};
    if (req.user && req.user.role !== 'admin') {
      const accessibleProjects = await Project.find({
        $or: [{ owner: req.user.id }, { members: req.user.id }]
      }).select('_id');
      const projectIds = accessibleProjects.map(p => p._id);

      filter = {
        $or: [
          { creator: req.user.id },
          { assignee: req.user.id },
          { project: { $in: projectIds } }
        ]
      };
    }

    if (projectId) filter.project = projectId;

    const tasks = await Task.find(filter).populate('assignee', 'name email');
    let projectName = 'Dự án của bạn';

    if (projectId) {
      const project = await Project.findById(projectId);
      if (project) projectName = project.name;
    }

    const downloadUrl = await generateExcelReport({
      projectName,
      tasks
    });

    res.status(200).json({
      message: 'Xuất báo cáo thành công',
      downloadUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xuất báo cáo Excel: ' + err.message });
  }
};
