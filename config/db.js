const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn('⚠️ MONGO_URI chưa được cấu hình trong .env');
      return;
    }
    const db = await mongoose.connect(mongoUri);
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ Đã kết nối thành công tới MongoDB Atlas!');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB Atlas:', error.message);
  }
}

function getDbStatus() {
  return isConnected ? 'Connected' : 'Disconnected';
}

module.exports = { connectDB, getDbStatus };
