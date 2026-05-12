# 小帅 AI 日报 - 启动/关闭操作手册

## 一、启动预览（按顺序执行）

### 步骤 1：启动全部 Docker 服务

```bash
cd /Users/dreamsoldier/TraeProject/v2026-4-27_CrawlAINews
docker compose up -d
```

**说明：**
- 一次性启动三个服务：PostgreSQL 15（数据库）、Redis 7（缓存）、后端 API（Node.js）
- `-d` 表示后台运行，所有服务在容器中独立运行
- 首次执行会自动拉取镜像并构建后端容器
- 约需 30-60 秒完成（首次构建较慢）

**验证：**
```bash
docker compose ps
```
看到 `ai-news-postgres`、`ai-news-redis`、`ai-news-backend` 状态为 `Up` 即成功。

---

### 步骤 2：启动微信小程序开发者工具预览

**方式 A - 命令行启动（推荐）：**
```bash
open -a "微信开发者工具"
```

**方式 B - 手动启动：**
1. 打开「微信开发者工具」应用
2. 点击「打开项目」
3. 选择目录：`/Users/dreamsoldier/TraeProject/v2026-4-27_CrawlAINews/weapp`
4. 填写你的 AppID（或选择测试号）
5. 点击「确定」

**说明：**
- 预览前确保 Docker 服务已全部启动（步骤 1）
- 首次加载可能较慢，请等待数据加载完成
- 点击「编译」按钮或按 `Cmd+B` 刷新小程序

---

### 步骤 3（可选）：手动执行爬虫抓取数据

```bash
curl -X POST http://localhost:3000/api/news/crawl
```

**说明：**
- 触发爬虫从各信息源抓取最新 AI 资讯
- 爬虫在后台异步执行，约需 30-60 秒
- 完成后会自动生成 AI 摘要
- 每天凌晨 2 点会自动执行一次（通过 cron）

---

### 步骤 4（可选）：查看数据统计

```bash
# 查看当天数据条数
curl -s http://localhost:3000/api/news | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'日期: {d[\"data\"][\"date\"]}, 条数: {d[\"data\"][\"count\"]}')"

# 查看指定日期数据条数（如 2026-04-30）
curl -s "http://localhost:3000/api/news?date=2026-04-30" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'日期: {d[\"data\"][\"date\"]}, 条数: {d[\"data\"][\"count\"]}')"

# 查看数据库总数据量
curl -s http://localhost:3000/api/news/stats
```

**说明：**
- 第一条命令显示当天的资讯数量
- 第二条命令可以查看指定日期的资讯数量
- 第三条命令返回数据库统计信息（总数、日期分布等）

---

## 二、关闭预览（按顺序执行）

### 步骤 1：关闭微信小程序开发者工具

**方式 A - 命令行：**
```bash
pkill -f "微信开发者工具"
```

**方式 B - 手动：**
- 点击微信开发者工具窗口左上角 `X` 关闭

---

### 步骤 2：关闭所有 Docker 服务

```bash
cd /Users/dreamsoldier/TraeProject/v2026-4-27_CrawlAINews
docker compose down
```

**说明：**
- 停止并移除所有容器（PostgreSQL、Redis、后端）
- 数据会持久化保存在 Docker Volume 中，下次启动不会丢失

**验证：**
```bash
docker compose ps
```
无容器列表即表示已关闭。

---

## 三、一键启动/关闭脚本（可选）

### 一键启动

```bash
#!/bin/bash
echo "=== 启动小帅 AI 日报 ==="
cd /Users/dreamsoldier/TraeProject/v2026-4-27_CrawlAINews
echo "[1/2] 启动 Docker 服务..."
docker compose up -d
echo "[2/2] 启动微信开发者工具..."
open -a "微信开发者工具"
echo "=== 启动完成 ==="
```

### 一键关闭

```bash
#!/bin/bash
echo "=== 关闭小帅 AI 日报 ==="
echo "[1/2] 关闭微信开发者工具..."
pkill -f "微信开发者工具"
echo "[2/2] 关闭 Docker 服务..."
cd /Users/dreamsoldier/TraeProject/v2026-4-27_CrawlAINews
docker compose down
echo "=== 关闭完成 ==="
```

---

## 四、常见问题

| 问题 | 解决方式 |
|------|---------|
| 端口 3000 被占用 | 检查是否有其他程序占用，或执行 `docker compose down` 后重新启动 |
| 后端容器启动失败 | 检查 `.env` 文件配置是否正确，查看日志：`docker logs ai-news-backend` |
| 小程序显示"加载失败" | 确认 Docker 服务已启动，尝试重新编译小程序 |
| 爬虫执行后无数据 | 等待 30 秒后刷新，或查看后端日志：`docker logs ai-news-backend` |
| Docker 容器启动失败 | `docker compose down` 后重新 `docker compose up -d` |
| 代码修改不生效 | 后端容器已挂载源码目录，`tsx watch` 会自动热重载，等待几秒即可 |

---

## 五、服务架构图

```
微信小程序 (weapp)
       ↓ HTTP 请求
┌──────────────────────────────────┐
│         Docker Compose           │
│  ┌─────────┬─────────┬─────────┐ │
│  ↓         ↓         ↓         │ │
│  PostgreSQL Redis    后端 API  │ │
│   (5432)   (6379)   (3000)    │ │
│  └─────────┴─────────┴─────────┘ │
└──────────────────────────────────┘
```

---

## 六、容器说明

| 容器名称 | 服务 | 端口映射 | 说明 |
|---------|------|---------|------|
| ai-news-postgres | PostgreSQL 15 | 5432:5432 | 主数据库，存储新闻数据 |
| ai-news-redis | Redis 7 | 6379:6379 | 缓存服务，加速首页查询 |
| ai-news-backend | Node.js + Express | 3000:3000 | 后端 API 服务，支持热重载 |

**热重载说明：**
- 后端源码目录 `./backend/src` 已挂载到容器内
- 修改代码后，`tsx watch` 会自动重新编译并重启服务
- 无需手动重启容器

---

## 七、数据库查询

### 登录 PostgreSQL 容器

```bash
# 进入 PostgreSQL 容器
docker exec -it ai-news-postgres psql -U postgres -d ai_news
```

**说明：**
- 用户名：`postgres`
- 数据库名：`ai_news`
- 密码：`postgres`（无需输入，已配置信任连接）

### 常用 SQL 查询

```sql
-- 1. 查看表结构
\d news;

-- 2. 统计总数据量
SELECT COUNT(*) FROM news;

-- 3. 按日期统计数据量
SELECT DATE(crawled_at) as date, COUNT(*) as count 
FROM news 
GROUP BY DATE(crawled_at) 
ORDER BY date DESC;

-- 4. 查询最新的 10 条资讯
SELECT id, title, source, crawled_at 
FROM news 
ORDER BY crawled_at DESC 
LIMIT 10;

-- 5. 查询指定日期的资讯（如 2026-04-30）
SELECT id, title, source, source_url 
FROM news 
WHERE DATE(crawled_at) = '2026-04-30' 
ORDER BY crawled_at DESC;

-- 6. 按来源统计数据量
SELECT source, COUNT(*) as count 
FROM news 
GROUP BY source 
ORDER BY count DESC;

-- 7. 查询有 AI 摘要的资讯数量
SELECT COUNT(*) FROM news WHERE summary IS NOT NULL;

-- 8. 查看收藏表数据
SELECT COUNT(*) FROM favorites;
SELECT * FROM favorites LIMIT 10;

-- 9. 退出
\q
```

### 通过 Docker 直接执行 SQL（无需进入容器）

```bash
# 统计总数据量
docker exec ai-news-postgres psql -U postgres -d ai_news -c "SELECT COUNT(*) FROM news;"

# 按日期统计
docker exec ai-news-postgres psql -U postgres -d ai_news -c "SELECT DATE(crawled_at) as date, COUNT(*) as count FROM news GROUP BY DATE(crawled_at) ORDER BY date DESC;"

# 查询指定日期数据
docker exec ai-news-postgres psql -U postgres -d ai_news -c "SELECT COUNT(*) FROM news WHERE DATE(crawled_at) = '2026-04-30';"
```

---

## 八、数据库表结构

### news 表（新闻表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键，自增 |
| title | VARCHAR(500) | 新闻标题 |
| source | VARCHAR(50) | 来源标识（如 solidot、ithome） |
| source_url | VARCHAR(1000) | 原文链接 |
| source_name | VARCHAR(100) | 来源名称（如 Solidot、IT之家） |
| publish_date | DATE | 发布日期 |
| content | TEXT | 原文内容 |
| summary | TEXT | AI 生成的摘要 |
| category | VARCHAR(50) | 分类 |
| tags | TEXT[] | 标签数组 |
| crawled_at | TIMESTAMP | 抓取时间 |
| created_at | TIMESTAMP | 创建时间 |

### favorites 表（收藏表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键，自增 |
| news_id | INTEGER | 关联的新闻 ID |
| openid | VARCHAR(100) | 用户 OpenID |
| created_at | TIMESTAMP | 创建时间 |
