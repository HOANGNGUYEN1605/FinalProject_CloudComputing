const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createPresentation() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  // Palette colors
  const C_DARK_BG = '1E1B4B'; // Indigo 950
  const C_PRIMARY = '4F46E5'; // Indigo 600
  const C_ACCENT = '06B6D4';  // Cyan
  const C_SUCCESS = '10B981'; // Emerald
  const C_WARNING = 'F59E0B'; // Amber
  const C_CARD_BG = 'F8FAFC'; // Slate 50
  const C_BORDER = 'E2E8F0';  // Slate 200
  const C_TEXT = '0F172A';    // Slate 900
  const C_MUTED = '64748B';   // Slate 500
  const C_WHITE = 'FFFFFF';

  // Helper for slide footer
  function addFooter(slide, currentChapter = '') {
    slide.addText(`VKU · ĐIỆN TOÁN ĐÁM MÂY | NGUYỄN VĂN HUY HOÀNG - 23IT089`, {
      x: 0.8,
      y: 7.1,
      w: 8.0,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Arial',
      color: C_MUTED
    });
    if (currentChapter) {
      slide.addText(currentChapter.toUpperCase(), {
        x: 9.0,
        y: 7.1,
        w: 3.5,
        h: 0.3,
        fontSize: 9,
        fontFace: 'Arial',
        color: C_PRIMARY,
        align: 'right'
      });
    }
  }

  // Slide 1: Bìa
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_DARK_BG };

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8, y: 0.8, w: 11.7, h: 0.08,
      fill: { color: C_ACCENT }
    });

    slide.addText("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG VIỆT - HÀN (VKU)\nKHOA KHOA HỌC MÁY TÍNH · BÁO CÁO ĐỒ ÁN ĐIỆN TOÁN ĐÁM MÂY", {
      x: 0.8, y: 1.1, w: 11.7, h: 0.6,
      fontSize: 13, bold: true, color: '93C5FD', fontFace: 'Arial'
    });

    slide.addText("XÂY DỰNG NỀN TẢNG QUẢN LÝ CÔNG VIỆC VÀ CỘNG TÁC NHÓM\nCLOUDBOARD HƯỚNG ĐÁM MÂY (CLOUD-NATIVE)", {
      x: 0.8, y: 2.0, w: 11.7, h: 1.5,
      fontSize: 26, bold: true, color: C_WHITE, fontFace: 'Arial'
    });

    slide.addText("Node.js · MongoDB Atlas (DBaaS) · Redis Cloud Cache · Google OAuth 2.0 SSO · Render PaaS · CI/CD", {
      x: 0.8, y: 3.6, w: 11.7, h: 0.5,
      fontSize: 14, color: C_ACCENT, fontFace: 'Arial', bold: true
    });

    // Box thông tin sinh viên & GVHD
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.6, w: 11.7, h: 1.8,
      fill: { color: '2E2968' }, line: { color: '4338CA', width: 1.5 }, rectRadius: 0.1
    });

    slide.addText([
      { text: "Sinh viên thực hiện: ", options: { bold: true, color: '93C5FD', fontSize: 13 } },
      { text: "Nguyễn Văn Huy Hoàng      ", options: { bold: true, color: C_WHITE, fontSize: 13 } },
      { text: "Mã sinh viên: ", options: { bold: true, color: '93C5FD', fontSize: 13 } },
      { text: "23IT089\n", options: { bold: true, color: 'FCD34D', fontSize: 13 } },
      { text: "Lớp: ", options: { bold: true, color: '93C5FD', fontSize: 12 } },
      { text: "23IT · Đại học CNTT & TT Việt - Hàn        ", options: { color: C_WHITE, fontSize: 12 } },
      { text: "Học phần: ", options: { bold: true, color: '93C5FD', fontSize: 12 } },
      { text: "Điện toán đám mây (Học kỳ 1, 2026–2027)\n", options: { color: C_WHITE, fontSize: 12 } },
      { text: "Live URL: ", options: { bold: true, color: '93C5FD', fontSize: 12 } },
      { text: "https://finalproject-cloudcomputing.onrender.com\n", options: { color: C_ACCENT, fontSize: 12, underline: true } },
      { text: "GitHub: ", options: { bold: true, color: '93C5FD', fontSize: 12 } },
      { text: "https://github.com/HOANGNGUYEN1605/FinalProject_CloudComputing", options: { color: 'E2E8F0', fontSize: 11 } }
    ], { x: 1.2, y: 4.8, w: 11.0, h: 1.5, fontFace: 'Arial' });
  }

  // Slide 2: Chương 1 · Đặt vấn đề & Mục tiêu
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 1 · TỔNG QUAN & ĐẶT VẤN ĐỀ", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Bối cảnh thực tiễn & Mục tiêu đồ án CloudBoard", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    // Cột 1: Vấn đề On-Premise
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: C_CARD_BG }, line: { color: C_BORDER, width: 1 }, rectRadius: 0.1
    });
    slide.addText("THÁCH THỨC MÔ HÌNH TRUYỀN THỐNG (ON-PREMISE)", {
      x: 1.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 13, bold: true, color: 'DC2626', fontFace: 'Arial'
    });
    slide.addText([
      { text: "• Chi phí đầu tư ban đầu lớn (CapEx): ", options: { bold: true } },
      { text: "Mua máy chủ vật lý, thiết bị mạng, phòng server, UPS dự phòng.\n\n" },
      { text: "• Chi phí vận hành cao (OpEx): ", options: { bold: true } },
      { text: "Tốn nhân sự túc trực 24/7, điện năng làm mát, bảo trì phần cứng định kỳ.\n\n" },
      { text: "• Khó khăn co giãn (Scalability): ", options: { bold: true } },
      { text: "Không thể mở rộng tức thì khi lưu lượng truy cập đột biến; lãng phí khi tải thấp.\n\n" },
      { text: "• Độ sẵn sàng thấp: ", options: { bold: true } },
      { text: "Dễ bị gián đoạn đơn điểm (Single Point of Failure - SPOF) khi cúp điện hoặc đứt cáp." }
    ], { x: 1.1, y: 2.7, w: 5.0, h: 3.7, fontSize: 11.5, color: C_TEXT, fontFace: 'Arial' });

    // Cột 2: Lợi thế Cloud & Mục tiêu
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6.8, y: 1.8, w: 5.7, h: 4.8, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 1 }, rectRadius: 0.1
    });
    slide.addText("GIẢI PHÁP CLOUD-NATIVE & MỤC TIÊU ĐẠT ĐƯỢC", {
      x: 7.1, y: 2.1, w: 5.2, h: 0.4, fontSize: 13, bold: true, color: C_SUCCESS, fontFace: 'Arial'
    });
    slide.addText([
      { text: "• Tối ưu mô hình dịch vụ đám mây: ", options: { bold: true } },
      { text: "Kết hợp DBaaS (MongoDB Atlas), PaaS (Render), In-memory Cache (Redis).\n\n" },
      { text: "• Nền tảng CloudBoard hoàn chỉnh: ", options: { bold: true } },
      { text: "Bảng Kanban 4 cột, quản lý dự án, cộng tác nhóm, đính kèm tệp và xuất báo cáo Excel.\n\n" },
      { text: "• Bảo mật cấp doanh nghiệp: ", options: { bold: true } },
      { text: "Đăng nhập một chạm Google OAuth 2.0 (GSI), JWT phi trạng thái, cô lập dữ liệu người dùng (Multi-tenancy).\n\n" },
      { text: "• Tự động hóa vận hành (DevOps): ", options: { bold: true } },
      { text: "CI/CD tự động qua GitHub Actions, đóng gói Docker Multi-stage, k6 load test chịu tải." }
    ], { x: 7.1, y: 2.7, w: 5.2, h: 3.7, fontSize: 11.5, color: C_TEXT, fontFace: 'Arial' });

    addFooter(slide, "Chương 1 · Tổng quan");
  }

  // Slide 3: Chương 2 · Các mô hình dịch vụ đám mây
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 2 · CƠ SỞ LÝ THUYẾT ĐIỆN TOÁN ĐÁM MÂY", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Các mô hình dịch vụ đám mây ứng dụng trong đề tài", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const models = [
      {
        title: "PaaS (Platform as a Service)",
        svc: "Render Web Service",
        color: '4F46E5',
        bg: 'EEF2FF',
        points: "• Cung cấp sẵn Runtime Node.js, bộ cân bằng tải, SSL/TLS tự động.\n• Lập trình viên chỉ cần quản lý Code và cấu hình môi trường.\n• Chạy tiến trình liên tục, hỗ trợ Webhook Auto-Deploy từ GitHub."
      },
      {
        title: "DBaaS (Database as a Service)",
        svc: "MongoDB Atlas M0",
        color: '059669',
        bg: 'ECFDF5',
        points: "• Cung cấp cơ sở dữ liệu NoSQL phân tán được quản trị toàn diện.\n• Cụm Replica Set 3 nodes (1 Primary + 2 Secondaries) tự động failover.\n• Bảo mật mạng với IP Whitelist, chứng chỉ TLS và mã hóa dữ liệu."
      },
      {
        title: "CaaS (Container as a Service)",
        svc: "Docker Multi-stage",
        color: '0284C7',
        bg: 'F0F9FF',
        points: "• Đóng gói mã nguồn, dependencies và runtime vào Container chuẩn hóa.\n• Loại bỏ hoàn toàn sự sai lệch giữa môi trường Local và Cloud.\n• Tối ưu kích thước image (<150MB) bằng Alpine Linux và non-root user."
      }
    ];

    models.forEach((m, idx) => {
      const x = 0.8 + idx * 4.0;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 1.8, w: 3.7, h: 4.8, fill: { color: m.bg }, line: { color: m.color, width: 1.5 }, rectRadius: 0.1
      });
      slide.addText(m.title, {
        x: x + 0.2, y: 2.1, w: 3.3, h: 0.5, fontSize: 13, bold: true, color: m.color, fontFace: 'Arial'
      });
      slide.addText(m.svc, {
        x: x + 0.2, y: 2.6, w: 3.3, h: 0.3, fontSize: 11, bold: true, color: C_MUTED, fontFace: 'Arial'
      });
      slide.addText(m.points, {
        x: x + 0.2, y: 3.1, w: 3.3, h: 3.2, fontSize: 11, color: C_TEXT, fontFace: 'Arial'
      });
    });

    addFooter(slide, "Chương 2 · Cơ sở lý thuyết");
  }

  // Slide 4: Chương 2 · Ngăn xếp công nghệ
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 2 · CÔNG NGHỆ ÁP DỤNG", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Ngăn xếp công nghệ Cloud-Native (Tech Stack)", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const techRows = [
      ["Thành phần", "Công nghệ / Dịch vụ", "Vai trò và giải pháp kỹ thuật trong đồ án"],
      ["Frontend SPA", "HTML5, Vanilla JS, CSS3, Inter Font", "Giao diện SPA nhẹ, bảng Kanban kéo thả/chuyển cột, Dark/Light Mode, Realtime stat cards."],
      ["Backend API", "Node.js (v20 LTS), Express.js", "Xây dựng RESTful API, kiến trúc MVC, hỗ trợ trust proxy, CORS, Rate-Limiting."],
      ["Cơ sở dữ liệu", "MongoDB Atlas (DBaaS M0 Cluster)", "Lưu trữ tài liệu JSON (Users, Projects, Tasks), Replica Set HA, Mongoose ODM validation."],
      ["Xác thực SSO", "Google OAuth 2.0 (GSI) + JWT", "Đăng nhập một chạm bằng Gmail, xác minh ID Token qua google-auth-library, JWT 7 ngày."],
      ["Bộ nhớ đệm", "Redis + Cache-Aside Pattern", "Cache danh sách tasks (TTL 30s) và projects (TTL 60s), fallback in-memory Map khi Redis lỗi."],
      ["Hàng đợi tác vụ", "BullMQ + Nodemailer + ExcelJS", "Xử lý bất đồng bộ job gửi email thông báo khi giao việc và xuất báo cáo Excel tổng hợp."],
      ["Đóng gói & CI/CD", "Docker Multi-stage, GitHub Actions", "Tự động kiểm tra cú pháp, build container image, kích hoạt Auto-Deploy trên Render PaaS."]
    ];

    slide.addTable(techRows, {
      x: 0.8, y: 1.8, w: 11.7, h: 4.8,
      fill: C_CARD_BG,
      color: C_TEXT,
      fontSize: 10.5,
      fontFace: 'Arial',
      border: { pt: 1, color: C_BORDER },
      rowH: [0.45, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55]
    });

    addFooter(slide, "Chương 2 · Công nghệ");
  }

  // Slide 5: Chương 3 · Kiến trúc 3 tầng
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 3 · KIẾN TRÚC HỆ THỐNG", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Kiến trúc 3 tầng chuẩn Cloud-Native (3-Tier Architecture)", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const tiers = [
      {
        num: "TẦNG 1 · PRESENTATION",
        title: "Client Tier (Browser SPA)",
        color: '2563EB',
        bg: 'EFF6FF',
        desc: "• Giao diện Web SPA tương thích mọi thiết bị.\n• Bảng Kanban 4 cột, bộ lọc ưu tiên, tìm kiếm tức thời.\n• Gọi RESTful API bảo mật qua HTTPS/TLS.\n• Tích hợp Google Identity Services (GSI) Button."
      },
      {
        num: "TẦNG 2 · APPLICATION",
        title: "Logic Tier (Render PaaS)",
        color: '4F46E5',
        bg: 'EEF2FF',
        desc: "• Node.js/Express Web Service (trust proxy).\n• Middlewares: Rate Limiter, CORS, JWT Auth, Multer.\n• Controllers: Auth, Project, Task, Health.\n• Cache Service (Redis/Map) & Queue Service (BullMQ)."
      },
      {
        num: "TẦNG 3 · PERSISTENCE",
        title: "Data Tier (Cloud DBaaS & Cache)",
        color: '059669',
        bg: 'ECFDF5',
        desc: "• MongoDB Atlas Replica Set (Dữ liệu chính).\n• Collections: users, projects, tasks.\n• In-memory Redis Cache (Cache-Aside & Job Broker).\n• Endpoint /api/health giám sát toàn bộ tầng lưu trữ."
      }
    ];

    tiers.forEach((t, i) => {
      const x = 0.8 + i * 4.0;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 1.8, w: 3.7, h: 4.8, fill: { color: t.bg }, line: { color: t.color, width: 1.5 }, rectRadius: 0.1
      });
      slide.addText(t.num, {
        x: x + 0.2, y: 2.1, w: 3.3, h: 0.3, fontSize: 10, bold: true, color: t.color, fontFace: 'Arial'
      });
      slide.addText(t.title, {
        x: x + 0.2, y: 2.4, w: 3.3, h: 0.5, fontSize: 13, bold: true, color: C_TEXT, fontFace: 'Arial'
      });
      slide.addText(t.desc, {
        x: x + 0.2, y: 3.1, w: 3.3, h: 3.2, fontSize: 11, color: C_TEXT, fontFace: 'Arial'
      });
    });

    addFooter(slide, "Chương 3 · Kiến trúc hệ thống");
  }

  // Slide 6: Chương 3 · 5 Phân hệ chức năng
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 3 · THIẾT KẾ CHỨC NĂNG", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Năm phân hệ chức năng cốt lõi của CloudBoard", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const modules = [
      { code: "01", name: "Xác thực & SSO", desc: "Đăng nhập Google OAuth 2.0 hoặc tài khoản mật khẩu bcrypt; cấp phát JWT token 7 ngày; phân quyền RBAC admin/member." },
      { code: "02", name: "Quản lý Dự án", desc: "Tạo dự án cộng tác, gán thành viên tham gia, phân quyền owner và admin quản trị, cache Redis 60s." },
      { code: "03", name: "Bảng Kanban Đa người dùng", desc: "4 cột trạng thái TODO-IN_PROGRESS-IN_REVIEW-DONE, 4 mức ưu tiên, cô lập dữ liệu cá nhân (Multi-tenancy)." },
      { code: "04", name: "Tệp đính kèm & Báo cáo", desc: "Tải file đính kèm đa định dạng lên task (max 10MB); xuất báo cáo Excel (.xlsx) bất đồng bộ theo quyền hạn." },
      { code: "05", name: "Giám sát Cloud & Health", desc: "Endpoint /api/health trả về CPU, RAM, Uptime, môi trường PaaS/Docker, trạng thái kết nối DB và Redis." }
    ];

    modules.forEach((mod, idx) => {
      const y = 1.8 + idx * 0.95;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.8, y: y, w: 11.7, h: 0.8, fill: { color: C_CARD_BG }, line: { color: C_BORDER, width: 1 }, rectRadius: 0.08
      });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 1.0, y: y + 0.12, w: 0.8, h: 0.55, fill: { color: C_PRIMARY }, rectRadius: 0.08
      });
      slide.addText(mod.code, {
        x: 1.0, y: y + 0.15, w: 0.8, h: 0.5, fontSize: 13, bold: true, color: C_WHITE, align: 'center', fontFace: 'Arial'
      });
      slide.addText(mod.name, {
        x: 2.0, y: y + 0.15, w: 3.2, h: 0.5, fontSize: 13, bold: true, color: C_TEXT, fontFace: 'Arial'
      });
      slide.addText(mod.desc, {
        x: 5.3, y: y + 0.15, w: 7.0, h: 0.5, fontSize: 11, color: C_MUTED, fontFace: 'Arial'
      });
    });

    addFooter(slide, "Chương 3 · Phân hệ chức năng");
  }

  // Slide 7: Chương 3 · Cơ sở dữ liệu Mongoose Schema
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 3 · THIẾT KẾ CƠ SỞ DỮ LIỆU", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Ba Collection chính trong cơ sở dữ liệu MongoDB Atlas", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const collections = [
      {
        name: "Collection: users",
        tag: "Người dùng & SSO",
        color: '4F46E5',
        fields: "• name: String (họ tên)\n• email: String (unique, lowercase)\n• password: String (bcrypt hash / rỗng nếu dùng SSO)\n• googleId: String (ID định danh Google)\n• authProvider: 'local' | 'google'\n• role: 'admin' | 'member'\n• avatar: String (URL avatar Google/mặc định)\n• timestamps (createdAt, updatedAt)"
      },
      {
        name: "Collection: projects",
        tag: "Dự án & Nhóm",
        color: '059669',
        fields: "• name: String (tên dự án)\n• description: String (mô tả dự án)\n• owner: ObjectId -> ref User (người tạo)\n• members: [ObjectId -> ref User] (thành viên)\n• timestamps (createdAt, updatedAt)\n\n* Phân quyền: Chỉ chủ sở hữu (owner) hoặc quản trị viên (admin) mới được xóa dự án."
      },
      {
        name: "Collection: tasks",
        tag: "Công việc Kanban",
        color: '0284C7',
        fields: "• title: String (tiêu đề bắt buộc)\n• description: String\n• project: ObjectId -> ref Project (nullable)\n• status: 'TODO'|'IN_PROGRESS'|'IN_REVIEW'|'DONE'\n• priority: 'Low'|'Medium'|'High'|'Urgent'\n• dueDate: String (YYYY-MM-DD)\n• assignee: ObjectId -> ref User\n• creator: ObjectId -> ref User\n• attachments: [{ fileName, fileUrl, fileSize }]\n• completed: Boolean (pre-save sync with status)"
      }
    ];

    collections.forEach((c, idx) => {
      const x = 0.8 + idx * 4.0;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 1.8, w: 3.7, h: 4.8, fill: { color: C_CARD_BG }, line: { color: c.color, width: 1.5 }, rectRadius: 0.1
      });
      slide.addText(c.name, {
        x: x + 0.2, y: 2.1, w: 3.3, h: 0.35, fontSize: 13, bold: true, color: c.color, fontFace: 'Arial'
      });
      slide.addText(c.tag, {
        x: x + 0.2, y: 2.45, w: 3.3, h: 0.3, fontSize: 10.5, color: C_MUTED, fontFace: 'Arial'
      });
      slide.addText(c.fields, {
        x: x + 0.2, y: 2.9, w: 3.3, h: 3.5, fontSize: 10.5, color: C_TEXT, fontFace: 'Arial'
      });
    });

    addFooter(slide, "Chương 3 · Cơ sở dữ liệu");
  }

  // Slide 8: Chương 3 · Google OAuth & Multi-tenancy
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 3 · XÁC THỰC VÀ PHÂN QUYỀN", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Xác thực Google OAuth 2.0 & Cô lập dữ liệu Đa người dùng", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    // Box 1: Google OAuth
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 1 }, rectRadius: 0.1
    });
    slide.addText("ĐĂNG NHẬP MỘT CHẠM GOOGLE OAUTH 2.0", {
      x: 1.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 13, bold: true, color: C_SUCCESS, fontFace: 'Arial'
    });
    slide.addText([
      { text: "1. Google Identity Services (GSI) SDK: ", options: { bold: true } },
      { text: "Tích hợp nút đăng nhập chuẩn của Google tại frontend, người dùng xác thực một chạm không cần gõ mật khẩu.\n\n" },
      { text: "2. Xác thực ID Token an toàn: ", options: { bold: true } },
      { text: "Frontend gửi credential token lên backend POST /api/auth/google; server dùng google-auth-library để verify token với GOOGLE_CLIENT_ID.\n\n" },
      { text: "3. Tự động liên kết tài khoản: ", options: { bold: true } },
      { text: "Hệ thống trích xuất email, name, avatar, googleId. Nếu chưa có tài khoản thì tự động tạo mới; nếu đã có thì cập nhật avatar.\n\n" },
      { text: "4. Cấp phát JWT Access Token: ", options: { bold: true } },
      { text: "Server tạo JWT 7 ngày gửi về cho client lưu trữ tại localStorage." }
    ], { x: 1.1, y: 2.7, w: 5.0, h: 3.7, fontSize: 11, color: C_TEXT, fontFace: 'Arial' });

    // Box 2: Multi-tenancy Data Isolation
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6.8, y: 1.8, w: 5.7, h: 4.8, fill: { color: 'EEF2FF' }, line: { color: 'C7D2FE', width: 1 }, rectRadius: 0.1
    });
    slide.addText("CÔ LẬP DỮ LIỆU ĐA NGƯỜI DÙNG (MULTI-TENANCY)", {
      x: 7.1, y: 2.1, w: 5.2, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText([
      { text: "1. Cô lập dữ liệu tầng truy vấn (Query Isolation): ", options: { bold: true } },
      { text: "User chỉ xem được task do chính mình tạo (creator), được giao (assignee) hoặc thuộc dự án mình tham gia (project.members).\n\n" },
      { text: "2. Bảo vệ khi chưa đăng nhập: ", options: { bold: true } },
      { text: "Khi chưa có JWT, API trả về danh sách rỗng ([]), không để lộ công việc của người dùng khác.\n\n" },
      { text: "3. Phân quyền thao tác xóa: ", options: { bold: true } },
      { text: "Chỉ người tạo task, người được giao task hoặc tài khoản admin mới có quyền xóa task đó.\n\n" },
      { text: "4. Dọn dẹp trạng thái tức thì khi Logout: ", options: { bold: true } },
      { text: "Khi nhấn Đăng xuất, Frontend xóa sạch token và biến allTasks trong RAM, lập tức làm rỗng bảng Kanban." }
    ], { x: 7.1, y: 2.7, w: 5.2, h: 3.7, fontSize: 11, color: C_TEXT, fontFace: 'Arial' });

    addFooter(slide, "Chương 3 · Xác thực & Phân quyền");
  }

  // Slide 9: Chương 3 · RESTful API Endpoints
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 3 · GIAO DIỆN LẬP TRÌNH ỨNG DỤNG", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Đặc tả 16 RESTful API Endpoints của CloudBoard", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const apiRows = [
      ["Nhóm", "Phương thức & Endpoint", "Yêu cầu Auth", "Mô tả chức năng"],
      ["Cấu hình", "GET /api/auth/config", "Public", "Cung cấp Google Client ID cho client."],
      ["Xác thực", "POST /api/auth/register, /login", "Public (Rate-limited)", "Đăng ký, đăng nhập email/mật khẩu, trả về JWT."],
      ["Xác thực", "POST /api/auth/google", "Public (Rate-limited)", "Đăng nhập một chạm Google OAuth 2.0 (GSI)."],
      ["Người dùng", "GET /api/auth/me, /api/auth/users", "JWT Token", "Lấy profile cá nhân và danh sách người dùng để phân công."],
      ["Dự án", "GET, POST /api/projects", "JWT Token", "Lấy danh sách dự án (Cache 60s) và tạo dự án mới."],
      ["Dự án", "GET, DELETE /api/projects/:id", "JWT (Owner/Admin)", "Xem chi tiết hoặc xóa dự án."],
      ["Công việc", "GET, POST /api/tasks", "JWT optionalAuth", "Lấy task theo tài khoản (Cache 30s) và tạo task mới."],
      ["Công việc", "PUT, DELETE /api/tasks/:id", "JWT (Creator/Admin)", "Cập nhật tiến độ hoặc xóa task."],
      ["Tệp & Báo cáo", "POST /api/tasks/:id/attachments", "Public / Auth", "Đính kèm tệp lên task (Multer, tối đa 10MB)."],
      ["Tệp & Báo cáo", "GET /api/tasks/actions/export", "JWT (Lọc theo user)", "Xuất báo cáo Excel danh sách task."],
      ["Giám sát", "GET /api/health", "Public", "Cloud Observability: Uptime, RAM, DB & Cache status."]
    ];

    slide.addTable(apiRows, {
      x: 0.8, y: 1.8, w: 11.7, h: 4.8,
      fill: C_CARD_BG,
      color: C_TEXT,
      fontSize: 9.5,
      fontFace: 'Arial',
      border: { pt: 1, color: C_BORDER },
      rowH: [0.35, 0.35, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]
    });

    addFooter(slide, "Chương 3 · RESTful API");
  }

  // Slide 10: Chương 4 · Bảo mật đa lớp & Reverse Proxy
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 4 · BẢO MẬT HỆ THỐNG CLOUD", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Kiến trúc bảo mật nhiều lớp (Defense in Depth)", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const secBoxes = [
      {
        val: "7 Ngày",
        label: "Hiệu lực JWT Access Token",
        desc: "Phi trạng thái (Stateless), client tự gửi Bearer token qua header Authorization, giảm tải truy vấn DB."
      },
      {
        val: "10 Rounds",
        label: "Băm mật khẩu Bcrypt",
        desc: "Mật khẩu người dùng được băm một chiều với Salt 10 vòng ngẫu nhiên; không lưu mật khẩu dạng plain-text."
      },
      {
        val: "20 Req/15m",
        label: "Rate-Limiting Chống Brute-force",
        desc: "Giới hạn tối đa 20 yêu cầu xác thực trong 15 phút, ngăn chặn tấn công dò mật khẩu và tấn công từ chối dịch vụ."
      },
      {
        val: "trust proxy",
        label: "Hỗ trợ Reverse Proxy Cloud",
        desc: "Cấu hình app.set('trust proxy', 1) giúp Express đọc chính xác IP thực của client qua header X-Forwarded-For trên Render."
      }
    ];

    secBoxes.forEach((s, idx) => {
      const x = 0.8 + (idx % 2) * 6.0;
      const y = 1.8 + Math.floor(idx / 2) * 2.45;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: y, w: 5.7, h: 2.2, fill: { color: C_CARD_BG }, line: { color: C_BORDER, width: 1 }, rectRadius: 0.1
      });
      slide.addText(s.val, {
        x: x + 0.3, y: y + 0.2, w: 5.1, h: 0.5, fontSize: 20, bold: true, color: C_PRIMARY, fontFace: 'Arial'
      });
      slide.addText(s.label, {
        x: x + 0.3, y: y + 0.7, w: 5.1, h: 0.35, fontSize: 12, bold: true, color: C_TEXT, fontFace: 'Arial'
      });
      slide.addText(s.desc, {
        x: x + 0.3, y: y + 1.1, w: 5.1, h: 0.9, fontSize: 11, color: C_MUTED, fontFace: 'Arial'
      });
    });

    addFooter(slide, "Chương 4 · Bảo mật Cloud");
  }

  // Slide 11: Chương 4 · Tối ưu hiệu năng Redis & BullMQ
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 4 · HIỆU NĂNG VÀ ĐỘ SẴN SÀNG", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Chiến lược Cache-Aside và Hàng đợi tác vụ BullMQ", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    // Box 1: Cache-Aside
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 1 }, rectRadius: 0.1
    });
    slide.addText("CHIẾN LƯỢC CACHE-ASIDE (REDIS)", {
      x: 1.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 13, bold: true, color: C_SUCCESS, fontFace: 'Arial'
    });
    slide.addText([
      { text: "1. Tiếp nhận Request GET: ", options: { bold: true } },
      { text: "Server kiểm tra dữ liệu trong Redis Cache trước.\n\n" },
      { text: "2. Cache HIT (~1-2 ms): ", options: { bold: true } },
      { text: "Trả kết quả ngay lập tức cho client với header/flag source: 'cache', không cần truy vấn DB.\n\n" },
      { text: "3. Cache MISS: ", options: { bold: true } },
      { text: "Truy vấn MongoDB Atlas, lưu dữ liệu vào Cache (TTL 30s với task, 60s với project), trả source: 'database'.\n\n" },
      { text: "4. Cơ chế Graceful Degradation (Khả năng chịu lỗi): ", options: { bold: true } },
      { text: "Nếu Redis mất kết nối, hệ thống tự động chuyển đổi trong suốt sang in-memory Map cache, không làm sập ứng dụng." }
    ], { x: 1.1, y: 2.7, w: 5.0, h: 3.7, fontSize: 11, color: C_TEXT, fontFace: 'Arial' });

    // Box 2: BullMQ Queue
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6.8, y: 1.8, w: 5.7, h: 4.8, fill: { color: 'EFF6FF' }, line: { color: 'BFDBFE', width: 1 }, rectRadius: 0.1
    });
    slide.addText("HÀNG ĐỢI XỬ LÝ NỀN BẤT ĐỒNG BỘ (BULLMQ)", {
      x: 7.1, y: 2.1, w: 5.2, h: 0.4, fontSize: 13, bold: true, color: '1D4ED8', fontFace: 'Arial'
    });
    slide.addText([
      { text: "1. Trách nhiệm phân tách (Decoupling): ", options: { bold: true } },
      { text: "Các tác vụ nặng (gửi email, xuất Excel) không chạy blocking trong HTTP request cycle.\n\n" },
      { text: "2. Gửi email thông báo bất đồng bộ: ", options: { bold: true } },
      { text: "Khi gán task cho thành viên, job send-email được đẩy vào BullMQ; API trả về 201 Created ngay lập tức (~20ms).\n\n" },
      { text: "3. Worker xử lý nền & Cơ chế Thử lại (Retry): ", options: { bold: true } },
      { text: "Worker chạy ngầm rút job ra xử lý với Nodemailer; tự động retry tối đa 3 lần (cách nhau 2s) nếu SMTP lỗi.\n\n" },
      { text: "4. Xuất báo cáo Excel bằng ExcelJS: ", options: { bold: true } },
      { text: "Tạo bảng tính định dạng chuẩn, lưu file và cấp đường dẫn tải an toàn." }
    ], { x: 7.1, y: 2.7, w: 5.2, h: 3.7, fontSize: 11, color: C_TEXT, fontFace: 'Arial' });

    addFooter(slide, "Chương 4 · Hiệu năng & Cache");
  }

  // Slide 12: Chương 4 · Triển khai Cloud PaaS Render & 12-Factor App
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 4 · TRIỂN KHAI VÀ VẬN HÀNH CLOUD", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Triển khai trên Render PaaS & Chuẩn 12-Factor App", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const steps = [
      {
        num: "Bước 1",
        title: "Thiết lập DBaaS Atlas",
        desc: "Tạo Cluster M0, cấp tài khoản DB riêng biệt, Whitelist IP 0.0.0.0/0, lấy chuỗi kết nối mongodb+srv:// an toàn qua TLS."
      },
      {
        num: "Bước 2",
        title: "Tách cấu hình nhạy cảm",
        desc: "Tuân thủ 12-Factor App: Đưa MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID vào biến môi trường, tuyệt đối không commit .env lên Git."
      },
      {
        num: "Bước 3",
        title: "Kết nối Render Web Service",
        desc: "Kết nối repo GitHub HOANGNGUYEN1605/FinalProject_CloudComputing. Cấu hình Health Check Path: /api/health."
      },
      {
        num: "Bước 4",
        title: "Phát hành & Auto-Deploy",
        desc: "Render tự động cấp tên miền HTTPS https://finalproject-cloudcomputing.onrender.com, tự động deploy khi có commit mới."
      }
    ];

    steps.forEach((st, idx) => {
      const x = 0.8 + idx * 3.0;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 1.8, w: 2.7, h: 4.8, fill: { color: C_CARD_BG }, line: { color: C_BORDER, width: 1 }, rectRadius: 0.1
      });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.2, y: 2.1, w: 1.0, h: 0.4, fill: { color: C_PRIMARY }, rectRadius: 0.08
      });
      slide.addText(st.num, {
        x: x + 0.2, y: 2.15, w: 1.0, h: 0.35, fontSize: 10, bold: true, color: C_WHITE, align: 'center', fontFace: 'Arial'
      });
      slide.addText(st.title, {
        x: x + 0.2, y: 2.7, w: 2.3, h: 0.6, fontSize: 12, bold: true, color: C_TEXT, fontFace: 'Arial'
      });
      slide.addText(st.desc, {
        x: x + 0.2, y: 3.4, w: 2.3, h: 2.9, fontSize: 10.5, color: C_MUTED, fontFace: 'Arial'
      });
    });

    addFooter(slide, "Chương 4 · Triển khai Render PaaS");
  }

  // Slide 13: Chương 4 · CI/CD Pipeline
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 4 · QUY TRÌNH TỰ ĐỘNG HÓA", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Quy trình CI/CD tự động hóa qua GitHub Actions", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const pipeSteps = [
      { step: "1. Developer Push", tech: "git push origin main", detail: "Lập trình viên commit mã nguồn đã kiểm thử lên nhánh main của repository GitHub." },
      { step: "2. GitHub Actions CI", tech: ".github/workflows/ci-cd.yml", detail: "Khởi động runner Node 20, chạy npm ci, kiểm tra cú pháp toàn dự án, build thử Docker image bằng Buildx." },
      { step: "3. Webhook Trigger", tech: "GitHub -> Render Webhook", detail: "Sau khi pipeline CI vượt qua thành công, GitHub phát tín hiệu Webhook tự động đến máy chủ Render." },
      { step: "4. Build & Health Check", tech: "Render Build Engine", detail: "Render kéo mã mới, cài đặt dependencies, khởi chạy container và kiểm tra tính sẵn sàng qua /api/health." },
      { step: "5. Zero-downtime Release", tech: "Traffic Switch", detail: "Chuyển lưu lượng người dùng sang phiên bản container mới, thu hồi container cũ mà không làm gián đoạn dịch vụ." }
    ];

    pipeSteps.forEach((p, idx) => {
      const y = 1.8 + idx * 0.95;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.8, y: y, w: 11.7, h: 0.8, fill: { color: C_CARD_BG }, line: { color: C_BORDER, width: 1 }, rectRadius: 0.08
      });
      slide.addText(p.step, {
        x: 1.1, y: y + 0.15, w: 2.8, h: 0.5, fontSize: 12, bold: true, color: C_PRIMARY, fontFace: 'Arial'
      });
      slide.addText(p.tech, {
        x: 4.0, y: y + 0.15, w: 3.2, h: 0.5, fontSize: 11, bold: true, color: C_ACCENT, fontFace: 'Arial'
      });
      slide.addText(p.detail, {
        x: 7.3, y: y + 0.15, w: 5.0, h: 0.5, fontSize: 10.5, color: C_MUTED, fontFace: 'Arial'
      });
    });

    addFooter(slide, "Chương 4 · CI/CD Pipeline");
  }

  // Slide 14: Chương 4 · Docker Multi-stage & Health Check
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 4 · ĐÓNG GÓI CONTAINER & GIÁM SÁT", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Đóng gói Docker Multi-stage & Endpoint Health Check", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    // Box 1: Docker
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: 'F0F9FF' }, line: { color: 'BAE6FD', width: 1 }, rectRadius: 0.1
    });
    slide.addText("TỐI ƯU DOCKERFILE MULTI-STAGE", {
      x: 1.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 13, bold: true, color: '0284C7', fontFace: 'Arial'
    });
    slide.addText([
      { text: "• Base Image siêu nhẹ: ", options: { bold: true } },
      { text: "Sử dụng node:20-alpine giúp giảm kích thước container xuống dưới 150MB so với 1GB bản chuẩn.\n\n" },
      { text: "• Multi-stage Build: ", options: { bold: true } },
      { text: "Stage 1 (deps) cài production dependencies với npm ci --only=production; Stage 2 (runner) chỉ sao chép tệp thực thi sạch.\n\n" },
      { text: "• Bảo mật cấp Container: ", options: { bold: true } },
      { text: "Tạo và chạy ứng dụng bằng người dùng không có quyền root (appuser:nodejs), ngăn chặn leo thang đặc quyền.\n\n" },
      { text: "• Lệnh HEALTHCHECK tích hợp: ", options: { bold: true } },
      { text: "Tự động gọi wget http://localhost:3000/api/health định kỳ mỗi 30 giây để Docker engine kiểm tra trạng thái container." }
    ], { x: 1.1, y: 2.7, w: 5.0, h: 3.7, fontSize: 11, color: C_TEXT, fontFace: 'Arial' });

    // Box 2: Health Check
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6.8, y: 1.8, w: 5.7, h: 4.8, fill: { color: 'EEF2FF' }, line: { color: 'C7D2FE', width: 1 }, rectRadius: 0.1
    });
    slide.addText("GIÁM SÁT HỆ THỐNG QUA /API/HEALTH", {
      x: 7.1, y: 2.1, w: 5.2, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText([
      { text: "• Cloud Runtime Metrics: ", options: { bold: true } },
      { text: "Tự động nhận diện nền tảng (Render PaaS, Vercel Serverless, Docker Container), phiên bản Node.js và hệ điều hành máy chủ.\n\n" },
      { text: "• Tài nguyên phần cứng: ", options: { bold: true } },
      { text: "Đo lường số core CPU, dung lượng RAM trống/tổng của host OS.\n\n" },
      { text: "• Process Memory: ", options: { bold: true } },
      { text: "Theo dõi chính xác heapUsed, heapTotal, rss theo MB để phát hiện rò rỉ bộ nhớ (memory leak).\n\n" },
      { text: "• Trạng thái kết nối tích hợp: ", options: { bold: true } },
      { text: "Báo cáo trạng thái sống của MongoDB Atlas (Connected/Disconnected) và Redis Cache (Ready/Failing)." }
    ], { x: 7.1, y: 2.7, w: 5.2, h: 3.7, fontSize: 11, color: C_TEXT, fontFace: 'Arial' });

    addFooter(slide, "Chương 4 · Docker & Health Check");
  }

  // Slide 15: Chương 5 · Kết quả thực nghiệm
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 5 · KẾT QUẢ ĐẠT ĐƯỢC", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Giao diện CloudBoard và Kết quả Vận hành Thực tế", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const resCards = [
      {
        title: "Bảng Kanban 4 Trạng thái",
        desc: "TODO (Cần làm), IN_PROGRESS (Đang làm), IN_REVIEW (Chờ duyệt), DONE (Hoàn tất) với thanh tiến độ hoàn thành trực quan."
      },
      {
        title: "Đăng nhập một chạm Google SSO",
        desc: "Đăng nhập nhanh bằng Gmail cá nhân, hiển thị tên và avatar Google, đồng thời hỗ trợ đăng ký/đăng nhập truyền thống."
      },
      {
        title: "Cô lập dữ liệu người dùng",
        desc: "Mỗi người dùng chỉ thấy công việc thuộc quyền hạn của mình; đăng xuất lập tức làm rỗng bảng, bảo mật quyền riêng tư."
      },
      {
        title: "Thống kê & Bộ lọc nâng cao",
        desc: "4 thẻ thống kê tự động tính tỷ lệ hoàn thành; tìm kiếm tức thời theo từ khóa và lọc nhanh theo mức độ ưu tiên."
      },
      {
        title: "Đính kèm tệp & Xuất Excel",
        desc: "Kéo thả upload tệp tài liệu đa định dạng (tối đa 10MB); một chạm xuất toàn bộ danh sách công việc ra bảng tính .xlsx."
      },
      {
        title: "Modal Giám sát Cloud trực quan",
        desc: "Bảng dashboard theo dõi 8 chỉ số sức khỏe của máy chủ đám mây (Uptime, RAM, CPU, DB, Cache) với đèn LED trạng thái."
      }
    ];

    resCards.forEach((c, idx) => {
      const x = 0.8 + (idx % 3) * 4.0;
      const y = 1.8 + Math.floor(idx / 3) * 2.45;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: y, w: 3.7, h: 2.2, fill: { color: C_CARD_BG }, line: { color: C_BORDER, width: 1 }, rectRadius: 0.1
      });
      slide.addText(c.title, {
        x: x + 0.2, y: y + 0.2, w: 3.3, h: 0.45, fontSize: 12, bold: true, color: C_PRIMARY, fontFace: 'Arial'
      });
      slide.addText(c.desc, {
        x: x + 0.2, y: y + 0.7, w: 3.3, h: 1.3, fontSize: 10.5, color: C_MUTED, fontFace: 'Arial'
      });
    });

    addFooter(slide, "Chương 5 · Kết quả thực nghiệm");
  }

  // Slide 16: Chương 5 · Kiểm thử chịu tải k6
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 5 · KIỂM THỬ CHỊU TẢI", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Kiểm thử chịu tải bằng công cụ k6 (Load Testing)", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    const k6Rows = [
      ["Giai đoạn (Stage)", "Thời gian thực thi", "Số lượng Virtual Users (VUs)", "Mục tiêu kiểm thử"],
      ["1. Ramp-up (Tăng tải)", "30 giây", "0 -> 20 VUs", "Khởi tạo kết nối, làm ấm Redis cache (Cache Warming)."],
      ["2. Steady State (Tải ổn định)", "60 giây", "50 VUs duy trì", "Kiểm tra độ trễ trung bình và ổn định tài nguyên máy chủ."],
      ["3. Spike Load (Tải đột biến)", "20 giây", "100 VUs tức thời", "Đánh giá khả năng đáp ứng cực đại của Render PaaS."],
      ["4. Ramp-down (Giảm tải)", "20 giây", "100 -> 0 VUs", "Kiểm tra khả năng thu hồi tài nguyên và giải phóng RAM."]
    ];

    slide.addTable(k6Rows, {
      x: 0.8, y: 1.8, w: 11.7, h: 2.5,
      fill: C_CARD_BG,
      color: C_TEXT,
      fontSize: 10.5,
      fontFace: 'Arial',
      border: { pt: 1, color: C_BORDER },
      rowH: [0.45, 0.45, 0.45, 0.45, 0.45]
    });

    // Box kết luận kiểm thử k6
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.6, w: 11.7, h: 2.0, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 1.5 }, rectRadius: 0.1
    });

    slide.addText("KẾT QUẢ ĐẠT ĐƯỢC TỪ KỊCH BẢN KIỂM THỬ K6 TRÊN MÔI TRƯỜNG CLOUD", {
      x: 1.1, y: 4.8, w: 11.0, h: 0.35, fontSize: 12, bold: true, color: C_SUCCESS, fontFace: 'Arial'
    });

    slide.addText([
      { text: "• Ngưỡng cam kết SLA (Threshold): ", options: { bold: true } },
      { text: "http_req_duration p(95) < 300ms và tỷ lệ lỗi http_req_failed < 1%.\n" },
      { text: "• Hiệu quả rõ rệt của Redis Cache: ", options: { bold: true } },
      { text: "Với các request trúng cache (Cache HIT), độ trễ phản hồi chỉ còn từ 1–5ms, giảm hơn 90% tải truy vấn xuống MongoDB Atlas.\n" },
      { text: "• Độ bền vững của hệ thống: ", options: { bold: true } },
      { text: "Dưới tải đỉnh 100 VUs, Node.js event-loop duy trì ổn định, không ghi nhận tình trạng crash hoặc tràn bộ nhớ." }
    ], { x: 1.1, y: 5.2, w: 11.0, h: 1.2, fontSize: 11, color: C_TEXT, fontFace: 'Arial' });

    addFooter(slide, "Chương 5 · Kiểm thử chịu tải");
  }

  // Slide 17: Chương 5 · Đánh giá & Hướng phát triển
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_WHITE };

    slide.addText("CHƯƠNG 5 · ĐÁNH GIÁ & HƯỚNG PHÁT TRIỂN", {
      x: 0.8, y: 0.6, w: 10, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText("Đánh giá toàn diện và Định hướng hoàn thiện hệ thống", {
      x: 0.8, y: 1.0, w: 11.7, h: 0.6, fontSize: 22, bold: true, color: C_TEXT, fontFace: 'Arial'
    });

    // Cột 1: Ưu điểm & Hạn chế
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: C_CARD_BG }, line: { color: C_BORDER, width: 1 }, rectRadius: 0.1
    });
    slide.addText("ƯU ĐIỂM & HẠN CHẾ CÒN TỒN TẠI", {
      x: 1.1, y: 2.1, w: 5.0, h: 0.4, fontSize: 13, bold: true, color: C_PRIMARY, fontFace: 'Arial'
    });
    slide.addText([
      { text: "Ưu điểm nổi bật:\n", options: { bold: true, color: C_SUCCESS } },
      { text: "• Kiến trúc chuẩn Cloud-Native phi trạng thái, sẵn sàng mở rộng ngang (Horizontal Scaling).\n• Tối ưu chi phí bằng 100% tài nguyên Free-tier có cam kết SLA.\n• Trải nghiệm người dùng cao cấp với Google OAuth và cô lập dữ liệu.\n• Tự động hóa trọn vẹn từ viết mã đến triển khai production qua CI/CD.\n\n" },
      { text: "Hạn chế cần cải tiến:\n", options: { bold: true, color: 'DC2626' } },
      { text: "• Hiện tượng Cold Start trên gói Render Free (ngủ sau 15 phút rảnh).\n• Tệp đính kèm đang lưu đĩa cục bộ tạm thời (ephemeral disk).\n• Bảng Kanban chưa có WebSocket để đồng bộ thời gian thực hai chiều." }
    ], { x: 1.1, y: 2.6, w: 5.0, h: 3.8, fontSize: 10.5, color: C_TEXT, fontFace: 'Arial' });

    // Cột 2: Hướng phát triển
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6.8, y: 1.8, w: 5.7, h: 4.8, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 1 }, rectRadius: 0.1
    });
    slide.addText("HƯỚNG PHÁT TRIỂN TIẾP THEO (ROADMAP)", {
      x: 7.1, y: 2.1, w: 5.2, h: 0.4, fontSize: 13, bold: true, color: C_SUCCESS, fontFace: 'Arial'
    });
    slide.addText([
      { text: "1. Cloud Object Storage (AWS S3 / Cloudinary): ", options: { bold: true } },
      { text: "Chuyển toàn bộ tệp đính kèm và file Excel sang lưu trữ đám mây bền vững, không sợ mất dữ liệu khi container khởi động lại.\n\n" },
      { text: "2. Real-time Collaboration (Socket.IO): ", options: { bold: true } },
      { text: "Đồng bộ hóa kéo thả task tức thời giữa màn hình các thành viên trong nhóm theo thời gian thực mà không cần tải lại trang.\n\n" },
      { text: "3. Nâng cấp điều phối Container (Kubernetes - K8s): ", options: { bold: true } },
      { text: "Nghiên cứu triển khai cụm K8s với cơ chế tự động co giãn theo tải (Horizontal Pod Autoscaler - HPA).\n\n" },
      { text: "4. Giám sát chuyên sâu (Prometheus & Grafana): ", options: { bold: true } },
      { text: "Thu thập số liệu chi tiết và thiết lập cảnh báo tự động qua Telegram/Discord." }
    ], { x: 7.1, y: 2.6, w: 5.2, h: 3.8, fontSize: 11, color: C_TEXT, fontFace: 'Arial' });

    addFooter(slide, "Chương 5 · Đánh giá & Định hướng");
  }

  // Slide 18: Kết luận & Q&A
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_DARK_BG };

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8, y: 0.8, w: 11.7, h: 0.08, fill: { color: C_ACCENT }
    });

    slide.addText("KẾT LUẬN & HỎI ĐÁP (Q&A)", {
      x: 0.8, y: 1.2, w: 11.7, h: 0.5, fontSize: 14, bold: true, color: C_ACCENT, fontFace: 'Arial'
    });

    slide.addText("ĐỒ ÁN ĐIỆN TOÁN ĐÁM MÂY: NỀN TẢNG CLOUDBOARD\nĐÃ ĐƯỢC TRIỂN KHAI VÀ VẬN HÀNH THÀNH CÔNG", {
      x: 0.8, y: 1.8, w: 11.7, h: 1.4, fontSize: 24, bold: true, color: C_WHITE, fontFace: 'Arial'
    });

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 3.5, w: 11.7, h: 2.8, fill: { color: '2E2968' }, line: { color: '4338CA', width: 1.5 }, rectRadius: 0.1
    });

    slide.addText([
      { text: "THÔNG TIN TRUY CẬP VÀ KIỂM TRA ĐỒ ÁN\n\n", options: { bold: true, color: 'FCD34D', fontSize: 14 } },
      { text: "• Sinh viên thực hiện: ", options: { bold: true, color: '93C5FD', fontSize: 13 } },
      { text: "Nguyễn Văn Huy Hoàng  |  Mã sinh viên: 23IT089\n", options: { color: C_WHITE, fontSize: 13 } },
      { text: "• Địa chỉ ứng dụng Live (Render PaaS): ", options: { bold: true, color: '93C5FD', fontSize: 13 } },
      { text: "https://finalproject-cloudcomputing.onrender.com\n", options: { color: C_ACCENT, fontSize: 13, underline: true } },
      { text: "• Endpoint Giám sát Sức khỏe hệ thống: ", options: { bold: true, color: '93C5FD', fontSize: 13 } },
      { text: "https://finalproject-cloudcomputing.onrender.com/api/health\n", options: { color: 'A7F3D0', fontSize: 13, underline: true } },
      { text: "• Mã nguồn dự án (GitHub Repository): ", options: { bold: true, color: '93C5FD', fontSize: 13 } },
      { text: "https://github.com/HOANGNGUYEN1605/FinalProject_CloudComputing\n\n", options: { color: 'E2E8F0', fontSize: 12 } },
      { text: "Kính chúc Quý Thầy/Cô dồi dào sức khỏe và công tác tốt! Xin trân trọng cảm ơn!", options: { bold: true, color: C_WHITE, fontSize: 13 } }
    ], { x: 1.2, y: 3.7, w: 11.0, h: 2.4, fontFace: 'Arial' });
  }

  // Save presentation
  const finalDir = path.join(__dirname, 'Đồ_án_Task_Management_–_Node.js,_MongoDB_Atlas,_Render_Vercel.pptx');
  const artifactDir = 'C:\\Users\\OS\\.gemini\\antigravity\\brain\\c48a5e15-36d9-4d74-ab9d-6996e0384a5e\\Đồ_án_Task_Management_–_Node.js,_MongoDB_Atlas,_Render_Vercel.pptx';

  await pptx.writeFile({ fileName: finalDir });
  console.log('Saved presentation to:', finalDir);

  // Copy to artifact directory too
  try {
    fs.copyFileSync(finalDir, artifactDir);
    console.log('Copied presentation to artifact dir:', artifactDir);
  } catch (err) {
    console.warn('Could not copy to artifact dir:', err.message);
  }
}

createPresentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
