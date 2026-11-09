import http from 'k6/http';
import { check, sleep } from 'k6';

// Cấu hình kịch bản kiểm thử tải (Load Testing Scenario)
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up lên 20 người dùng ảo trong 30 giây
    { duration: '1m', target: 50 },   // Giữ tải ổn định ở mức 50 người dùng đồng thời
    { duration: '20s', target: 100 }, // Đột biến tải lên 100 người dùng ảo (Spike test)
    { duration: '20s', target: 0 },   // Ramp-down giảm dần về 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% request phải phản hồi dưới 300ms
    http_req_failed: ['rate<0.01'],    // Tỷ lệ lỗi cho phép dưới 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. Kiểm tra Health Check & Metrics
  const resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, {
    'Health Check status is 200': (r) => r.status === 200,
    'System status is HEALTHY': (r) => JSON.parse(r.body).status === 'HEALTHY',
  });

  // 2. Kiểm tra tải danh sách Tasks (Đo lường hiệu năng Caching)
  const resTasks = http.get(`${BASE_URL}/api/tasks`);
  check(resTasks, {
    'Get Tasks status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
