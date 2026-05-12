# 小帅 AI 日报 - 腾讯云服务器部署指南

## 一、服务器环境准备

### 1.1 服务器配置要求

| 配置项 | 最低要求 | 推荐配置 |
|--------|----------|----------|
| 操作系统 | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2核 | 4核 |
| 内存 | 4GB | 8GB |
| 存储 | 50GB SSD | 100GB SSD |
| 带宽 | 1Mbps | 5Mbps |

### 1.2 登录服务器

```bash
# 使用 SSH 登录
ssh root@<服务器公网IP>

# 或使用密钥登录（推荐）
ssh -i ~/.ssh/id_rsa root@<服务器公网IP>
```

### 1.3 更新系统

```bash
# 更新软件包列表
apt update && apt upgrade -y

# 安装必要依赖
apt install -y curl wget git vim unzip
```

---

## 二、Docker 环境安装

### 2.1 安装 Docker

```bash
# 卸载旧版本
apt remove -y docker docker-engine docker.io containerd runc

# 设置 Docker 仓库
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/trusted.gpg.d/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/trusted.gpg.d/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker 引擎
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 2.2 配置 Docker 加速（国内服务器推荐）

```bash
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

# 重启 Docker 服务
systemctl restart docker
```

---

## 三、项目部署

### 3.1 创建项目目录

```bash
mkdir -p /data/apps/ai-news
cd /data/apps/ai-news
```

### 3.2 克隆项目代码

```bash
# 使用 HTTPS
git clone https://github.com/your-username/CrawlAINews.git .

# 或使用 SSH（需配置密钥）
git clone git@github.com:your-username/CrawlAINews.git .
```

### 3.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

**关键配置项说明：**

```bash
# 数据库配置（保持默认即可）
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ai_news
DB_USER=postgres
DB_PASSWORD=your-database-password

# Redis 配置（保持默认即可）
REDIS_HOST=redis
REDIS_PORT=6379

# 火山引擎 API Key（必填）
VOLCENGINE_API_KEY=your-volcengine-api-key

# 爬虫配置
CRON_SCHEDULE=0 2 * * *        # 每天凌晨 2 点执行
ENABLE_SCORING=false           # 是否启用 AI 评分过滤
SCORE_THRESHOLD=6.0            # 评分阈值
ENABLE_SEMANTIC_DEDUP=false    # 是否启用语义去重

# 时区设置
TZ=Asia/Shanghai

# Telegram 配置（可选）
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### 3.4 启动服务

```bash
# 构建并启动所有服务（首次启动）
docker compose up -d --build

# 后续启动（无需重新构建）
docker compose up -d

# 查看服务状态
docker compose ps
```

**预期输出：**

```
NAME                  IMAGE                 COMMAND                  SERVICE             CREATED             STATUS              PORTS
ai-news-postgres      postgres:15-alpine    "docker-entrypoint.s…"   postgres            About an hour ago   Up About an hour    5432/tcp
ai-news-redis         redis:7-alpine        "docker-entrypoint.s…"   redis               About an hour ago   Up About an hour    6379/tcp
ai-news-backend       ai-news-backend       "npm run dev"            backend             About an hour ago   Up About an hour    0.0.0.0:3000->3000/tcp
```

### 3.5 验证服务

```bash
# 检查后端服务是否正常
curl http://localhost:3000/api/news/stats

# 预期输出示例
{"total":0,"summarized":0,"dates":[]}
```

### 3.6 首次数据抓取

```bash
# 手动触发一次爬虫
curl -X POST http://localhost:3000/api/news/crawl

# 等待几分钟后检查数据
curl http://localhost:3000/api/news/stats
```

---

## 四、反向代理配置（Nginx）

### 4.1 安装 Nginx

```bash
apt install -y nginx
```

### 4.2 创建配置文件

```bash
cat > /etc/nginx/sites-available/ai-news << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS（如果配置了 SSL）
    # return 301 https://$server_name$request_uri;
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 4.3 启用配置

```bash
ln -s /etc/nginx/sites-available/ai-news /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 4.4 SSL 配置（可选但推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
certbot --nginx -d your-domain.com

# 自动续期测试
certbot renew --dry-run
```

---

## 五、服务管理脚本

### 5.1 创建启动脚本

```bash
cat > /usr/local/bin/ai-news-start << 'EOF'
#!/bin/bash
cd /data/apps/ai-news
docker compose up -d
echo "AI News service started"
EOF

chmod +x /usr/local/bin/ai-news-start
```

### 5.2 创建停止脚本

```bash
cat > /usr/local/bin/ai-news-stop << 'EOF'
#!/bin/bash
cd /data/apps/ai-news
docker compose down
echo "AI News service stopped"
EOF

chmod +x /usr/local/bin/ai-news-stop
```

### 5.3 创建重启脚本

```bash
cat > /usr/local/bin/ai-news-restart << 'EOF'
#!/bin/bash
cd /data/apps/ai-news
docker compose down
docker compose up -d
echo "AI News service restarted"
EOF

chmod +x /usr/local/bin/ai-news-restart
```

### 5.4 使用方式

```bash
# 启动服务
ai-news-start

# 停止服务
ai-news-stop

# 重启服务
ai-news-restart
```

---

## 六、开机自启配置

### 6.1 创建 systemd 服务

```bash
cat > /etc/systemd/system/ai-news.service << 'EOF'
[Unit]
Description=AI News Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/ai-news-start
ExecStop=/usr/local/bin/ai-news-stop
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
```

### 6.2 启用自启

```bash
systemctl daemon-reload
systemctl enable ai-news
```

---

## 七、防火墙配置

```bash
# 允许 HTTP 访问
ufw allow 80/tcp

# 允许 HTTPS 访问
ufw allow 443/tcp

# 允许 SSH 访问（保持原有规则）
ufw allow 22/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

---

## 八、目录结构

```
/data/apps/ai-news/
├── backend/           # 后端代码
├── weapp/             # 微信小程序代码
├── docs/              # 文档
├── .env               # 环境变量配置
├── .env.example       # 环境变量模板
├── docker-compose.yml # Docker 配置
└── startCrawlAINews.sh # 启动脚本
```

---

## 九、常见问题

### 9.1 Docker 启动失败

```bash
# 查看日志
docker logs ai-news-backend

# 常见错误：端口占用
lsof -i :3000
kill -9 <PID>
```

### 9.2 数据库连接失败

```bash
# 检查数据库容器状态
docker compose ps postgres

# 进入数据库容器
docker exec -it ai-news-postgres psql -U postgres -d ai_news
```

### 9.3 爬虫不执行

```bash
# 检查容器时区
docker exec ai-news-backend date

# 检查 cron 日志
docker logs ai-news-backend | grep cron
```

### 9.4 内存不足

```bash
# 查看内存使用
free -h

# 查看进程内存
top

# 清理 Docker 缓存
docker system prune -a
```

---

## 十、部署清单

| 步骤 | 状态 | 说明 |
|------|------|------|
| ✅ | 服务器登录 | SSH 连接 |
| ✅ | 系统更新 | apt update && apt upgrade |
| ✅ | Docker 安装 | docker-ce + docker-compose |
| ✅ | 项目克隆 | git clone |
| ✅ | 环境配置 | .env 文件 |
| ✅ | 服务启动 | docker compose up -d |
| ✅ | 反向代理 | Nginx 配置 |
| ✅ | SSL 证书 | Certbot |
| ✅ | 开机自启 | systemd 服务 |
| ✅ | 防火墙 | ufw 配置 |
