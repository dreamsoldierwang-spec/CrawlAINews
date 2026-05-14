# 小帅 AI 日报 - 技术架构文档

## 一、项目概述

「小帅 AI 日报」是一个 AI 新闻聚合平台，通过爬虫从多个信息源抓取 AI 相关资讯，利用大模型生成摘要和评分，最终通过微信小程序向用户展示。

### 1.1 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 前端 | 微信小程序 | - |
| 后端 | Node.js + Express | 20.x |
| 数据库 | PostgreSQL | 15 |
| 缓存 | Redis | 7 |
| 大模型 | 火山引擎 Coding Plan | kimi-k2.6 |
| 定时任务 | node-cron | ^3.0 |

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    微信小程序 (WeChat Mini Program)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │    首页      │  │   详情页    │  │   收藏页    │           │
│  │ (index)     │  │  (detail)   │  │ (favorites) │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                     │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    后端 API (Express)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ News Routes │  │ Auth Routes │  │ Fav Routes  │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                     │
│  ┌──────▼──────┐                                               │
│  │   Services │                                               │
│  │ News/Fav/  │                                               │
│  │ Summary/   │                                               │
│  │ Score/     │                                               │
│  │ Dedup/     │                                               │
│  │ Comments   │                                               │
│  └──────┬──────┘                                               │
└─────────┼──────────────────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐ ┌─────────┐
│PostgreSQL│ │  Redis  │
│ (主存储) │ │ (缓存)  │
└─────────┘ └─────────┘
```

---

## 二、后端架构

### 2.1 目录结构

```
backend/src/
├── config/          # 配置文件
│   ├── database.ts  # 数据库连接
│   ├── index.ts     # 配置参数
│   └── redis.ts     # Redis 连接
├── crawlers/        # 爬虫模块
│   ├── base.ts      # 爬虫基类
│   ├── index.ts     # 爬虫调度器
│   └── *.ts         # 各信息源爬虫
├── middleware/      # 中间件
│   ├── auth.ts      # 认证中间件
│   └── error.ts     # 错误处理
├── routes/          # 路由
│   ├── news.ts      # 新闻相关 API
│   ├── auth.ts      # 认证 API
│   └── favorite.ts  # 收藏 API
├── services/        # 业务逻辑
│   ├── news.ts      # 新闻服务
│   ├── summary.ts   # 摘要生成
│   ├── score.ts     # AI 评分
│   ├── dedup.ts     # 去重服务
│   └── comments.ts  # 评论抓取
├── utils/           # 工具函数
│   ├── logger.ts    # 日志
│   └── hash.ts      # 哈希工具
└── app.ts           # 应用入口
```

### 2.2 核心服务说明

#### 2.2.1 NewsService (新闻服务)
- **职责**: 新闻数据的增删改查
- **核心方法**:
  - `saveNewsBatch(items)`: 批量保存新闻
  - `getNewsByDate(date)`: 按日期查询新闻
  - `getNewsById(id)`: 按 ID 查询新闻
  - `getStats()`: 获取统计信息

#### 2.2.2 SummaryService (摘要服务)
- **职责**: 调用大模型生成新闻摘要
- **调用方式**: HTTP 请求火山引擎 API
- **模型**: kimi-k2.6

#### 2.2.3 ScoreService (评分服务)
- **职责**: AI 智能评分（0-10 分）
- **评分标准**:
  - 9-10: 重大突破
  - 7-8: 重要进展
  - 5-6: 值得关注
  - 3-4: 次要内容
  - 0-2: 噪音

#### 2.2.4 DedupService (去重服务)
- **职责**: 去除重复内容
- **去重策略**:
  - URL 去重: 基于 URL 完全匹配
  - 语义去重: 基于 Embedding + 余弦相似度

#### 2.2.5 CommentsService (评论服务)
- **职责**: 抓取 HN/Reddit 社区评论
- **功能**:
  - 抓取评论列表
  - AI 总结评论观点

### 2.3 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/news` | GET | 获取新闻列表 |
| `/api/news/:id` | GET | 获取单条新闻 |
| `/api/news/crawl` | POST | 触发爬虫 |
| `/api/news/stats` | GET | 获取统计 |
| `/api/news/sources` | GET | 获取来源列表 |
| `/api/favorites` | GET | 获取收藏列表 |
| `/api/favorites` | POST | 添加收藏 |
| `/api/favorites/:id` | DELETE | 删除收藏 |

---

## 三、数据库设计

### 3.1 news 表（新闻表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 自增主键 |
| title | VARCHAR(500) | NOT NULL | 标题 |
| source | VARCHAR(100) | NOT NULL | 来源标识 |
| source_url | TEXT | NOT NULL | 原文链接 |
| source_name | VARCHAR(200) | - | 来源名称 |
| publish_date | DATE | NOT NULL | 发布日期 |
| crawled_at | TIMESTAMP | DEFAULT NOW() | 抓取时间 |
| summary | TEXT | - | AI 摘要 |
| content | TEXT | - | 原文内容 |
| category | VARCHAR(50) | - | 分类 |
| tags | TEXT[] | - | 标签 |
| community_comments | TEXT | - | 社区评论总结 |
| score | INTEGER | DEFAULT 5 | AI 评分 |
| score_reason | TEXT | - | 评分理由 |
| is_featured | BOOLEAN | DEFAULT FALSE | 是否精选 |

### 3.2 users 表（用户表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 自增主键 |
| openid | VARCHAR(100) | UNIQUE NOT NULL | 微信 OpenID |
| nickname | VARCHAR(100) | - | 昵称 |
| avatar_url | TEXT | - | 头像 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### 3.3 favorites 表（收藏表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 自增主键 |
| user_id | INTEGER | FOREIGN KEY | 用户 ID |
| news_id | INTEGER | FOREIGN KEY | 新闻 ID |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### 3.4 索引设计

| 表名 | 索引 | 说明 |
|------|------|------|
| news | idx_news_date | 按日期查询 |
| news | idx_news_source | 按来源查询 |
| favorites | idx_favorites_user | 按用户查询 |

---

## 四、前端架构（微信小程序）

### 4.1 目录结构

```
weapp/
├── pages/           # 页面
│   ├── index/       # 首页（新闻列表）
│   ├── detail/      # 详情页
│   ├── favorites/   # 收藏页
│   └── profile/     # 个人中心
├── utils/           # 工具
│   ├── api.js       # API 请求封装
│   ├── auth.js      # 认证工具
│   └── theme.js     # 主题管理
├── images/          # 图片资源
│   ├── icons/       # 图标
│   └── tabbar/      # 底部导航图标
├── app.js           # 应用入口
├── app.json         # 配置文件
└── app.wxss         # 全局样式
```

### 4.2 页面功能

#### 4.2.1 首页 (`pages/index`)
- 展示新闻列表（瀑布流）
- 日期选择器切换日期
- 主题切换按钮（白天/夜晚/护眼）
- 显示当天资讯数量

#### 4.2.2 详情页 (`pages/detail`)
- 展示新闻详情
- AI 摘要展示
- 社区评论展示
- 操作按钮：分享、复制链接、收藏

#### 4.2.3 收藏页 (`pages/favorites`)
- 展示用户收藏列表
- 支持取消收藏

#### 4.2.4 个人中心 (`pages/profile`)
- 用户信息展示
- 主题设置
- 关于页面

### 4.3 主题系统

| 主题 | 背景色 | 文字色 | 说明 |
|------|--------|--------|------|
| 白天 | #f8fafc | #1e293b | 默认模式 |
| 夜晚 | #0f172a | #e2e8f0 | 深色模式 |
| 护眼 | #f5f0e6 | #4c3a28 | 暖色调 |

### 4.4 数据流程

```
首页加载 → 请求 /api/news → 渲染列表 → 点击条目 → 请求 /api/news/:id → 详情页
```

---

## 五、爬虫系统

### 5.1 爬虫架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Crawler Scheduler                        │
│                     (node-cron)                            │
│                        │                                    │
│                        ▼                                    │
│         ┌─────────────────────────────────┐                │
│         │         Crawler Pool             │                │
│         │  ┌─────┬─────┬─────┬─────┬─────┐│                │
│         │  │ HN  │Reddit│GitHub│RSS │... ││                │
│         │  └──┬──┴──┬──┴──┬──┴──┬──┴──┬──┘│                │
│         └─────┼─────┼─────┼─────┼─────┼────┘                │
│               │     │     │     │     │                     │
│               ▼     ▼     ▼     ▼     ▼                     │
│         ┌─────────────────────────────────┐                │
│         │         Data Processing          │                │
│         │  1. AI 关键词过滤               │                │
│         │  2. URL 去重                    │                │
│         │  3. 语义去重（可选）            │                │
│         │  4. AI 评分过滤（可选）         │                │
│         └───────────────────┬─────────────┘                │
│                             │                              │
│                             ▼                              │
│                    ┌─────────────┐                         │
│                    │ PostgreSQL  │                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 定时任务配置

```yaml
# 默认配置（每天凌晨 2 点）
CRON_SCHEDULE=0 2 * * *

# 环境变量控制
ENABLE_SCORING=false    # 是否启用 AI 评分
SCORE_THRESHOLD=6.0     # 评分阈值
ENABLE_SEMANTIC_DEDUP=false  # 是否启用语义去重
```

---

## 六、部署与运维

### 6.1 Docker 部署

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker logs ai-news-backend

# 停止服务
docker compose down
```

### 6.2 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 后端端口 | 3000 |
| DB_HOST | 数据库地址 | postgres |
| DB_PORT | 数据库端口 | 5432 |
| DB_NAME | 数据库名 | ai_news |
| REDIS_HOST | Redis 地址 | redis |
| VOLCENGINE_API_KEY | 火山引擎 API Key | - |
| TZ | 时区 | Asia/Shanghai |

### 6.3 监控与日志

- **日志存储**: 后端使用 Winston 日志库
- **日志级别**: INFO / WARN / ERROR
- **日志输出**: 控制台 + 文件（可选）

---

## 七、安全考虑

### 7.1 认证机制
- 微信小程序使用 OpenID 进行用户认证
- API 接口携带 OpenID 进行权限校验

### 7.2 数据安全
- 数据库密码通过环境变量配置
- API Key 不硬编码在代码中
- 敏感数据不记录到日志

### 7.3 爬虫合规
- 设置合理的请求间隔
- 遵循目标网站的 robots.txt
- 设置 User-Agent 标识

---

## 八、性能优化

### 8.1 缓存策略

#### 缓存工作原理

Redis 作为缓存层，采用**读写分离**策略：

**读取流程：**
```typescript
async getNewsByDate(date: string): Promise<News[]> {
  const cacheKey = `news:${date}`;
  
  // 第一步：先查缓存
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);  // 直接返回缓存（毫秒级响应）
  }
  
  // 第二步：缓存未命中，查数据库
  const result = await query("SELECT * FROM news WHERE publish_date = $1", [date]);
  
  // 第三步：更新缓存（下次请求更快）
  await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);  // 1小时过期
  
  return result;
}
```

**清除时机：**
```typescript
// 爬虫更新数据后清除相关缓存
const todayKey = generateDateKey(new Date());
await redis.del(`news:${todayKey}`);
```

#### 缓存数据类型

| 数据类型 | 缓存键 | 过期时间 | 说明 |
|----------|--------|----------|------|
| **新闻列表** | `news:YYYY-MM-DD` | 1小时 | 按日期缓存首页新闻列表 |
| **统计数据** | `news:stats` | 1小时 | 数据统计信息 |
| **来源列表** | `news:sources` | 1小时 | 信息源列表 |

#### 缓存流程图

```
用户请求首页 → 检查 Redis 缓存
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      缓存命中            缓存未命中
          │                   │
          ▼                   ▼
    直接返回数据      查询 PostgreSQL
                          │
                          ▼
                    更新 Redis 缓存
                          │
                          ▼
                    返回数据给用户

爬虫更新数据 → 保存到 PostgreSQL → 清除相关缓存
                                      │
                                      ▼
                                下次请求重新缓存
```

#### 缓存优势

| 特性 | 说明 |
|------|------|
| **性能提升** | 响应时间从 ~100ms 降到 ~1ms |
| **减轻数据库压力** | 热点数据直接从缓存读取 |
| **数据新鲜度** | 爬虫更新时主动清除缓存 |
| **自动过期** | 1小时自动过期，保证数据不陈旧 |

#### 数据一致性

> ⚠️ **注意**：PostgreSQL 和 Redis 之间不会自动联动清除。清空数据库后，必须手动执行 `redis-cli FLUSHALL` 清空缓存，否则用户会看到已删除的数据！

### 8.2 异步处理
- 爬虫任务异步执行
- 摘要生成批量处理

### 8.3 数据库优化
- 索引优化查询
- 批量写入减少连接开销

---

## 九、扩展能力

### 9.1 新增信息源
1. 创建新爬虫类继承 BaseCrawler
2. 在 crawlers/index.ts 中注册
3. 实现 crawl() 方法

### 9.2 新增 AI 模型
- 扩展 summary.service.ts 支持多模型
- 配置文件中添加模型选择

### 9.3 新增输出渠道
- 支持邮件订阅
- 支持 Webhook 推送
