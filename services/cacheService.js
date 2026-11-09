const { getRedisClient } = require('../config/redis');

// Fallback in-memory cache nếu Redis chưa khởi chạy
const memoryCache = new Map();

async function getCache(key) {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn('⚠️ Lỗi đọc Redis cache:', err.message);
    }
  }
  const item = memoryCache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.value;
  }
  return null;
}

async function setCache(key, value, ttlSeconds = 60) {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch (err) {
      console.warn('⚠️ Lỗi ghi Redis cache:', err.message);
    }
  }
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000
  });
}

async function clearCache(pattern = '') {
  const redis = getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.warn('⚠️ Lỗi xóa Redis cache:', err.message);
    }
  }
  for (const k of memoryCache.keys()) {
    if (k.includes(pattern)) {
      memoryCache.delete(k);
    }
  }
}

module.exports = { getCache, setCache, clearCache };
