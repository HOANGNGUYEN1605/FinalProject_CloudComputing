# ==========================================
# Giai đoạn 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy manifest files
COPY package*.json ./

# Cài đặt dependencies (chỉ production)
RUN npm ci --only=production

# ==========================================
# Giai đoạn 2: Production Runner Image
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Thiết lập biến môi trường chuẩn Cloud
ENV NODE_ENV=production \
    PORT=3000 \
    DOCKER=true

# Tạo user không đặc quyền để tăng cường an ninh bảo mật container
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies từ stage trước
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

# Tạo thư mục upload & report với quyền ghi cho appuser
RUN mkdir -p public/uploads public/reports && \
    chown -R appuser:appgroup public/uploads public/reports

USER appuser

EXPOSE 3000

# Healthcheck định kỳ cho Cloud Orchestrator (Docker/Kubernetes/ECS)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) process.exit(1);});"

CMD ["node", "server.js"]
