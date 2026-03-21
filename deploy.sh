#!/bin/bash
set -e

echo "===== DuiJie 部署脚本 ====="

# 1. 系统更新 + 基础工具
echo "[1/8] 安装基础依赖..."
apt update -y
apt install -y curl git nginx mysql-server

# 2. 安装 Node.js 20.x (如果未安装)
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 18 ]]; then
  echo "[2/8] 安装 Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
else
  echo "[2/8] Node.js 已安装: $(node -v)"
fi

# 3. 安装 PM2
if ! command -v pm2 &> /dev/null; then
  echo "[3/8] 安装 PM2..."
  npm install -g pm2
else
  echo "[3/8] PM2 已安装"
fi

# 4. 克隆/更新项目
echo "[4/8] 拉取项目代码..."
PROJECT_DIR="/opt/duijie"
if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR"
  git pull origin main
else
  git clone https://github.com/moyua527/1.git "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

# 5. 安装后端依赖
echo "[5/8] 安装后端依赖..."
cd "$PROJECT_DIR/server/duijie"
npm install --production

# 6. 构建前端 (已有dist则跳过，通过git拉取)
echo "[6/8] 检查前端构建..."
FRONTEND_DIR="$PROJECT_DIR/frontend/duijieReact"
if [ ! -d "$FRONTEND_DIR/dist" ]; then
  cd "$FRONTEND_DIR"
  npm install
  npx tsc -b
  npx vite build
else
  echo "  前端已构建"
fi

# 7. 配置 MySQL
echo "[7/8] 配置数据库..."
systemctl start mysql 2>/dev/null || true
systemctl enable mysql 2>/dev/null || true

# 创建数据库和用户
mysql -u root <<'EOSQL'
CREATE DATABASE IF NOT EXISTS voice_room_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'duijie'@'localhost' IDENTIFIED BY 'DuiJie@2024!';
GRANT ALL PRIVILEGES ON voice_room_db.* TO 'duijie'@'localhost';
FLUSH PRIVILEGES;
EOSQL

# 检查表是否已存在，不存在则导入
TABLE_CHECK=$(mysql -u root -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='voice_room_db' AND table_name='voice_users'" -sN)
if [ "$TABLE_CHECK" = "0" ]; then
  echo "  导入初始化数据..."
  mysql -u root voice_room_db < "$PROJECT_DIR/server/duijie/scripts/full-init.sql"
else
  echo "  数据库表已存在，跳过导入"
  # 确保新字段存在
  mysql -u root voice_room_db -e "ALTER TABLE voice_users ADD COLUMN IF NOT EXISTS email VARCHAR(200) AFTER nickname;" 2>/dev/null || true
  mysql -u root voice_room_db -e "ALTER TABLE voice_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) AFTER email;" 2>/dev/null || true
fi

# 8. 创建后端 .env
echo "[8/8] 配置环境变量..."
cat > "$PROJECT_DIR/server/duijie/.env" <<'EOF'
PORT=1800
DB_HOST=localhost
DB_USER=duijie
DB_PASSWORD=DuiJie@2024!
DB_NAME=voice_room_db
EOF

# 9. 配置 Nginx
echo "配置 Nginx..."
cat > /etc/nginx/sites-available/duijie <<'NGINX'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    root /opt/duijie/frontend/duijieReact/dist;
    index index.html;

    # 前端路由 (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:1800;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 代理
    location /socket.io/ {
        proxy_pass http://127.0.0.1:1800;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://127.0.0.1:1800;
    }

    client_max_body_size 50M;
}
NGINX

# 启用站点
ln -sf /etc/nginx/sites-available/duijie /etc/nginx/sites-enabled/duijie
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# 10. 启动后端
echo "启动后端服务..."
cd "$PROJECT_DIR/server/duijie"
pm2 delete duijie 2>/dev/null || true
pm2 start standalone.js --name duijie
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "============================="
echo "  DuiJie 部署完成!"
echo "  访问地址: http://160.202.253.143"
echo "  测试账号: admin / admin123"
echo "  邀请码: duijie2024"
echo "============================="
