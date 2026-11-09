const { Queue, Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let taskQueue = null;
let isQueueActive = false;

// Cấu hình thư mục lưu file xuất báo cáo
const reportDir = path.join(__dirname, '..', 'public', 'reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// 1. Cấu hình gửi mail (sử dụng Ethereal hoặc SMTP)
async function sendNotificationEmail(data) {
  console.log(`[Worker - Email] 📧 Đang xử lý gửi email tới: ${data.to}`);
  // Tạo transporter thử nghiệm hoặc từ .env
  let transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Chế độ mô phỏng đám mây (Cloud Simulation / Ethereal)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const info = await transporter.sendMail({
    from: '"Cloud Collaboration VKU" <noreply@vku-cloud.edu.vn>',
    to: data.to,
    subject: data.subject || 'Thông báo từ hệ thống Cloud Task Manager',
    html: data.html || `<p>${data.message}</p>`
  });

  console.log(`[Worker - Email] ✅ Đã gửi email thành công: ${info.messageId}`);
  if (nodemailer.getTestMessageUrl(info)) {
    console.log(`[Worker - Email] 🔗 Xem mail xem trước: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
}

// 2. Cấu hình xuất file Excel báo cáo dự án
async function generateExcelReport(data) {
  console.log(`[Worker - Export] 📊 Đang sinh file Excel cho dự án: ${data.projectName || 'Tất cả'}`);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Báo cáo công việc');

  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Tiêu đề công việc', key: 'title', width: 35 },
    { header: 'Mô tả', key: 'description', width: 40 },
    { header: 'Trạng thái', key: 'status', width: 16 },
    { header: 'Độ ưu tiên', key: 'priority', width: 14 },
    { header: 'Hạn chót', key: 'dueDate', width: 16 },
    { header: 'Người thực hiện', key: 'assignee', width: 25 },
    { header: 'Ngày tạo', key: 'createdAt', width: 20 }
  ];

  data.tasks.forEach((task, idx) => {
    worksheet.addRow({
      stt: idx + 1,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || 'Chưa đặt',
      assignee: task.assignee ? (task.assignee.name || task.assignee.email) : 'Chưa phân công',
      createdAt: new Date(task.createdAt).toLocaleString('vi-VN')
    });
  });

  // Style header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };

  const fileName = `Report-${Date.now()}.xlsx`;
  const filePath = path.join(reportDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`[Worker - Export] ✅ Đã xuất file thành công: /reports/${fileName}`);
  return `/reports/${fileName}`;
}

// Khởi tạo BullMQ Queue & Worker
function initQueue() {
  try {
    const connection = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: null
    };

    taskQueue = new Queue('cloud-task-queue', { connection });

    // Khởi tạo Worker xử lý ngầm
    const worker = new Worker('cloud-task-queue', async (job) => {
      if (job.name === 'send-email') {
        return await sendNotificationEmail(job.data);
      } else if (job.name === 'export-excel') {
        return await generateExcelReport(job.data);
      }
    }, { connection });

    worker.on('completed', (job) => {
      console.log(`[BullMQ Worker] 🎯 Job ${job.id} (${job.name}) đã hoàn thành!`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] ❌ Job ${job.id} thất bại:`, err.message);
    });

    isQueueActive = true;
    console.log('✅ BullMQ Task Queue & Worker đã sẵn sàng!');
  } catch (err) {
    isQueueActive = false;
    console.warn('⚠️ Không thể kích hoạt BullMQ (Sẽ chạy đồng bộ dạng fallback):', err.message);
  }
}

// Hàm đẩy job vào hàng đợi
async function addQueueJob(type, payload) {
  if (isQueueActive && taskQueue) {
    try {
      const job = await taskQueue.add(type, payload, { attempts: 3, backoff: 2000 });
      return { queued: true, jobId: job.id };
    } catch (err) {
      console.warn('⚠️ Lỗi đẩy job vào Redis Queue, chuyển sang xử lý trực tiếp:', err.message);
    }
  }

  // Fallback: Xử lý trực tiếp không đồng bộ (non-blocking)
  setImmediate(async () => {
    try {
      if (type === 'send-email') await sendNotificationEmail(payload);
      if (type === 'export-excel') await generateExcelReport(payload);
    } catch (e) {
      console.error('Lỗi khi thực thi fallback job:', e.message);
    }
  });

  return { queued: false, status: 'Processed in-process' };
}

function getQueueStatus() {
  return isQueueActive ? 'BullMQ Active (Redis-backed)' : 'In-Process Fallback';
}

module.exports = { initQueue, addQueueJob, getQueueStatus, generateExcelReport };
