require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { connectDB } = require('./config/db');
const { initRedis } = require('./config/redis');
const { initQueue } = require('./services/queueService');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (giao diện người dùng, upload ảnh/file, báo cáo Excel)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'public', 'reports')));

// Áp dụng Rate Limiting bảo vệ API
app.use('/api', apiLimiter);

// Đảm bảo kết nối DB trước khi xử lý API (đặc biệt quan trọng trên Serverless như Vercel)
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

// 2. Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/health', healthRoutes);

// Điều hướng trang chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. Khởi động Server & Các dịch vụ Cloud
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await connectDB();
  initRedis();
  initQueue();

  if (process.env.NODE_ENV !== 'production' || process.env.RENDER || process.env.DOCKER) {
    const server = app.listen(PORT, () => {
      console.log(`🚀 [Cloud Platform] Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`📊 [Health Metrics] Kiểm tra trạng thái tại: http://localhost:${PORT}/api/health`);
    });

    // Xử lý Graceful Shutdown chuẩn Cloud-Native 12-Factor App
    process.on('SIGTERM', () => {
      console.log('🛑 Nhận tín hiệu SIGTERM, chuẩn bị tắt gracefully...');
      server.close(() => {
        console.log('✅ Server đã đóng an toàn.');
        process.exit(0);
      });
    });
  }
}

bootstrap();

module.exports = app;
