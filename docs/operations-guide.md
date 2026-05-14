# 小帅 AI 日报 - 日常运维指南

## 一、服务状态监控

### 1.1 查看服务状态

```bash
# 查看所有容器状态
docker compose ps

# 查看指定服务状态
docker compose ps backend
docker compose ps postgres
docker compose ps redis
```

**状态说明：**
| 状态 | 说明 |
|------|------|
| `Up` | 服务正常运行 |
| `Up (healthy)` | 服务正常且健康检查通过 |
| `Exited` | 服务已退出 |
| `Restarting` | 服务正在重启 |

### 1.2 查看服务日志

```bash
# 查看后端日志（实时）
docker logs -f ai-news-backend

# 查看最近 100 行日志
docker logs --tail=100 ai-news-backend

# 查看带时间戳的日志
docker logs -t ai-news-backend

# 查看数据库日志
docker logs ai-news-postgres

# 查看 Redis 日志
docker logs ai-news-redis
```

### 1.3 检查系统资源

```bash
# 查看 CPU 和内存使用
top

# 查看内存详细信息
free -h

# 查看磁盘使用
df -h

# 查看 Docker 资源使用
docker stats
```

### 1.4 健康检查脚本

```bash
cat > /usr/local/bin/ai-news-check << 'EOF'
#!/bin/bash
echo "=== AI News Service Health Check ==="
echo ""

# 检查容器状态
echo "1. Container Status:"
docker compose ps

echo ""
echo "2. Backend Response:"
curl -s http://localhost:3000/api/news/stats || echo "Backend not responding"

echo ""
echo "3. Database Connection:"
docker exec ai-news-postgres pg_isready -U postgres || echo "Database not ready"

echo ""
echo "4. Redis Connection:"
docker exec ai-news-redis redis-cli ping || echo "Redis not ready"
EOF

chmod +x /usr/local/bin/ai-news-check
```

---

## 二、日志管理

### 2.1 日志轮转配置

```bash
# 创建日志目录
mkdir -p /var/log/ai-news

# 创建 logrotate 配置
cat > /etc/logrotate.d/ai-news << 'EOF'
/var/log/ai-news/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
    create 644 root root
}
EOF
```

### 2.2 日志收集

```bash
# 将容器日志输出到文件
docker logs ai-news-backend > /var/log/ai-news/backend.log 2>&1

# 实时日志收集（配合 cron）
cat > /etc/cron.daily/ai-news-logs << 'EOF'
#!/bin/bash
docker logs ai-news-backend --since=24h > /var/log/ai-news/backend-$(date +%Y%m%d).log
gzip /var/log/ai-news/backend-$(date +%Y%m%d).log
EOF

chmod +x /etc/cron.daily/ai-news-logs
```

### 2.3 日志分析

```bash
# 搜索错误日志
docker logs ai-news-backend | grep -i error

# 搜索爬虫相关日志
docker logs ai-news-backend | grep -i crawl

# 搜索 API 请求日志
docker logs ai-news-backend | grep -i api

# 统计错误数量
docker logs ai-news-backend | grep -i error | wc -l
```

---

## 三、数据备份与恢复

### 3.1 数据库备份

```bash
# 创建备份目录
mkdir -p /data/backup/postgres

# 手动备份
docker exec ai-news-postgres pg_dump -U postgres ai_news > /data/backup/postgres/backup-$(date +%Y%m%d).sql

# 压缩备份
gzip /data/backup/postgres/backup-$(date +%Y%m%d).sql

# 自动化备份脚本
cat > /etc/cron.daily/ai-news-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/data/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

# 执行备份
docker exec ai-news-postgres pg_dump -U postgres ai_news > ${BACKUP_DIR}/backup-${DATE}.sql

# 压缩
gzip ${BACKUP_DIR}/backup-${DATE}.sql

# 保留最近 30 天备份
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_DIR}/backup-${DATE}.sql.gz"
EOF

chmod +x /etc/cron.daily/ai-news-backup
```

### 3.2 数据库恢复

```bash
# 停止后端服务
docker compose stop backend

# 恢复数据库
gunzip -c /data/backup/postgres/backup-20240101.sql.gz | docker exec -i ai-news-postgres psql -U postgres ai_news

# 启动后端服务
docker compose start backend
```

### 3.3 Redis 数据备份

```bash
# Redis 备份
docker exec ai-news-redis redis-cli SAVE
docker cp ai-news-redis:/data/dump.rdb /data/backup/redis/dump-$(date +%Y%m%d).rdb

# Redis 恢复
docker cp /data/backup/redis/dump-20240101.rdb ai-news-redis:/data/dump.rdb
docker restart ai-news-redis
```

### 3.4 数据清空（重置）

> ⚠️ **重要提示**：PostgreSQL 和 Redis 之间**不会自动联动清除**。清空数据库后，必须手动清空缓存，否则用户会看到已删除的数据！

```bash
# 方式一：逐个清空（保留容器配置）

# 1. 清空 PostgreSQL（进入容器执行）
docker exec -it ai-news-postgres psql -U postgres -d ai_news -c "DELETE FROM news;"
docker exec -it ai-news-postgres psql -U postgres -d ai_news -c "DELETE FROM favorites;"

# 2. 清空 Redis（清除所有缓存）
docker exec ai-news-redis redis-cli FLUSHALL

# 方式二：重置整个服务（更彻底，会删除所有数据卷）

# 停止服务并删除数据卷
docker compose down -v

# 重新启动（会重新创建空数据库和缓存）
docker compose up -d --build
```

**数据联动说明：**

| 操作 | 是否需要手动操作 | 说明 |
|------|----------------|------|
| 清空 PostgreSQL | ✅ 是 | `DELETE FROM news;` |
| 清空 Redis | ✅ 是 | `redis-cli FLUSHALL` |
| 自动联动 | ❌ 否 | 需要额外开发 |

**最佳实践**：清空数据库后，务必同步清空缓存，避免返回脏数据！

---

## 四、性能优化

### 4.1 数据库优化

```bash
# 查看数据库连接数
docker exec ai-news-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 查看慢查询日志
docker exec ai-news-postgres psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# 创建索引（如果需要）
docker exec ai-news-postgres psql -U postgres ai_news -c "CREATE INDEX IF NOT EXISTS idx_news_date ON news(publish_date);"
```

### 4.2 Redis 优化

```bash
# 查看 Redis 内存使用
docker exec ai-news-redis redis-cli INFO memory

# 查看 Redis 统计信息
docker exec ai-news-redis redis-cli INFO stats

# 设置内存上限
docker exec ai-news-redis redis-cli CONFIG SET maxmemory 256mb
docker exec ai-news-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 4.3 Docker 资源限制

```bash
# 修改 docker-compose.yml 添加资源限制
# 在 backend 服务中添加：
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 2G
#     reservations:
#       cpus: '1'
#       memory: 1G
```

### 4.4 缓存策略

```bash
# 查看 Redis 缓存状态
docker exec ai-news-redis redis-cli KEYS "news:*"

# 手动清理缓存
docker exec ai-news-redis redis-cli FLUSHALL

# 设置缓存过期时间（已在代码中配置）
```

---

## 五、安全管理

### 5.1 定期更新

```bash
# 更新系统
apt update && apt upgrade -y

# 更新 Docker 镜像
docker compose pull
docker compose up -d --build

# 更新项目代码
cd /data/apps/ai-news
git pull origin main
docker compose up -d --build
```

### 5.2 安全检查

```bash
# 检查开放端口
netstat -tlnp

# 检查防火墙规则
ufw status

# 检查用户账户
cat /etc/passwd | grep -E "root|sudo"

# 检查 SSH 配置
cat /etc/ssh/sshd_config | grep -E "Port|PermitRootLogin|PasswordAuthentication"
```

### 5.3 日志审计

```bash
# 查看登录日志
cat /var/log/auth.log | grep -i ssh

# 查看 sudo 操作日志
cat /var/log/auth.log | grep -i sudo

# 查看失败登录尝试
cat /var/log/auth.log | grep -i failed
```

---

## 六、故障排查

### 6.1 服务无法启动

```bash
# 检查端口占用
lsof -i :3000

# 检查 Docker 服务状态
systemctl status docker

# 检查 Docker 日志
journalctl -u docker

# 检查磁盘空间
df -h

# 检查内存
free -h
```

### 6.2 爬虫不执行

```bash
# 检查容器时区
docker exec ai-news-backend date

# 检查 cron 配置
docker exec ai-news-backend cat /etc/crontabs/root

# 检查后端日志中的 cron 信息
docker logs ai-news-backend | grep -i cron

# 手动触发爬虫
curl -X POST http://localhost:3000/api/news/crawl
```

### 6.3 数据库连接失败

```bash
# 检查数据库容器状态
docker compose ps postgres

# 检查数据库日志
docker logs ai-news-postgres

# 测试数据库连接
docker exec ai-news-postgres psql -U postgres -c "SELECT 1;"

# 检查数据库配置
cat /data/apps/ai-news/.env | grep -i db_
```

### 6.4 API 请求失败

```bash
# 检查后端服务
curl -v http://localhost:3000/api/news/stats

# 检查 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 检查防火墙
ufw status
```

---

## 七、日常操作清单

### 7.1 每日检查

```bash
# 1. 检查服务状态
docker compose ps

# 2. 检查日志是否有错误
docker logs ai-news-backend | grep -i error

# 3. 检查数据统计
curl http://localhost:3000/api/news/stats

# 4. 检查系统资源
free -h && df -h
```

### 7.2 每周维护

```bash
# 1. 更新系统
apt update && apt upgrade -y

# 2. 清理 Docker 缓存
docker system prune -a -f

# 3. 检查备份状态
ls -la /data/backup/postgres/

# 4. 检查安全日志
cat /var/log/auth.log | grep -i failed | tail -10
```

### 7.3 每月维护

```bash
# 1. 完整备份
docker exec ai-news-postgres pg_dump -U postgres ai_news > /data/backup/postgres/full-backup-$(date +%Y%m).sql
gzip /data/backup/postgres/full-backup-$(date +%Y%m).sql

# 2. 检查磁盘健康
smartctl -a /dev/sda

# 3. 审查用户账户
cat /etc/passwd

# 4. 更新项目代码
cd /data/apps/ai-news
git pull origin main
docker compose up -d --build
```

---

## 八、告警配置

### 8.1 邮件告警（使用 ssmtp）

```bash
# 安装 ssmtp
apt install -y ssmtp mailutils

# 配置 ssmtp
cat > /etc/ssmtp/ssmtp.conf << 'EOF'
root=your-email@gmail.com
mailhub=smtp.gmail.com:587
AuthUser=your-email@gmail.com
AuthPass=your-app-password
UseTLS=YES
UseSTARTTLS=YES
EOF
```

### 8.2 告警脚本

```bash
cat > /usr/local/bin/ai-news-alert << 'EOF'
#!/bin/bash

SUBJECT="AI News Service Alert"
TO="admin@example.com"

# 检查服务状态
if ! curl -s http://localhost:3000/api/news/stats > /dev/null; then
    echo "AI News backend is not responding" | mail -s "$SUBJECT" $TO
fi

# 检查数据库
if ! docker exec ai-news-postgres pg_isready -U postgres > /dev/null; then
    echo "PostgreSQL database is not ready" | mail -s "$SUBJECT" $TO
fi

# 检查磁盘空间
DISK_USAGE=$(df -h / | grep / | awk '{print $5}' | sed 's/%//g')
if [ $DISK_USAGE -gt 90 ]; then
    echo "Disk usage is ${DISK_USAGE}% on $(hostname)" | mail -s "$SUBJECT" $TO
fi
EOF

chmod +x /usr/local/bin/ai-news-alert

# 添加到 cron
echo "*/30 * * * * root /usr/local/bin/ai-news-alert" >> /etc/cron.d/ai-news-alert
```

---

## 九、升级与迁移

### 9.1 版本升级

```bash
# 1. 备份数据
docker exec ai-news-postgres pg_dump -U postgres ai_news > /data/backup/postgres/pre-upgrade.sql

# 2. 停止服务
docker compose down

# 3. 拉取最新代码
git pull origin main

# 4. 更新配置（如有需要）
cp .env.example .env
# 编辑 .env 添加新配置项

# 5. 重新构建
docker compose up -d --build

# 6. 验证
curl http://localhost:3000/api/news/stats
```

### 9.2 服务器迁移

```bash
# 在旧服务器上
docker exec ai-news-postgres pg_dump -U postgres ai_news > backup.sql
scp backup.sql root@new-server:/data/backup/

# 在新服务器上
docker exec -i ai-news-postgres psql -U postgres ai_news < /data/backup/backup.sql
```

---

## 十、运维命令速查

### 10.1 Docker 命令

| 命令 | 说明 |
|------|------|
| `docker compose up -d` | 启动所有服务 |
| `docker compose down` | 停止所有服务 |
| `docker compose restart` | 重启所有服务 |
| `docker compose logs -f` | 实时查看日志 |
| `docker compose ps` | 查看服务状态 |
| `docker exec -it <container> bash` | 进入容器 |

### 10.2 快捷命令

| 命令 | 说明 |
|------|------|
| `ai-news-start` | 启动服务 |
| `ai-news-stop` | 停止服务 |
| `ai-news-restart` | 重启服务 |
| `ai-news-check` | 健康检查 |

### 10.3 日志命令

| 命令 | 说明 |
|------|------|
| `docker logs -f ai-news-backend` | 实时查看后端日志 |
| `docker logs --tail=100 ai-news-backend` | 查看最近 100 行 |
| `docker logs ai-news-backend \| grep error` | 搜索错误 |

---

## 十一、常见问题处理

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 服务启动失败 | 端口占用 | `lsof -i :3000` 找到并杀死进程 |
| 数据库连接失败 | 容器未启动 | `docker compose up -d postgres` |
| 爬虫不执行 | 时区错误 | 检查 `TZ=Asia/Shanghai` 配置 |
| API 请求超时 | 网络问题 | 检查防火墙和网络配置 |
| 内存不足 | 资源限制 | 增加服务器内存或调整资源配置 |
| 磁盘空间不足 | 日志过多 | 清理日志或扩大磁盘 |
