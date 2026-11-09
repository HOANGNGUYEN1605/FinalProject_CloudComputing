const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

function initRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          // Ngừng retry sau 3 lần nếu không có Redis chạy local để tránh spam log
          return null;
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true
    });

    redisClient.connect().then(() => {
      isRedisConnected = true;
      console.log('✅ Đã kết nối thành công tới Redis Cloud / Cache Server!');
    }).catch(err => {
      isRedisConnected = false;
      console.warn('⚠️ Không thể kết nối Redis (Chế độ Fallback Cache nội bộ):', err.message);
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
    });

  } catch (error) {
    isRedisConnected = false;
    console.warn('⚠️ Khởi tạo Redis thất bại:', error.message);
  }
}

function getRedisStatus() {
  return isRedisConnected ? 'Connected' : 'Disconnected (Fallback mode)';
}

function getRedisClient() {
  return isRedisConnected ? redisClient : null;
}

module.exports = { initRedis, getRedisClient, getRedisStatus };
