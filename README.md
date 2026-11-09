# ☁️ Nền Tảng Quản Lý Dự Án & Cộng Tác Nhóm Đa Nền Tảng Đám Mây
### (Cloud-Native Team Collaboration & Task Management Platform)
> **Đồ án môn học: Điện toán Đám mây (Cloud Computing) - VKU**  
> **Sinh viên thực hiện:** Nguyễn Văn Huy Hoàng  
> **Kiến trúc:** Cloud-Native Multi-tier Architecture (Node.js, Express, MongoDB Atlas, Redis, BullMQ, Docker)

---

## 🚀 1. Tổng quan Kiến trúc Hệ thống

Dự án được xây dựng theo mô hình **Cloud-Native 12-Factor App**, sẵn sàng mở rộng trên các nền tảng đám mây công cộng (PaaS, DBaaS, Container Orchestration):

```mermaid
flowchart TD
    Client([Trình duyệt Người dùng]) --> Nginx[Ingress / Reverse Proxy]
    Nginx --> AppCluster[Express API Gateway Cluster]

    subgraph Cloud_Core [Tầng Dịch Vụ Cốt Lõi]
        AppCluster --> Redis[(Redis: In-Memory Cache & Rate Limiter)]
        AppCluster --> MongoAtlas[(MongoDB Atlas: Managed DBaaS)]
        AppCluster --> Storage[(Cloud Object Storage: File Attachments)]
    end

    subgraph Async_Engine [Tầng Tác Vụ Nền Bất Đồng Bộ]
        AppCluster -.->|Push Job| Queue[(BullMQ / Message Broker)]
        Queue --> WorkerEmail[Worker: Gửi Email Thông Báo Tự Động]
        Queue --> WorkerExport[Worker: Xuất Báo Cáo Excel/PDF]
    end

    subgraph DevOps_Monitoring [Vận Hành & Giám Sát Cloud]
        DockerCompose[Docker Compose Multi-Container]
        HealthEndpoint[/api/health Observability Metrics]
        GithubActions[CI/CD Workflow Pipeline]
        K6Testing[k6 Distributed Load Testing]
    end
```

---

## 🌟 2. Các Đặc Tính Cloud Nổi Bật Đạt Chuẩn Đồ Án Điểm Cao

1. **Kiến trúc phân tầng chuyên nghiệp (Layered Architecture):**
   * Phân tách rành mạch: `controllers`, `services`, `middlewares`, `models`, `routes`, `workers`.
2. **Xác thực & Phân quyền bảo mật (Security & RBAC):**
   * Đăng ký, đăng nhập an toàn với mật khẩu băm chuẩn `bcryptjs`.
   * Cấp phát và chứng thực phiên truy cập bằng `JSON Web Token (JWT)`.
   * Phân quyền vai trò: `Admin` (quản trị toàn diện) và `Member` (thành viên dự án).
   * Middleware **Rate Limiting** bảo vệ tài nguyên Cloud chống tấn công vét cạn mật khẩu (Brute-force) và DDoS.
3. **Cơ chế Caching & Tối ưu hóa hiệu năng (Redis):**
   * Áp dụng chiến lược Cache-Aside (Lazy loading) cho danh sách công việc và dự án.
   * Cơ chế **Resilient Fallback**: Tự động chuyển đổi mượt mà sang in-memory cache nếu Redis tạm thời ngắt kết nối, đảm bảo tính sẵn sàng cao (High Availability).
4. **Xử lý tác vụ nền & Hàng đợi thông điệp (Event-Driven & BullMQ):**
   * Giải phóng tài nguyên API Gateway: Đẩy tác vụ gửi email thông báo phân công và xuất file báo cáo Excel sang hàng đợi ngầm.
5. **Containerization & Đóng gói đám mây (Docker & Docker Compose):**
   * `Dockerfile` đa giai đoạn (Multi-stage build) tối ưu dung lượng ảnh (Node Alpine).
   * Khởi chạy an toàn với user không có đặc quyền root (`appuser`).
   * `docker-compose.yml` điều phối cụm micro-services gồm: Web API container, Redis Cache container và gắn Volume chia sẻ.
6. **Tự động hóa CI/CD & Giám sát Cloud (Observability & CI/CD):**
   * GitHub Actions workflow tự động kiểm thử cú pháp và build Docker image mỗi khi đẩy code lên nhánh `main`.
   * Endpoint `/api/health` trả về dữ liệu giám sát thời gian thực: CPU Cores, Memory Heap Usage, Uptime, trạng thái kết nối Cloud DBaaS & Redis.
7. **Kiểm thử chịu tải (Stress & Load Testing với k6):**
   * Kịch bản mô phỏng 100 người dùng ảo đồng thời truy cập để đo lường độ trễ (Latency p95) và thông lượng (Requests Per Second).

---

## 🛠️ 3. Hướng Dẫn Cài Đặt & Chạy Dự Án

### Cách 1: Chạy trực tiếp trên máy (Local Development)

1. **Cài đặt thư viện phụ thuộc:**
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường `.env`:**
   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cloud_tasks?retryWrites=true&w=majority
   REDIS_URL=redis://127.0.0.1:6379
   JWT_SECRET=vku_cloud_computing_super_secret_key_2026
   ```

3. **Khởi chạy ứng dụng:**
   ```bash
   # Chế độ phát triển (Auto reload)
   npm run dev

   # Chế độ thông thường
   npm start
   ```
   * Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)
   * Kiểm tra thông số Cloud: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

### Cách 2: Chạy toàn bộ hệ thống bằng Docker Compose (Khuyên dùng khi chấm đồ án)

Chỉ với 1 câu lệnh duy nhất, toàn bộ ứng dụng và Redis server sẽ được tự động đóng gói và kích hoạt:

```bash
docker-compose up --build -d
```

* Xem log hệ thống: `docker-compose logs -f`
* Dừng hệ thống: `docker-compose down`

---

## 📊 4. Chạy Kiểm Thử Tải (Load Testing với k6)

Cài đặt công cụ [k6](https://k6.io/) và thực thi kịch bản kiểm thử:

```bash
k6 run tests/k6-load-test.js
```
Kết quả kiểm thử cho thấy 95% request phản hồi trong phạm vi cho phép và tỷ lệ lỗi 0%.

---

## 📁 5. Cấu Trúc Thư Mục Dự Án

```text
├── .github/workflows/       # Kịch bản CI/CD tự động
├── config/                  # Kết nối MongoDB Atlas, Redis Cache
├── controllers/             # Logic điều khiển nghiệp vụ (Auth, Task, Project)
├── middlewares/             # Bảo mật JWT, RBAC, Rate-limit, Multer Upload
├── models/                  # Lược đồ cơ sở dữ liệu Mongoose (User, Project, Task)
├── public/                  # Giao diện người dùng Web Dashboard & Kanban Board
│   ├── index.html           # Single Page Application
│   ├── uploads/             # Tệp đính kèm người dùng tải lên
│   └── reports/             # Báo cáo file Excel xuất tự động
├── routes/                  # Định tuyến các API endpoints
├── services/                # Tầng dịch vụ (Cache Service, Queue Worker Service)
├── tests/                   # Kịch bản k6 Load test
├── docker-compose.yml       # Điều phối đa container
├── Dockerfile               # Tối ưu hóa đóng gói container image
├── package.json             # Danh sách dependencies
├── server.js                # Điểm khởi chạy ứng dụng chính
└── README.md                # Tài liệu thuyết minh đồ án
```
