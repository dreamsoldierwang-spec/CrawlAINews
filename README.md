# 🤖 小帅 AI 日报

一个基于 Node.js + 微信小程序的 AI 新闻聚合平台，自动抓取多个信息源的 AI 资讯，利用大模型生成摘要和评分，为用户提供高质量的 AI 新闻日报服务。

## ✨ 功能特性

### 📰 多源信息聚合
- 支持 17+ 个信息源，涵盖中英文渠道
- 包括 Hacker News、Reddit、GitHub、掘金、知乎等主流平台
- 自动过滤非 AI 相关内容

### 🤯 AI 智能处理
- 自动生成新闻摘要（火山引擎 kimi-k2.6）
- AI 智能评分（0-10 分）过滤低质量内容
- 语义去重，避免重复资讯

### 💬 社区评论
- 抓取 Hacker News / Reddit 热门评论
- AI 总结评论观点和讨论焦点

### 🎨 用户体验
- 微信小程序原生开发
- 支持三种阅读模式（白天/夜晚/护眼）
- 全局主题同步切换
- 收藏功能，支持离线阅读

### ⚙️ 技术特性
- 定时自动抓取（每天凌晨 2 点）
- PostgreSQL + Redis 数据存储
- Docker 容器化部署
- RESTful API 接口

## 🛠️ 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 前端 | 微信小程序 | - |
| 后端 | Node.js + Express | 20.x |
| 数据库 | PostgreSQL | 15 |
| 缓存 | Redis | 7 |
| 大模型 | 火山引擎 Coding Plan | kimi-k2.6 |
| 定时任务 | node-cron | ^3.0 |
| 爬虫 | Cheerio + Axios + RSS Parser | - |

## 📁 项目结构

```
CrawlAINews/
├── backend/           # 后端服务
│   ├── src/
│   │   ├── crawlers/     # 爬虫模块（17+ 信息源）
│   │   ├── services/     # 业务服务
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   ├── config/       # 配置文件
│   │   └── utils/        # 工具函数
│   ├── Dockerfile
│   └── package.json
├── weapp/             # 微信小程序
│   ├── pages/            # 页面（首页、详情、收藏、个人中心）
│   ├── utils/            # 工具函数
│   ├── images/           # 图片资源
│   └── app.js
├── docs/              # 技术文档
│   ├── tech-architecture.md    # 技术架构
│   ├── crawler-sources.md      # 信息源说明
│   ├── deployment.md           # 部署指南
│   └── operations-guide.md     # 运维指南
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 快速开始

### 环境要求

- Docker >= 20.10
- Node.js >= 20.x（开发模式）
- 火山引擎 API Key（用于 AI 摘要和评分）

### 1. 克隆项目

```bash
git clone https://github.com/your-username/CrawlAINews.git
cd CrawlAINews
```

### 2. 配置环境变量

```bash
cp .env.example .env
vim .env
```

**关键配置：**

```bash
# 火山引擎 API Key（必填）
VOLCENGINE_API_KEY=your-volcengine-api-key

# 数据库配置（保持默认即可）
DB_PASSWORD=your-database-password

# 爬虫配置
CRON_SCHEDULE=0 2 * * *        # 每天凌晨 2 点执行
ENABLE_SCORING=false           # AI 评分过滤（可选）
SCORE_THRESHOLD=6.0            # 评分阈值
```

### 3. 启动服务

**方式一：Docker 完整部署（推荐）**

```bash
# 构建并启动所有服务（包括后端、数据库、Redis）
docker compose up -d --build

# 查看服务状态
docker compose ps

# 检查后端是否正常运行
curl http://localhost:3000/api/news/stats
```

**方式二：本地开发模式（修改代码时）**

```bash
# 只启动数据库和 Redis
docker compose up -d postgres redis

# 在另一个终端启动本地后端（支持热重载）
cd backend
npm install
npm run dev
```

### 4. 首次数据抓取

```bash
# 手动触发爬虫
curl -X POST http://localhost:3000/api/news/crawl

# 等待几分钟后检查数据
curl http://localhost:3000/api/news/stats
```

### 5. 微信小程序开发

1. 打开微信开发者工具
2. 导入 `weapp/` 目录
3. 配置小程序 AppID
4. 修改 `weapp/utils/api.js` 中的 API 地址为你的服务器地址

## 🌐 API 接口

### 新闻接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/news` | GET | 获取新闻列表 |
| `/api/news/:id` | GET | 获取单条新闻详情 |
| `/api/news/crawl` | POST | 触发爬虫 |
| `/api/news/stats` | GET | 获取统计信息 |
| `/api/news/sources` | GET | 获取来源列表 |

### 收藏接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/favorites` | GET | 获取收藏列表 |
| `/api/favorites` | POST | 添加收藏 |
| `/api/favorites/:id` | DELETE | 删除收藏 |

### 示例响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "date": "2026-05-12",
    "count": 81,
    "news": [
      {
        "id": 1,
        "title": "AI 大模型最新进展",
        "source": "hackernews",
        "sourceName": "Hacker News",
        "sourceUrl": "https://news.ycombinator.com/item?id=123456",
        "summary": "AI 大模型取得重大突破...",
        "publishDate": "2026-05-12",
        "score": 8,
        "communityComments": "社区讨论观点..."
      }
    ]
  }
}
```

## 📊 信息源汇总

| 类别 | 信息源 | 状态 |
|------|--------|------|
| **英文** | Hacker News | ✅ |
| | Reddit | ✅ |
| | GitHub Trending | ✅ |
| | Product Hunt | ✅ |
| | ArXiv | ✅ |
| | Twitter/X | ✅ |
| **中文** | 掘金 | ✅ |
| | IT 之家 | ✅ |
| | Solidot | ✅ |
| | 少数派 | ✅ |
| | 知乎 | ✅ |
| | 虎嗅 | ✅ |
| | 金十数据 | ✅ |
| | 财联社 | ✅ |
| **聚合** | Tech Media | ✅ |
| | Blogs | ✅ |
| | Telegram | ⚠️ 需要配置 |

## 🔧 开发指南

### 新增信息源

1. 在 `backend/src/crawlers/` 创建新爬虫文件
2. 继承 `BaseCrawler` 基类
3. 实现 `crawl()` 方法
4. 在 `crawlers/index.ts` 中注册

### 本地开发

```bash
# 启动数据库和 Redis
docker compose up -d postgres redis

# 启动后端开发服务器
cd backend
npm install
npm run dev
```

## 📝 部署指南

### 腾讯云部署

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh

# 2. 配置 Docker 加速（国内服务器）
cat > /etc/docker/daemon.json << 'EOF'
{ "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"] }
EOF
systemctl restart docker

# 3. 部署项目
mkdir -p /data/apps/ai-news && cd /data/apps/ai-news
git clone https://github.com/your-username/CrawlAINews.git .
cp .env.example .env
# 编辑 .env 配置
docker compose up -d --build
```

### Nginx 反向代理

```bash
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📄 文档

| 文档 | 说明 |
|------|------|
| `docs/tech-architecture.md` | 技术架构文档 |
| `docs/crawler-sources.md` | 信息源抓取原理 |
| `docs/deployment.md` | 腾讯云部署指南 |
| `docs/operations-guide.md` | 日常运维指南 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发规范

- 使用 TypeScript 编写后端代码
- 遵循 ESLint 规范
- 提交信息格式：`feat: 新增功能` / `fix: 修复 bug` / `docs: 更新文档`

## 📄 许可证

MIT License

## 📧 联系方式

如有问题或建议，欢迎提交 Issue 或发送邮件至：112070945@qq.com

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
