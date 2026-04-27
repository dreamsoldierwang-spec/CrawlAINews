# AI 资讯微信小程序 - 设计文档

## 1. 项目概述

### 1.1 目标
开发一个微信小程序，自动爬取并展示最新的 AI 资讯，帮助用户快速了解 AI 领域动态。

### 1.2 核心功能
- 每天自动爬取过去 24 小时的 AI 资讯
- AI 生成中文摘要（火山引擎）
- 瀑布流展示资讯列表
- 资讯详情查看与原文跳转
- 用户收藏功能
- 微信授权登录

### 1.3 技术栈
- **后端**：Node.js + Express + TypeScript
- **数据库**：PostgreSQL（主存储）+ Redis（缓存）
- **AI 摘要**：火山引擎（Volcengine）API
- **前端**：微信小程序原生开发
- **部署**：Docker Compose

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   微信小程序     │◄────►│   Node.js 后端    │◄────►│   PostgreSQL   │
│   (展现层)       │      │   (爬取+API服务)  │      │   (主存储)       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │   Redis (缓存)    │
                         └──────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Volcengine API  │
                         │  (AI 摘要生成)    │
                         └──────────────────┘
```

### 2.2 后端职责
- 爬虫调度（node-cron 每天执行）
- 资讯 API（首页列表、详情、收藏）
- 用户认证（微信授权登录）
- AI 摘要调用（火山引擎）

---

## 3. 信息源与爬取策略

### 3.1 信息源列表

| 信息源 | 内容类型 | 爬取方式 | 频率 |
|--------|---------|---------|------|
| GitHub Trending | 热门 AI 仓库 | HTTP + cheerio | 每天 |
| Hacker News | 技术社区讨论 | 官方 API (Algolia) | 每天 |
| Product Hunt | AI 新产品 | 官方 API | 每天 |
| Reddit (r/artificial) | 海外 AI 社区 | 官方 API | 每天 |
| 知乎 AI 话题 | 国内深度讨论 | HTTP + cheerio | 每天 |
| 36氪 AI 频道 | 科技媒体报道 | RSS / HTTP | 每天 |
| 极客公园 | 科技媒体报道 | RSS / HTTP | 每天 |
| Google AI Blog | 官方技术博客 | RSS | 每天 |
| OpenAI Blog | 官方技术博客 | RSS | 每天 |
| arXiv (cs.AI) | 学术论文 | 官方 API | 每天 |

### 3.2 排除的信息源
- X.com（Twitter）— 反爬机制强
- 微博 — 反爬机制强

### 3.3 爬取流程
1. 每天凌晨执行定时任务（node-cron）
2. 各源并行爬取（Promise.allSettled，单个源失败不影响整体）
3. 数据清洗与标准化
4. 去重（基于 URL + 标题哈希）
5. 调用火山引擎 API 生成中文摘要
6. 写入 PostgreSQL
7. 更新 Redis 缓存

---

## 4. 数据库设计

### 4.1 表结构

```sql
-- 资讯表
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    source VARCHAR(100) NOT NULL,        -- 来源：github, hackernews, zhihu...
    source_url TEXT NOT NULL,             -- 原文链接
    source_name VARCHAR(200),             -- 来源站点名称
    publish_date DATE NOT NULL,           -- 发布日期
    crawled_at TIMESTAMP DEFAULT NOW(),   -- 爬取时间
    summary TEXT,                         -- AI 生成的摘要
    content TEXT,                         -- 原文内容（可选）
    category VARCHAR(50),                 -- 分类：product, research, news...
    tags TEXT[],                          -- 标签数组
    is_featured BOOLEAN DEFAULT FALSE,    -- 是否精选
    UNIQUE(source, source_url)            -- 去重约束
);

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(100) UNIQUE NOT NULL,  -- 微信 openid
    nickname VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 收藏表
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, news_id)              -- 防止重复收藏
);
```

### 4.2 索引
- `news(publish_date DESC)` — 按日期查询
- `news(source)` — 按来源筛选
- `favorites(user_id)` — 查询用户收藏

---

## 5. API 设计

### 5.1 认证相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 微信 code 换取 openid，创建/登录用户 |
| `/api/auth/user` | GET | 获取当前用户信息 |

### 5.2 资讯相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/news` | GET | 首页列表（支持 date 参数，默认今天） |
| `/api/news/:id` | GET | 资讯详情 |
| `/api/news/sources` | GET | 获取所有可用来源列表 |

### 5.3 收藏相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/favorites` | GET | 我的收藏列表 |
| `/api/favorites` | POST | 添加收藏 |
| `/api/favorites/:id` | DELETE | 取消收藏 |

### 5.4 缓存策略
- 首页列表：`redis key = news:2026-04-27`，TTL = 1 小时
- 详情页：不缓存（数据量小，实时性要求高）
- 收藏列表：用户维度缓存，收藏变更时失效

---

## 6. 微信小程序设计

### 6.1 页面结构

1. **首页** (`pages/index/index`)
   - 顶部：当前日期 + 当天资讯数量统计
   - 列表：瀑布流形式展示资讯卡片
   - 卡片内容：资讯标题 + 来源图标/名称 + 发布时间
   - 点击卡片 → 跳转详情页

2. **资讯详情页** (`pages/detail/detail`)
   - 标题区：资讯标题 + 来源标签
   - 摘要区：AI 生成的摘要（高亮展示）
   - 原文区：资讯原文（如有）或摘要补充
   - 操作区：两个按钮
     - 「阅读原文」→ 复制链接或跳转 web-view
     - 「收藏」→ 切换收藏状态

3. **我的收藏页** (`pages/favorites/favorites`)
   - 列表展示收藏的资讯
   - 支持取消收藏

4. **个人中心页** (`pages/profile/profile`)
   - 微信头像昵称
   - 收藏入口
   - 关于/设置

### 6.2 TabBar 设计
- 首页（资讯列表）
- 收藏
- 我的

---

## 7. 项目目录结构

```
ai-news-weapp/
├── backend/                          # Node.js 后端
│   ├── src/
│   │   ├── config/                   # 配置（数据库、Redis、API密钥）
│   │   ├── crawlers/                 # 爬虫模块
│   │   │   ├── github.ts
│   │   │   ├── hackernews.ts
│   │   │   ├── producthunt.ts
│   │   │   ├── reddit.ts
│   │   │   ├── zhihu.ts
│   │   │   ├── tech-media.ts         # 36氪、极客公园
│   │   │   ├── blogs.ts              # Google AI, OpenAI Blog
│   │   │   └── arxiv.ts
│   │   ├── services/                 # 业务服务
│   │   │   ├── news.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── favorite.service.ts
│   │   │   └── summary.service.ts    # 火山引擎摘要
│   │   ├── routes/                   # API 路由
│   │   ├── models/                   # 数据库模型
│   │   ├── middleware/               # 中间件（认证、错误处理）
│   │   ├── utils/                    # 工具函数
│   │   └── app.ts                    # 应用入口
│   ├── package.json
│   └── tsconfig.json
├── weapp/                            # 微信小程序
│   ├── pages/
│   │   ├── index/                    # 首页
│   │   ├── detail/                   # 详情页
│   │   ├── favorites/                # 收藏页
│   │   └── profile/                  # 个人中心
│   ├── components/                   # 公共组件
│   ├── utils/                        # 工具函数
│   ├── app.js
│   └── app.json
├── docker-compose.yml                # PostgreSQL + Redis
└── docs/                             # 文档
```

---

## 8. 关键流程

### 8.1 每日爬取流程
```
定时触发 → 并行爬取各源 → 数据清洗 → 去重 → AI摘要生成 → 入库 → 更新缓存
```

### 8.2 用户访问首页流程
```
打开小程序 → 微信登录 → 请求 /api/news → Redis缓存? → 是:返回缓存 / 否:查库并缓存 → 渲染列表
```

### 8.3 收藏流程
```
点击收藏 → 请求 /api/favorites (POST) → 数据库写入 → 清除用户收藏缓存 → 更新UI状态
```

---

## 9. 错误处理

### 9.1 爬虫错误
- 单个源爬取失败记录日志，不影响其他源
- 连续失败 3 次发送告警（可选）

### 9.2 API 错误
- 统一错误响应格式：`{ success: false, error: string, code: number }`
- 认证失败返回 401
- 资源不存在返回 404

### 9.3 AI 摘要错误
- 摘要生成失败时，存储空摘要，前端展示原标题+原文片段
- 记录失败日志，支持重试机制

---

## 10. 安全考虑

- API 限流（express-rate-limit）
- 微信登录校验（code 只能使用一次）
- 数据库连接池管理
- 敏感配置使用环境变量
- HTTPS 强制

---

## 11. 后续扩展（V2 考虑）

- 资讯分类筛选（产品、研究、新闻）
- 搜索功能
- 推送通知（每日精选）
- 用户行为分析
- 多语言支持
- 资讯分享（生成海报）
