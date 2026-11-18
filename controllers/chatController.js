const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// Định dạng dung lượng file cho người đọc
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Lấy ngày hôm nay định dạng YYYY-MM-DD theo giờ VN (UTC+7)
function getTodayVN() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 3600 * 1000);
  return vnTime.toISOString().split('T')[0];
}

// Tính khoảng cách ngày
function getDaysDiff(dateStr, todayStr) {
  if (!dateStr) return null;
  const d1 = new Date(dateStr);
  const d2 = new Date(todayStr);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 1. Endpoint lấy tóm tắt nhắc nhở nhanh cho badge thông báo
exports.getReminders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        authenticated: false,
        overdueCount: 0,
        todayCount: 0,
        urgentCount: 0,
        attachmentsCount: 0,
        totalTasks: 0
      });
    }

    const userId = req.user.id;
    const accessibleProjects = await Project.find({
      $or: [{ owner: userId }, { members: userId }]
    }).select('_id');
    const projectIds = accessibleProjects.map(p => p._id);

    let filter = {
      $or: [
        { creator: userId },
        { assignee: userId },
        { project: { $in: projectIds } }
      ]
    };
    if (req.user.role === 'admin') filter = {};

    const tasks = await Task.find(filter);
    const today = getTodayVN();

    let overdueCount = 0;
    let todayCount = 0;
    let urgentCount = 0;
    let attachmentsCount = 0;

    tasks.forEach(t => {
      if (t.status !== 'DONE') {
        if (t.dueDate) {
          if (t.dueDate < today) overdueCount++;
          else if (t.dueDate === today) todayCount++;
        }
        if (t.priority === 'Urgent') urgentCount++;
      }
      if (t.attachments && t.attachments.length > 0) {
        attachmentsCount += t.attachments.length;
      }
    });

    res.status(200).json({
      authenticated: true,
      userName: req.user.name || 'bạn',
      overdueCount,
      todayCount,
      urgentCount,
      attachmentsCount,
      totalTasks: tasks.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy thông tin nhắc nhở: ' + err.message });
  }
};

// 2. Endpoint xử lý tin nhắn trò chuyện thông minh
exports.processMessage = async (req, res) => {
  try {
    const rawMessage = (req.body && req.body.message) ? req.body.message.trim() : '';
    const lowerMsg = rawMessage.toLowerCase();

    // Trường hợp chưa đăng nhập
    if (!req.user) {
      return res.status(200).json({
        reply: `Xin chào bạn! Tôi là **Trợ lý Thông minh CloudBoard** 🤖.\n\nHiện tại bạn **chưa đăng nhập**, nên tôi chưa thể truy xuất danh sách công việc riêng tư và các tệp đính kèm của bạn.\n\n👉 Vui lòng nhấn **"Đăng Nhập"** (hoặc Đăng nhập bằng Google) ở góc trên bên phải để tôi có thể hỗ trợ nhắc nhở và quản lý tài liệu giúp bạn nhé!`,
        suggestions: [
          'Hệ thống CloudBoard là gì?',
          'Làm sao để đăng nhập Google?'
        ],
        documents: []
      });
    }

    const userId = req.user.id;
    const userName = req.user.name || 'bạn';

    // Lấy toàn bộ task mà user này có quyền truy cập
    const accessibleProjects = await Project.find({
      $or: [{ owner: userId }, { members: userId }]
    }).select('_id name');
    const projectIds = accessibleProjects.map(p => p._id);

    let filter = {
      $or: [
        { creator: userId },
        { assignee: userId },
        { project: { $in: projectIds } }
      ]
    };
    if (req.user.role === 'admin') filter = {};

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    const today = getTodayVN();

    // Phân loại các task
    const overdueTasks = [];
    const todayTasks = [];
    const upcomingTasks = []; // trong 3 ngày tới
    const urgentTasks = [];
    const inProgressTasks = [];
    const doneTasks = [];
    const allAttachments = [];

    tasks.forEach(t => {
      const diff = getDaysDiff(t.dueDate, today);
      const isDone = t.status === 'DONE';

      if (!isDone) {
        if (t.dueDate) {
          if (t.dueDate < today) overdueTasks.push({ task: t, daysLate: Math.abs(diff) });
          else if (t.dueDate === today) todayTasks.push(t);
          else if (diff > 0 && diff <= 3) upcomingTasks.push({ task: t, daysLeft: diff });
        }
        if (t.priority === 'Urgent') urgentTasks.push(t);
        if (t.status === 'IN_PROGRESS') inProgressTasks.push(t);
      } else {
        doneTasks.push(t);
      }

      if (t.attachments && t.attachments.length > 0) {
        t.attachments.forEach(att => {
          allAttachments.push({
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileSize: att.fileSize,
            fileType: att.fileType,
            uploadedAt: att.uploadedAt,
            taskTitle: t.title,
            taskId: t._id,
            project: t.project ? t.project.name : 'Công việc chung'
          });
        });
      }
    });

    // Nếu có GEMINI_API_KEY, có thể gọi Cloud Generative AI
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        const geminiReply = await callGeminiAI(rawMessage, {
          userName,
          today,
          tasksCount: tasks.length,
          overdueTasks,
          todayTasks,
          upcomingTasks,
          urgentTasks,
          inProgressTasks,
          doneTasks,
          allAttachments
        });

        if (geminiReply) {
          return res.status(200).json({
            reply: geminiReply,
            suggestions: [
              '🔴 Việc khẩn cấp & quá hạn',
              '📅 Hôm nay cần làm gì?',
              '📎 Truy xuất tài liệu đính kèm',
              '📊 Báo cáo tiến độ'
            ],
            documents: allAttachments.slice(0, 5)
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, fallback to smart rule engine:', geminiErr.message);
      }
    }

    // Smart Engine phân tích ý định (Intent Engine)
    let reply = '';
    let matchedDocuments = [];
    let suggestions = [
      '🔴 Việc khẩn cấp & quá hạn',
      '📅 Hôm nay cần làm gì?',
      '📎 Truy xuất tài liệu đính kèm',
      '📊 Báo cáo tiến độ'
    ];

    // Intent 1: Nhắc nhở hạn chót & Quá hạn
    if (
      lowerMsg.includes('quá hạn') ||
      lowerMsg.includes('trễ') ||
      lowerMsg.includes('hạn chót') ||
      lowerMsg.includes('deadline') ||
      lowerMsg.includes('nhắc nhở') ||
      lowerMsg.includes('nhắc việc') ||
      lowerMsg.includes('chú ý')
    ) {
      reply += `📋 **BÁO CÁO NHẮC NHỞ CÔNG VIỆC CỦA ${userName.toUpperCase()}**\n*(Hôm nay là: ${today})*\n\n`;

      if (overdueTasks.length > 0) {
        reply += `🚨 **ĐÃ QUÁ HẠN (${overdueTasks.length} việc) — CẦN XỬ LÝ NGAY:**\n`;
        overdueTasks.forEach(({ task, daysLate }) => {
          reply += `• **${task.title}** (Trễ ${daysLate} ngày | Hạn: ${task.dueDate} | Mức độ: ${task.priority})\n`;
        });
        reply += `\n`;
      } else {
        reply += `✅ Tuyệt vời! Bạn không có công việc nào bị quá hạn.\n\n`;
      }

      if (todayTasks.length > 0) {
        reply += `📅 **HẠN CHÓT HÔM NAY (${todayTasks.length} việc):**\n`;
        todayTasks.forEach(t => {
          reply += `• **${t.title}** (Trạng thái: ${t.status} | Ưu tiên: ${t.priority})\n`;
        });
        reply += `\n`;
      }

      if (upcomingTasks.length > 0) {
        reply += `⏳ **SẮP ĐẾN HẠN TRONG 3 NGÀY TỚI (${upcomingTasks.length} việc):**\n`;
        upcomingTasks.forEach(({ task, daysLeft }) => {
          reply += `• **${task.title}** (Còn ${daysLeft} ngày | Hạn: ${task.dueDate})\n`;
        });
      }
    }

    // Intent 2: Hôm nay cần làm gì / Việc khẩn cấp
    else if (
      lowerMsg.includes('hôm nay') ||
      lowerMsg.includes('cần làm gì') ||
      lowerMsg.includes('khẩn cấp') ||
      lowerMsg.includes('urgent') ||
      lowerMsg.includes('ưu tiên')
    ) {
      reply += `🎯 **DANH SÁCH VIỆC ƯU TIÊN CHO ${userName.toUpperCase()}:**\n\n`;

      if (urgentTasks.length > 0) {
        reply += `🔥 **CÔNG VIỆC KHẨN CẤP (URGENT - ${urgentTasks.length} việc):**\n`;
        urgentTasks.forEach(t => {
          reply += `• **${t.title}** — Hạn chót: ${t.dueDate || 'Chưa đặt'} | Trạng thái: ${t.status}\n`;
        });
        reply += `\n`;
      }

      if (todayTasks.length > 0) {
        reply += `📅 **HẠN CHÓT HÔM NAY (${today}):**\n`;
        todayTasks.forEach(t => {
          reply += `• **${t.title}** (Ưu tiên: ${t.priority})\n`;
        });
        reply += `\n`;
      }

      if (inProgressTasks.length > 0) {
        reply += `⚡ **ĐANG THỰC HIỆN (${inProgressTasks.length} việc):**\n`;
        inProgressTasks.slice(0, 3).forEach(t => {
          reply += `• **${t.title}** (${t.priority})\n`;
        });
      }

      if (urgentTasks.length === 0 && todayTasks.length === 0 && inProgressTasks.length === 0) {
        reply += `✨ Hiện tại bạn không có việc khẩn cấp nào cần hoàn thành hôm nay. Bạn có thể xem thêm các task trong cột **Cần làm (TODO)** trên bảng Kanban nhé!`;
      }
    }

    // Intent 3: Truy xuất tài liệu, file đính kèm, download
    else if (
      lowerMsg.includes('tài liệu') ||
      lowerMsg.includes('file') ||
      lowerMsg.includes('đính kèm') ||
      lowerMsg.includes('download') ||
      lowerMsg.includes('tải') ||
      lowerMsg.includes('attachment') ||
      lowerMsg.includes('báo cáo') ||
      lowerMsg.includes('docx') ||
      lowerMsg.includes('pdf') ||
      lowerMsg.includes('xlsx') ||
      lowerMsg.includes('png') ||
      lowerMsg.includes('ảnh')
    ) {
      if (allAttachments.length === 0) {
        reply = `📂 Hiện tại hệ thống ghi nhận **chưa có tệp đính kèm nào** trong các công việc của bạn.\n\n👉 Để tải tài liệu lên, bạn hãy mở một công việc bất kỳ trên bảng Kanban và chọn **Đính kèm tệp** (hỗ trợ tệp tối đa 10MB) nhé!`;
      } else {
        // Lọc theo từ khóa người dùng tìm kiếm nếu có
        const searchKeyword = rawMessage
          .replace(/(tìm|tài liệu|file|đính kèm|download|tải|cho tôi|xem|kiểm tra|các|của|về|trong)/gi, '')
          .trim()
          .toLowerCase();

        let filteredDocs = allAttachments;
        if (searchKeyword.length >= 2) {
          filteredDocs = allAttachments.filter(doc => 
            doc.fileName.toLowerCase().includes(searchKeyword) ||
            doc.taskTitle.toLowerCase().includes(searchKeyword)
          );
          if (filteredDocs.length === 0) {
            filteredDocs = allAttachments; // Trả về tất cả nếu không khớp từ khóa
            reply += `Không tìm thấy file khớp chính xác với "${searchKeyword}". Dưới đây là toàn bộ tài liệu hiện có của bạn:\n\n`;
          } else {
            reply += `🔍 Đã tìm thấy **${filteredDocs.length} tệp tài liệu** phù hợp với yêu cầu của bạn:\n\n`;
          }
        } else {
          reply += `📁 **DANH MỤC TÀI LIỆU & TỆP ĐÍNH KÈM TRONG CÔNG VIỆC:**\n\n`;
        }

        matchedDocuments = filteredDocs;

        filteredDocs.forEach((doc, idx) => {
          reply += `${idx + 1}. 📄 **${doc.fileName}** (${formatBytes(doc.fileSize)})\n`;
          reply += `   • Thuộc task: *${doc.taskTitle}*\n`;
          reply += `   • Tải xuống: [Click để tải file](${doc.fileUrl})\n\n`;
        });

        reply += `💡 *Bạn có thể nhấp trực tiếp vào tên file ở danh sách dưới đây để tải về ngay!*`;
      }
    }

    // Intent 4: Tổng kết tiến độ, thống kê
    else if (
      lowerMsg.includes('tiến độ') ||
      lowerMsg.includes('tổng kết') ||
      lowerMsg.includes('thống kê') ||
      lowerMsg.includes('tiến trình') ||
      lowerMsg.includes('báo cáo tiến độ')
    ) {
      const total = tasks.length;
      const completed = doneTasks.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      reply = `📊 **BÁO CÁO TIẾN ĐỘ CÔNG VIỆC TỔNG QUAN:**\n\n` +
              `• **Tổng số công việc:** ${total}\n` +
              `• **Đã hoàn thành:** ${completed} / ${total} việc (**${percent}%**)\n` +
              `• **Đang thực hiện:** ${inProgressTasks.length} việc\n` +
              `• **Cần làm (TODO):** ${tasks.filter(t => t.status === 'TODO').length} việc\n` +
              `• **Chờ duyệt (IN_REVIEW):** ${tasks.filter(t => t.status === 'IN_REVIEW').length} việc\n` +
              `• **Số việc quá hạn:** ${overdueTasks.length} việc 🚨\n` +
              `• **Tổng số tệp đính kèm:** ${allAttachments.length} tệp 📎\n\n` +
              `💡 *Bạn cũng có thể dùng nút "Xuất Báo Cáo Excel" ở menu bên trái để tải bảng tổng hợp chi tiết (.xlsx).*`;
    }

    // Intent 5: Tìm kiếm công việc cụ thể
    else if (
      lowerMsg.startsWith('tìm') ||
      lowerMsg.startsWith('tra cứu') ||
      lowerMsg.startsWith('xem task')
    ) {
      const kw = rawMessage.replace(/^(tìm|tra cứu|xem task|tìm task)/gi, '').trim().toLowerCase();
      if (kw) {
        const found = tasks.filter(t => 
          t.title.toLowerCase().includes(kw) || 
          (t.description && t.description.toLowerCase().includes(kw))
        );

        if (found.length > 0) {
          reply = `🔍 Tìm thấy **${found.length} công việc** liên quan đến từ khóa *"${kw}"*:\n\n`;
          found.forEach(t => {
            reply += `• **${t.title}** [${t.status}] — Hạn: ${t.dueDate || 'Chưa có'} | Ưu tiên: ${t.priority}\n`;
            if (t.attachments && t.attachments.length > 0) {
              reply += `  📎 Kèm ${t.attachments.length} tệp đính kèm\n`;
            }
          });
        } else {
          reply = `Không tìm thấy công việc nào khớp với từ khóa *"${kw}"* trong tài khoản của bạn.`;
        }
      } else {
        reply = `Bạn muốn tìm công việc hoặc tài liệu gì? Ví dụ bạn có thể gõ: *"Tìm task báo cáo"* hoặc *"Tìm file đồ án"*.`;
      }
    }

    // Intent 6: Hướng dẫn trợ lý & Chào hỏi
    else if (
      lowerMsg.includes('chào') ||
      lowerMsg.includes('hello') ||
      lowerMsg.includes('hi') ||
      lowerMsg.includes('ai') ||
      lowerMsg.includes('làm được gì') ||
      lowerMsg.includes('giúp') ||
      lowerMsg.includes('hướng dẫn')
    ) {
      reply = `Xin chào **${userName}**! Tôi là **Trợ lý Thông minh CloudBoard** 🤖.\n\n` +
              `Tôi có thể giúp bạn các tính năng sau:\n` +
              `1. 🚨 **Nhắc nhở công việc:** Cảnh báo các task quá hạn, task có hạn hôm nay hoặc sắp tới hạn.\n` +
              `2. 🎯 **Lọc việc khẩn cấp:** Tìm các công việc có độ ưu tiên cao (Urgent, High) cần làm trước.\n` +
              `3. 👥 **Dự án nhóm & Lời mời:** Xem danh sách dự án bạn tham gia và thông báo các lời mời đang chờ.\n` +
              `4. 📎 **Truy xuất tài liệu:** Tìm kiếm và cung cấp đường dẫn tải trực tiếp các tệp đính kèm trong task.\n` +
              `5. 📊 **Báo cáo tiến độ:** Thống kê tỷ lệ hoàn thành công việc và tóm tắt theo thời gian thực.\n\n` +
              `Bạn có thể bấm vào các nút gợi ý nhanh bên dưới hoặc gõ câu hỏi bất kỳ!`;
    }

    // Intent 7: Dự án nhóm, Lời mời & Thành viên
    else if (
      lowerMsg.includes('dự án') ||
      lowerMsg.includes('nhóm') ||
      lowerMsg.includes('lời mời') ||
      lowerMsg.includes('thành viên')
    ) {
      const userProjects = await Project.find({
        $or: [{ owner: userId }, { members: userId }]
      }).populate('owner', 'name email').populate('members', 'name email');

      const userEmail = (req.user.email || '').toLowerCase().trim();
      const pendingInvites = await Project.find({
        'invitations': {
          $elemMatch: {
            email: userEmail,
            status: 'PENDING'
          }
        }
      }).populate('owner', 'name email');

      reply = `👥 **THÔNG TIN DỰ ÁN NHÓM & LỜI MỜI CỦA BẠN:**\n\n`;

      if (pendingInvites.length > 0) {
        reply += `📬 **BẠN CÓ ${pendingInvites.length} LỜI MỜI ĐANG CHỜ CHẤP NHẬN:**\n`;
        pendingInvites.forEach(p => {
          reply += `• Dự án **${p.name}** (Mời bởi: ${p.owner ? p.owner.name : 'Chủ dự án'} - ${p.owner ? p.owner.email : ''})\n`;
        });
        reply += `👉 Hãy nhấn nút **"📬 Lời mời"** trên thanh tiêu đề để Chấp nhận tham gia nhé!\n\n`;
      }

      if (userProjects.length > 0) {
        reply += `📁 **CÁC DỰ ÁN BẠN ĐANG THAM GIA (${userProjects.length} dự án):**\n`;
        userProjects.forEach(p => {
          const isOwner = p.owner && p.owner._id.toString() === userId;
          const memberCount = (p.members || []).length;
          reply += `• **${p.name}** [${isOwner ? '👑 Bạn là Chủ dự án' : 'Thành viên'}] — Gồm ${memberCount} thành viên\n`;
        });
      } else {
        reply += `Hiện tại bạn chưa tham gia dự án nhóm nào. Bạn có thể nhấn **"+ Tạo dự án mới"** ở menu bên trái và nhập Gmail của các thành viên để bắt đầu cộng tác nhóm nhé!`;
      }
    }

    // Fallback mặc định: Tóm tắt thông minh ngắn gọn
    else {
      reply = `Tôi đã nhận được tin nhắn: *"${rawMessage}"*.\n\n` +
              `Hiện tại bạn đang có **${tasks.length} công việc** (trong đó **${overdueTasks.length} việc quá hạn**, **${todayTasks.length} việc có hạn hôm nay**, và **${allAttachments.length} tệp đính kèm**).\n\n` +
              `Bạn có muốn tôi giúp gì cụ thể không? Hãy chọn các gợi ý bên dưới nhé!`;
    }

    res.status(200).json({
      reply,
      suggestions,
      documents: matchedDocuments
    });

  } catch (err) {
    console.error('Chat controller error:', err);
    res.status(500).json({ error: 'Lỗi xử lý phản hồi từ trợ lý ảo: ' + err.message });
  }
};

// Hàm gọi Google Gemini API nếu có cấu hình GEMINI_API_KEY
async function callGeminiAI(userPrompt, context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `Bạn là Trợ lý Ảo Thông Minh tích hợp trên nền tảng CloudBoard (VKU Cloud Computing).
Hôm nay là: ${context.today}.
Người dùng hiện tại: ${context.userName}.
Dữ liệu công việc của người dùng hiện tại (bảo đảm tính bảo mật Multi-tenancy):
- Tổng số công việc: ${context.tasksCount}
- Việc quá hạn (${context.overdueTasks.length}): ${JSON.stringify(context.overdueTasks.map(o => ({ title: o.task.title, dueDate: o.task.dueDate, daysLate: o.daysLate })))}
- Việc hạn hôm nay (${context.todayTasks.length}): ${JSON.stringify(context.todayTasks.map(t => ({ title: t.title, priority: t.priority })))}
- Việc khẩn cấp (${context.urgentTasks.length}): ${JSON.stringify(context.urgentTasks.map(t => ({ title: t.title, status: t.status })))}
- Tài liệu đính kèm (${context.allAttachments.length}): ${JSON.stringify(context.allAttachments.map(a => ({ name: a.fileName, url: a.fileUrl, task: a.taskTitle })))}

Hãy trả lời ngắn gọn, lịch sự, thân thiện bằng tiếng Việt, sử dụng định dạng Markdown, làm nổi bật các hạn chót và cung cấp đường dẫn tải tài liệu [Tên file](url) nếu người dùng hỏi về tài liệu.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemInstruction}\n\nNgười dùng hỏi: "${userPrompt}"` }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP status: ${response.status}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts.map(p => p.text).join('\n');
  }
  return null;
}
