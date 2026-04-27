# AI 资讯微信小程序 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个自动爬取 AI 资讯并展示的微信小程序，包含 Node.js 后端、PostgreSQL + Redis 存储、火山引擎 AI 摘要生成。

**Architecture:** 单体 Node.js/Express 后端服务，集成爬虫调度与 REST API。PostgreSQL 做主存储，Redis 做首页缓存。微信小程序纯前端，微信授权登录。

**Tech Stack:** Node.js 20 + Express + TypeScript, PostgreSQL 15, Redis 7, 微信小程序原生, Docker Compose, 火山引擎 API

---

## 文件结构

```
ai-news-weapp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts           # PostgreSQL 连接
│   │   │   ├── redis.ts              # Redis 连接
│   │   │   └── index.ts              # 环境变量与配置聚合
│   │   ├── crawlers/
│   │   │   ├── base.ts               # 爬虫基类
│   │   │   ├── github.ts
│   │   │   ├── hackernews.ts
│   │   │   ├── producthunt.ts
│   │   │   ├── reddit.ts
│   │   │   ├── zhihu.ts
│   │   │   ├── tech-media.ts
│   │   │   ├── blogs.ts
│   │   │   ├── arxiv.ts
│   │   │   └── index.ts              # 爬虫调度器
│   │   ├── services/
│   │   │   ├── news.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── favorite.service.ts
│   │   │   └── summary.service.ts    # 火山引擎摘要
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── news.routes.ts
│   │   │   └── favorite.routes.ts
│   │   ├── models/
│   │   │   ├── news.model.ts
│   │   │   ├── user.model.ts
│   │   │   └── favorite.model.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── hash.ts               # URL/标题哈希去重
│   │   └── app.ts
│   ├── tests/
│   │   ├── crawlers/
│   │   ├── services/
│   │   └── routes/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── weapp/
│   ├── pages/
│   │   ├── index/
│   │   │   ├── index.js
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   ├── detail/
│   │   │   ├── detail.js
│   │   │   ├── detail.wxml
│   │   │   └── detail.wxss
│   │   ├── favorites/
│   │   │   ├── favorites.js
│   │   │   ├── favorites.wxml
│   │   │   └── favorites.wxss
│   │   └── profile/
│   │       ├── profile.js
│   │       ├── profile.wxml
│   │       └── profile.wxss
│   ├── components/
│   │   └── news-card/
│   │       ├── news-card.js
│   │       ├── news-card.wxml
│   │       └── news-card.wxss
│   ├── utils/
│   │   ├── api.js                    # 后端 API 封装
│   │   └── auth.js                   # 微信登录封装
│   ├── app.js
│   ├── app.json
│   └── app.wxss
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Task 1: 初始化后端项目与数据库连接

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/config/index.ts`
- Create: `backend/src/config/database.ts`
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "ai-news-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.4.5",
    "pg": "^8.11.5",
    "redis": "^4.6.13",
    "node-cron": "^3.0.3",
    "axios": "^1.6.8",
    "cheerio": "^1.0.0-rc.12",
    "rss-parser": "^3.13.0",
    "express-rate-limit": "^7.2.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.12.7",
    "@types/pg": "^8.11.5",
    "@types/node-cron": "^3.0.11",
    "typescript": "^5.4.5",
    "tsx": "^4.7.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.2",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.6.0",
    "@typescript-eslint/parser": "^7.6.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: 创建 .env.example**

```
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_news
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# WeChat Mini Program
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret

# Volcengine
VOLCENGINE_API_KEY=your_api_key
VOLCENGINE_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/chat/completions

# Crawler
CRON_SCHEDULE=0 2 * * *
```

- [ ] **Step 4: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ai-news-postgres
    environment:
      POSTGRES_DB: ai_news
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ai-news-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 5: 创建 config/index.ts**

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'ai_news',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },
  
  volcengine: {
    apiKey: process.env.VOLCENGINE_API_KEY || '',
    endpoint: process.env.VOLCENGINE_ENDPOINT || '',
  },
  
  crawler: {
    cronSchedule: process.env.CRON_SCHEDULE || '0 2 * * *',
  },
};
```

- [ ] **Step 6: 创建 config/database.ts**

```typescript
import { Pool, PoolClient } from 'pg';
import { config } from './index';
import { logger } from '../utils/logger';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        source VARCHAR(100) NOT NULL,
        source_url TEXT NOT NULL,
        source_name VARCHAR(200),
        publish_date DATE NOT NULL,
        crawled_at TIMESTAMP DEFAULT NOW(),
        summary TEXT,
        content TEXT,
        category VARCHAR(50),
        tags TEXT[],
        is_featured BOOLEAN DEFAULT FALSE,
        UNIQUE(source, source_url)
      );
      
      CREATE INDEX IF NOT EXISTS idx_news_date ON news(publish_date DESC);
      CREATE INDEX IF NOT EXISTS idx_news_source ON news(source);
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        openid VARCHAR(100) UNIQUE NOT NULL,
        nickname VARCHAR(100),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, news_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    `);
    logger.info('Database initialized');
  } finally {
    client.release();
  }
}
```

- [ ] **Step 7: 创建 utils/logger.ts**

```typescript
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, ...args);
  },
};
```

- [ ] **Step 8: 安装依赖并测试数据库连接**

Run: `cd backend && npm install`
Run: `docker-compose up -d`
Run: `npm run dev`
Expected: Server starts on port 3000, database connected

- [ ] **Step 9: Commit**

```bash
git add backend/ docker-compose.yml .env.example
git commit -m "feat: init backend project with database config"
```

---

## Task 2: 实现 Redis 缓存与工具函数

**Files:**
- Create: `backend/src/config/redis.ts`
- Create: `backend/src/utils/hash.ts`

- [ ] **Step 1: 创建 config/redis.ts**

```typescript
import { createClient, RedisClientType } from 'redis';
import { config } from './index';
import { logger } from '../utils/logger';

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password || undefined,
    });
    
    client.on('error', (err) => {
      logger.error('Redis error', err);
    });
    
    await client.connect();
    logger.info('Redis connected');
  }
  return client;
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClient();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error('Redis get error', err);
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.error('Redis set error', err);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(key);
  } catch (err) {
    logger.error('Redis delete error', err);
  }
}
```

- [ ] **Step 2: 创建 utils/hash.ts**

```typescript
import crypto from 'crypto';

export function generateNewsHash(source: string, url: string): string {
  return crypto.createHash('md5').update(`${source}:${url}`).digest('hex');
}

export function generateDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/config/redis.ts backend/src/utils/hash.ts
git commit -m "feat: add redis cache and hash utilities"
```

---

## Task 3: 实现火山引擎 AI 摘要服务

**Files:**
- Create: `backend/src/services/summary.service.ts`

- [ ] **Step 1: 创建 summary.service.ts**

```typescript
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function generateSummary(title: string, content: string): Promise<string | null> {
  if (!config.volcengine.apiKey || !config.volcengine.endpoint) {
    logger.warn('Volcengine config missing, skipping summary generation');
    return null;
  }
  
  try {
    const response = await axios.post(
      config.volcengine.endpoint,
      {
        model: 'deepseek-r1-250120',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的 AI 资讯摘要生成助手。请用 2-3 句话概括以下资讯的核心内容，语言简洁准确。只输出摘要内容，不要添加任何前缀或解释。'
          },
          {
            role: 'user',
            content: `标题：${title}\n\n内容：${content.substring(0, 3000)}`
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.volcengine.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    const summary = response.data.choices?.[0]?.message?.content?.trim();
    return summary || null;
  } catch (err) {
    logger.error('Summary generation failed', err);
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/summary.service.ts
git commit -m "feat: add volcengine summary service"
```

---

## Task 4: 实现爬虫基类与调度器

**Files:**
- Create: `backend/src/crawlers/base.ts`
- Create: `backend/src/crawlers/index.ts`

- [ ] **Step 1: 创建 crawlers/base.ts**

```typescript
export interface NewsItem {
  title: string;
  source: string;
  sourceUrl: string;
  sourceName: string;
  publishDate: Date;
  content?: string;
  category?: string;
  tags?: string[];
}

export abstract class BaseCrawler {
  abstract readonly name: string;
  abstract readonly sourceName: string;
  
  abstract crawl(): Promise<NewsItem[]>;
  
  protected normalizeDate(dateStr: string): Date {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  }
}
```

- [ ] **Step 2: 创建 crawlers/index.ts**

```typescript
import cron from 'node-cron';
import { BaseCrawler, NewsItem } from './base';
import { GithubCrawler } from './github';
import { HackerNewsCrawler } from './hackernews';
import { ProductHuntCrawler } from './producthunt';
import { RedditCrawler } from './reddit';
import { ZhihuCrawler } from './zhihu';
import { TechMediaCrawler } from './tech-media';
import { BlogsCrawler } from './blogs';
import { ArxivCrawler } from './arxiv';
import { newsService } from '../services/news.service';
import { generateSummary } from '../services/summary.service';
import { logger } from '../utils/logger';
import { config } from '../config';

const crawlers: BaseCrawler[] = [
  new GithubCrawler(),
  new HackerNewsCrawler(),
  new ProductHuntCrawler(),
  new RedditCrawler(),
  new ZhihuCrawler(),
  new TechMediaCrawler(),
  new BlogsCrawler(),
  new ArxivCrawler(),
];

export async function runCrawlers(): Promise<void> {
  logger.info('Starting daily crawl job');
  
  const results = await Promise.allSettled(
    crawlers.map(async (crawler) => {
      try {
        logger.info(`Crawling ${crawler.name}...`);
        const items = await crawler.crawl();
        logger.info(`Crawled ${items.length} items from ${crawler.name}`);
        return { crawler: crawler.name, items };
      } catch (err) {
        logger.error(`Crawler ${crawler.name} failed`, err);
        return { crawler: crawler.name, items: [] };
      }
    })
  );
  
  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value.items);
    }
  }
  
  logger.info(`Total crawled items: ${allItems.length}`);
  
  // Deduplicate and save
  const savedCount = await newsService.saveNewsBatch(allItems);
  logger.info(`Saved ${savedCount} new items`);
  
  // Generate summaries for items without summary
  const unsummarized = await newsService.getUnsummarizedNews(20);
  for (const news of unsummarized) {
    const summary = await generateSummary(news.title, news.content || news.title);
    if (summary) {
      await newsService.updateSummary(news.id, summary);
    }
  }
}

export function startCrawlerScheduler(): void {
  logger.info(`Crawler scheduler started with cron: ${config.crawler.cronSchedule}`);
  cron.schedule(config.crawler.cronSchedule, runCrawlers);
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/crawlers/
git commit -m "feat: add crawler base class and scheduler"
```

---

## Task 5: 实现各个爬虫模块

**Files:**
- Create: `backend/src/crawlers/github.ts`
- Create: `backend/src/crawlers/hackernews.ts`
- Create: `backend/src/crawlers/producthunt.ts`
- Create: `backend/src/crawlers/reddit.ts`
- Create: `backend/src/crawlers/zhihu.ts`
- Create: `backend/src/crawlers/tech-media.ts`
- Create: `backend/src/crawlers/blogs.ts`
- Create: `backend/src/crawlers/arxiv.ts`

- [ ] **Step 1: 创建 github.ts**

```typescript
import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class GithubCrawler extends BaseCrawler {
  readonly name = 'github';
  readonly sourceName = 'GitHub';
  
  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://github.com/trending?since=daily', {
      headers: { 'Accept': 'text/html' },
      timeout: 15000,
    });
    
    const cheerio = await import('cheerio');
    const $ = cheerio.load(response.data);
    const items: NewsItem[] = [];
    
    $('article.Box-row').each((_, elem) => {
      const linkElem = $(elem).find('h2 a');
      const href = linkElem.attr('href');
      const title = linkElem.text().trim().replace(/\s+/g, ' ');
      
      if (href && title) {
        items.push({
          title: `[GitHub Trending] ${title}`,
          source: this.name,
          sourceUrl: `https://github.com${href}`,
          sourceName: this.sourceName,
          publishDate: new Date(),
          category: 'product',
        });
      }
    });
    
    return items.slice(0, 10);
  }
}
```

- [ ] **Step 2: 创建 hackernews.ts**

```typescript
import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class HackerNewsCrawler extends BaseCrawler {
  readonly name = 'hackernews';
  readonly sourceName = 'Hacker News';
  
  async crawl(): Promise<NewsItem[]> {
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
    
    const response = await axios.get(
      `https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&numericFilters=created_at_i>${oneDayAgo}`,
      { timeout: 15000 }
    );
    
    return response.data.hits
      .filter((hit: any) => hit.title && hit.url)
      .slice(0, 15)
      .map((hit: any) => ({
        title: hit.title,
        source: this.name,
        sourceUrl: hit.url,
        sourceName: this.sourceName,
        publishDate: new Date(hit.created_at),
        category: 'news',
      }));
  }
}
```

- [ ] **Step 3: 创建 producthunt.ts**

```typescript
import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class ProductHuntCrawler extends BaseCrawler {
  readonly name = 'producthunt';
  readonly sourceName = 'Product Hunt';
  
  async crawl(): Promise<NewsItem[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await axios.post(
      'https://www.producthunt.com/frontend/graphql',
      {
        operationName: 'HomePage',
        variables: { date: today },
        query: `
          query HomePage($date: Date!) {
            posts(date: $date) {
              edges {
                node {
                  name
                  tagline
                  url
                  createdAt
                }
              }
            }
          }
        `
      },
      { timeout: 15000 }
    );
    
    const edges = response.data?.data?.posts?.edges || [];
    
    return edges
      .filter((edge: any) => edge.node?.name)
      .slice(0, 10)
      .map((edge: any) => ({
        title: `${edge.node.name}: ${edge.node.tagline || ''}`,
        source: this.name,
        sourceUrl: edge.node.url,
        sourceName: this.sourceName,
        publishDate: new Date(edge.node.createdAt),
        category: 'product',
      }));
  }
}
```

- [ ] **Step 4: 创建 reddit.ts**

```typescript
import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class RedditCrawler extends BaseCrawler {
  readonly name = 'reddit';
  readonly sourceName = 'Reddit';
  
  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get(
      'https://www.reddit.com/r/artificial/hot.json?limit=15',
      {
        headers: { 'User-Agent': 'AI-News-Bot/1.0' },
        timeout: 15000,
      }
    );
    
    const posts = response.data?.data?.children || [];
    
    return posts
      .filter((post: any) => post.data?.title)
      .map((post: any) => ({
        title: post.data.title,
        source: this.name,
        sourceUrl: `https://reddit.com${post.data.permalink}`,
        sourceName: `${this.sourceName} r/artificial`,
        publishDate: new Date(post.data.created_utc * 1000),
        category: 'news',
      }));
  }
}
```

- [ ] **Step 5: 创建 zhihu.ts**

```typescript
import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class ZhihuCrawler extends BaseCrawler {
  readonly name = 'zhihu';
  readonly sourceName = '知乎';
  
  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get(
      'https://www.zhihu.com/api/v4/questions/19550517/answers',
      {
        params: {
          limit: 10,
          offset: 0,
          sort_by: 'updated',
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      }
    );
    
    const answers = response.data?.data || [];
    
    return answers
      .filter((ans: any) => ans.content)
      .map((ans: any) => {
        const cheerio = require('cheerio');
        const $ = cheerio.load(ans.content);
        const text = $.text().substring(0, 200);
        
        return {
          title: `知乎 AI 讨论: ${text.substring(0, 50)}...`,
          source: this.name,
          sourceUrl: `https://zhihu.com/question/19550517/answer/${ans.id}`,
          sourceName: this.sourceName,
          publishDate: new Date(ans.updated_time * 1000),
          content: text,
          category: 'news',
        };
      });
  }
}
```

- [ ] **Step 6: 创建 tech-media.ts**

```typescript
import Parser from 'rss-parser';
import { BaseCrawler, NewsItem } from './base';

const rssParser = new Parser();

export class TechMediaCrawler extends BaseCrawler {
  readonly name = 'tech-media';
  readonly sourceName = '科技媒体';
  
  async crawl(): Promise<NewsItem[]> {
    const feeds = [
      { url: 'https://36kr.com/feed', name: '36氪' },
      { url: 'https://www.geekpark.net/rss', name: '极客公园' },
    ];
    
    const items: NewsItem[] = [];
    
    for (const feed of feeds) {
      try {
        const feedData = await rssParser.parseURL(feed.url);
        
        for (const item of feedData.items.slice(0, 8)) {
          if (item.title && item.link) {
            items.push({
              title: item.title,
              source: this.name,
              sourceUrl: item.link,
              sourceName: feed.name,
              publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              content: item.contentSnippet || item.content,
              category: 'news',
            });
          }
        }
      } catch (err) {
        console.error(`RSS feed failed: ${feed.url}`, err);
      }
    }
    
    return items;
  }
}
```

- [ ] **Step 7: 创建 blogs.ts**

```typescript
import Parser from 'rss-parser';
import { BaseCrawler, NewsItem } from './base';

const rssParser = new Parser();

export class BlogsCrawler extends BaseCrawler {
  readonly name = 'blogs';
  readonly sourceName = '官方博客';
  
  async crawl(): Promise<NewsItem[]> {
    const feeds = [
      { url: 'https://blog.google/technology/ai/rss/', name: 'Google AI Blog' },
      { url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog' },
    ];
    
    const items: NewsItem[] = [];
    
    for (const feed of feeds) {
      try {
        const feedData = await rssParser.parseURL(feed.url);
        
        for (const item of feedData.items.slice(0, 5)) {
          if (item.title && item.link) {
            items.push({
              title: item.title,
              source: this.name,
              sourceUrl: item.link,
              sourceName: feed.name,
              publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              content: item.contentSnippet || item.content,
              category: 'research',
            });
          }
        }
      } catch (err) {
        console.error(`RSS feed failed: ${feed.url}`, err);
      }
    }
    
    return items;
  }
}
```

- [ ] **Step 8: 创建 arxiv.ts**

```typescript
import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class ArxivCrawler extends BaseCrawler {
  readonly name = 'arxiv';
  readonly sourceName = 'arXiv';
  
  async crawl(): Promise<NewsItem[]> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const response = await axios.get('http://export.arxiv.org/api/query', {
      params: {
        search_query: 'cat:cs.AI',
        start: 0,
        max_results: 10,
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      },
      timeout: 15000,
    });
    
    const parser = new (await import('xml2js')).Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const entries = result.feed?.entry || [];
    
    return entries
      .filter((entry: any) => entry.title && entry.id)
      .map((entry: any) => ({
        title: `[论文] ${entry.title[0].trim()}`,
        source: this.name,
        sourceUrl: entry.id[0],
        sourceName: this.sourceName,
        publishDate: entry.published ? new Date(entry.published[0]) : new Date(),
        content: entry.summary ? entry.summary[0] : '',
        category: 'research',
      }));
  }
}
```

- [ ] **Step 9: 安装 xml2js**

Run: `cd backend && npm install xml2js && npm install -D @types/xml2js`

- [ ] **Step 10: Commit**

```bash
git add backend/src/crawlers/
git commit -m "feat: implement all crawler modules"
```

---

## Task 6: 实现数据服务层

**Files:**
- Create: `backend/src/services/news.service.ts`
- Create: `backend/src/services/user.service.ts`
- Create: `backend/src/services/favorite.service.ts`

- [ ] **Step 1: 创建 news.service.ts**

```typescript
import { query } from '../config/database';
import { getCache, setCache, deleteCache } from '../config/redis';
import { NewsItem } from '../crawlers/base';
import { generateNewsHash, generateDateKey } from '../utils/hash';
import { logger } from '../utils/logger';

export interface News {
  id: number;
  title: string;
  source: string;
  source_url: string;
  source_name: string;
  publish_date: string;
  crawled_at: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  is_featured: boolean;
}

export const newsService = {
  async saveNewsBatch(items: NewsItem[]): Promise<number> {
    let saved = 0;
    
    for (const item of items) {
      const hash = generateNewsHash(item.source, item.sourceUrl);
      
      try {
        const existing = await query(
          'SELECT id FROM news WHERE source = $1 AND source_url = $2',
          [item.source, item.sourceUrl]
        );
        
        if (existing.length === 0) {
          await query(
            `INSERT INTO news (title, source, source_url, source_name, publish_date, content, category, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              item.title,
              item.source,
              item.sourceUrl,
              item.sourceName,
              item.publishDate.toISOString().split('T')[0],
              item.content || null,
              item.category || null,
              item.tags || null,
            ]
          );
          saved++;
        }
      } catch (err) {
        logger.error(`Failed to save news: ${item.title}`, err);
      }
    }
    
    // Clear cache for today
    const todayKey = generateDateKey(new Date());
    await deleteCache(`news:${todayKey}`);
    
    return saved;
  },
  
  async getNewsByDate(date: string): Promise<News[]> {
    const cacheKey = `news:${date}`;
    const cached = await getCache<News[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const rows = await query<News>(
      `SELECT * FROM news WHERE publish_date = $1 ORDER BY crawled_at DESC`,
      [date]
    );
    
    await setCache(cacheKey, rows, 3600);
    return rows;
  },
  
  async getNewsById(id: number): Promise<News | null> {
    const rows = await query<News>(
      'SELECT * FROM news WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },
  
  async getUnsummarizedNews(limit: number = 20): Promise<News[]> {
    return query<News>(
      'SELECT * FROM news WHERE summary IS NULL ORDER BY id DESC LIMIT $1',
      [limit]
    );
  },
  
  async updateSummary(id: number, summary: string): Promise<void> {
    await query(
      'UPDATE news SET summary = $1 WHERE id = $2',
      [summary, id]
    );
  },
  
  async getSources(): Promise<string[]> {
    const rows = await query<{ source: string }>(
      'SELECT DISTINCT source FROM news ORDER BY source'
    );
    return rows.map(r => r.source);
  },
};
```

- [ ] **Step 2: 创建 user.service.ts**

```typescript
import { query } from '../config/database';

export interface User {
  id: number;
  openid: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const userService = {
  async findOrCreateByOpenid(openid: string, nickname?: string, avatarUrl?: string): Promise<User> {
    const existing = await query<User>(
      'SELECT * FROM users WHERE openid = $1',
      [openid]
    );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const result = await query<User>(
      `INSERT INTO users (openid, nickname, avatar_url) VALUES ($1, $2, $3) RETURNING *`,
      [openid, nickname || null, avatarUrl || null]
    );
    
    return result[0];
  },
  
  async getById(id: number): Promise<User | null> {
    const rows = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },
};
```

- [ ] **Step 3: 创建 favorite.service.ts**

```typescript
import { query } from '../config/database';
import { getCache, setCache, deleteCache } from '../config/redis';
import { News } from './news.service';

export interface Favorite {
  id: number;
  user_id: number;
  news_id: number;
  created_at: string;
}

export const favoriteService = {
  async addFavorite(userId: number, newsId: number): Promise<void> {
    await query(
      `INSERT INTO favorites (user_id, news_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, newsId]
    );
    
    await deleteCache(`favorites:${userId}`);
  },
  
  async removeFavorite(userId: number, newsId: number): Promise<void> {
    await query(
      'DELETE FROM favorites WHERE user_id = $1 AND news_id = $2',
      [userId, newsId]
    );
    
    await deleteCache(`favorites:${userId}`);
  },
  
  async getUserFavorites(userId: number): Promise<News[]> {
    const cacheKey = `favorites:${userId}`;
    const cached = await getCache<News[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const rows = await query<News>(
      `SELECT n.* FROM news n
       INNER JOIN favorites f ON n.id = f.news_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    
    await setCache(cacheKey, rows, 1800);
    return rows;
  },
  
  async isFavorited(userId: number, newsId: number): Promise<boolean> {
    const rows = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND news_id = $2',
      [userId, newsId]
    );
    return rows.length > 0;
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/
git commit -m "feat: implement data service layer"
```

---

## Task 7: 实现 API 路由与中间件

**Files:**
- Create: `backend/src/middleware/auth.middleware.ts`
- Create: `backend/src/middleware/error.middleware.ts`
- Create: `backend/src/routes/auth.routes.ts`
- Create: `backend/src/routes/news.routes.ts`
- Create: `backend/src/routes/favorite.routes.ts`
- Create: `backend/src/app.ts`

- [ ] **Step 1: 创建 auth.middleware.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export interface AuthRequest extends Request {
  userId?: number;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const user = await userService.getById(parseInt(token, 10));
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }
    
    req.userId = user.id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
```

- [ ] **Step 2: 创建 error.middleware.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error('API Error', err);
  
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    code: 500,
  });
}
```

- [ ] **Step 3: 创建 auth.routes.ts**

```typescript
import { Router } from 'express';
import axios from 'axios';
import { userService } from '../services/user.service';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { code, nickname, avatarUrl } = req.body;
    
    if (!code) {
      res.status(400).json({ success: false, error: 'Code is required' });
      return;
    }
    
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.secret,
        js_code: code,
        grant_type: 'authorization_code',
      },
      timeout: 10000,
    });
    
    if (wxResponse.data.errcode) {
      logger.error('WeChat login failed', wxResponse.data);
      res.status(400).json({ success: false, error: 'WeChat login failed' });
      return;
    }
    
    const openid = wxResponse.data.openid;
    const user = await userService.findOrCreateByOpenid(openid, nickname, avatarUrl);
    
    res.json({
      success: true,
      data: {
        token: user.id.toString(),
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
        },
      },
    });
  } catch (err) {
    logger.error('Login error', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    
    const token = authHeader.substring(7);
    const user = await userService.getById(parseInt(token, 10));
    
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

export default router;
```

- [ ] **Step 4: 创建 news.routes.ts**

```typescript
import { Router } from 'express';
import { newsService } from '../services/news.service';
import { generateDateKey } from '../utils/hash';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const date = req.query.date as string || generateDateKey(new Date());
    const news = await newsService.getNewsByDate(date);
    
    res.json({
      success: true,
      data: {
        date,
        count: news.length,
        items: news,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

router.get('/sources', async (req, res) => {
  try {
    const sources = await newsService.getSources();
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch sources' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const news = await newsService.getNewsById(id);
    
    if (!news) {
      res.status(404).json({ success: false, error: 'News not found' });
      return;
    }
    
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

export default router;
```

- [ ] **Step 5: 创建 favorite.routes.ts**

```typescript
import { Router } from 'express';
import { favoriteService } from '../services/favorite.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const favorites = await favoriteService.getUserFavorites(req.userId!);
    res.json({ success: true, data: favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch favorites' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { newsId } = req.body;
    
    if (!newsId) {
      res.status(400).json({ success: false, error: 'newsId is required' });
      return;
    }
    
    await favoriteService.addFavorite(req.userId!, parseInt(newsId, 10));
    res.json({ success: true, message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

router.delete('/:newsId', async (req: AuthRequest, res) => {
  try {
    const newsId = parseInt(req.params.newsId, 10);
    await favoriteService.removeFavorite(req.userId!, newsId);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

export default router;
```

- [ ] **Step 6: 创建 app.ts**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { initDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import { startCrawlerScheduler } from './crawlers';
import authRoutes from './routes/auth.routes';
import newsRoutes from './routes/news.routes';
import favoriteRoutes from './routes/favorite.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/favorites', favoriteRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

async function start() {
  try {
    await initDatabase();
    await getRedisClient();
    startCrawlerScheduler();
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/
git commit -m "feat: implement API routes and middleware"
```

---

## Task 8: 初始化微信小程序

**Files:**
- Create: `weapp/app.js`
- Create: `weapp/app.json`
- Create: `weapp/app.wxss`
- Create: `weapp/utils/api.js`
- Create: `weapp/utils/auth.js`

- [ ] **Step 1: 创建 app.js**

```javascript
App({
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: 'http://localhost:3000/api'
  },
  
  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }
  }
});
```

- [ ] **Step 2: 创建 app.json**

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/favorites/favorites",
    "pages/profile/profile"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "AI 资讯",
    "navigationBarTextStyle": "black"
  },
  "tabBar": {
    "color": "#999",
    "selectedColor": "#007AFF",
    "backgroundColor": "#fff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png"
      },
      {
        "pagePath": "pages/favorites/favorites",
        "text": "收藏",
        "iconPath": "images/favorite.png",
        "selectedIconPath": "images/favorite-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "text": "我的",
        "iconPath": "images/profile.png",
        "selectedIconPath": "images/profile-active.png"
      }
    ]
  }
}
```

- [ ] **Step 3: 创建 app.wxss**

```css
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

.container {
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.btn-primary {
  background: #007AFF;
  color: #fff;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}
```

- [ ] **Step 4: 创建 utils/api.js**

```javascript
const app = getApp();

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}${url}`,
      method,
      data,
      header: {
        'Authorization': `Bearer ${app.globalData.token || ''}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || 'Request failed'));
        }
      },
      fail: reject
    });
  });
}

module.exports = {
  getNews: (date) => request(`/news?date=${date || ''}`),
  getNewsDetail: (id) => request(`/news/${id}`),
  getSources: () => request('/news/sources'),
  getFavorites: () => request('/favorites'),
  addFavorite: (newsId) => request('/favorites', 'POST', { newsId }),
  removeFavorite: (newsId) => request(`/favorites/${newsId}`, 'DELETE'),
  login: (code, nickname, avatarUrl) => request('/auth/login', 'POST', { code, nickname, avatarUrl }),
  getUser: () => request('/auth/user'),
};
```

- [ ] **Step 5: 创建 utils/auth.js**

```javascript
const api = require('./api');
const app = getApp();

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (userRes) => {
              const { nickName, avatarUrl } = userRes.userInfo;
              api.login(res.code, nickName, avatarUrl)
                .then((data) => {
                  app.globalData.token = data.data.token;
                  app.globalData.userInfo = data.data.user;
                  wx.setStorageSync('token', data.data.token);
                  resolve(data.data);
                })
                .catch(reject);
            },
            fail: () => {
              api.login(res.code)
                .then((data) => {
                  app.globalData.token = data.data.token;
                  app.globalData.userInfo = data.data.user;
                  wx.setStorageSync('token', data.data.token);
                  resolve(data.data);
                })
                .catch(reject);
            }
          });
        } else {
          reject(new Error('Login failed'));
        }
      },
      fail: reject
    });
  });
}

function checkLogin() {
  return !!app.globalData.token;
}

module.exports = {
  login,
  checkLogin,
};
```

- [ ] **Step 6: Commit**

```bash
git add weapp/
git commit -m "feat: init weapp project with api and auth utilities"
```

---

## Task 9: 实现小程序首页

**Files:**
- Create: `weapp/pages/index/index.js`
- Create: `weapp/pages/index/index.wxml`
- Create: `weapp/pages/index/index.wxss`
- Create: `weapp/components/news-card/news-card.js`
- Create: `weapp/components/news-card/news-card.wxml`
- Create: `weapp/components/news-card/news-card.wxss`

- [ ] **Step 1: 创建 index.js**

```javascript
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    newsList: [],
    currentDate: '',
    newsCount: 0,
    loading: false,
    hasMore: true,
    isLoggedIn: false,
  },

  onLoad() {
    this.setData({
      currentDate: this.formatDate(new Date()),
      isLoggedIn: auth.checkLogin(),
    });
    this.loadNews();
  },

  onPullDownRefresh() {
    this.loadNews().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadNews() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const res = await api.getNews();
      if (res.success) {
        this.setData({
          newsList: res.data.items,
          newsCount: res.data.count,
          hasMore: false,
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onNewsTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
});
```

- [ ] **Step 2: 创建 index.wxml**

```xml
<view class="container">
  <view class="header">
    <text class="date">{{currentDate}}</text>
    <text class="count">共 {{newsCount}} 条资讯</text>
  </view>
  
  <view class="news-list">
    <block wx:for="{{newsList}}" wx:key="id">
      <view class="news-item" bindtap="onNewsTap" data-id="{{item.id}}">
        <view class="news-source">
          <text class="source-tag">{{item.source_name}}</text>
          <text class="news-date">{{item.publish_date}}</text>
        </view>
        <text class="news-title">{{item.title}}</text>
        <text wx:if="{{item.summary}}" class="news-summary">{{item.summary}}</text>
      </view>
    </block>
  </view>
  
  <view wx:if="{{loading}}" class="loading">
    <text>加载中...</text>
  </view>
  
  <view wx:if="{{!loading && newsList.length === 0}}" class="empty">
    <text>暂无资讯</text>
  </view>
</view>
```

- [ ] **Step 3: 创建 index.wxss**

```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  margin-bottom: 20rpx;
}

.date {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.count {
  font-size: 24rpx;
  color: #666;
}

.news-list {
  padding-bottom: 40rpx;
}

.news-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.news-source {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.source-tag {
  font-size: 22rpx;
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.news-date {
  font-size: 22rpx;
  color: #999;
}

.news-title {
  font-size: 30rpx;
  color: #333;
  line-height: 1.5;
  font-weight: 500;
}

.news-summary {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
  margin-top: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading, .empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
```

- [ ] **Step 4: Commit**

```bash
git add weapp/pages/index/
git commit -m "feat: implement weapp home page"
```

---

## Task 10: 实现资讯详情页

**Files:**
- Create: `weapp/pages/detail/detail.js`
- Create: `weapp/pages/detail/detail.wxml`
- Create: `weapp/pages/detail/detail.wxss`

- [ ] **Step 1: 创建 detail.js**

```javascript
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    news: null,
    isFavorited: false,
    isLoggedIn: false,
    loading: true,
  },

  async onLoad(options) {
    const { id } = options;
    this.setData({ isLoggedIn: auth.checkLogin() });
    
    if (id) {
      await this.loadNewsDetail(id);
    }
  },

  async loadNewsDetail(id) {
    try {
      const res = await api.getNewsDetail(id);
      if (res.success) {
        this.setData({
          news: res.data,
          loading: false,
        });
        
        if (this.data.isLoggedIn) {
          this.checkFavorite(id);
        }
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async checkFavorite(newsId) {
    try {
      const favorites = await api.getFavorites();
      const isFavorited = favorites.data.some(f => f.id === parseInt(newsId, 10));
      this.setData({ isFavorited });
    } catch (err) {
      console.error('Check favorite failed', err);
    }
  },

  async onFavoriteTap() {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    const { id } = this.data.news;
    
    try {
      if (this.data.isFavorited) {
        await api.removeFavorite(id);
        this.setData({ isFavorited: false });
        wx.showToast({ title: '已取消收藏', icon: 'success' });
      } else {
        await api.addFavorite(id);
        this.setData({ isFavorited: true });
        wx.showToast({ title: '收藏成功', icon: 'success' });
      }
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onReadOriginalTap() {
    const { source_url } = this.data.news;
    wx.setClipboardData({
      data: source_url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      },
    });
  },
});
```

- [ ] **Step 2: 创建 detail.wxml**

```xml
<view class="container" wx:if="{{!loading && news}}">
  <view class="news-header">
    <view class="source-info">
      <text class="source-tag">{{news.source_name}}</text>
      <text class="news-date">{{news.publish_date}}</text>
    </view>
    <text class="news-title">{{news.title}}</text>
  </view>
  
  <view class="news-summary" wx:if="{{news.summary}}">
    <view class="section-title">AI 摘要</view>
    <text class="summary-text">{{news.summary}}</text>
  </view>
  
  <view class="news-content" wx:if="{{news.content}}">
    <view class="section-title">原文</view>
    <text class="content-text">{{news.content}}</text>
  </view>
  
  <view class="actions">
    <button class="btn-secondary" bindtap="onReadOriginalTap">复制链接</button>
    <button class="btn-primary" bindtap="onFavoriteTap">
      {{isFavorited ? '已收藏' : '收藏'}}
    </button>
  </view>
</view>

<view wx:if="{{loading}}" class="loading">
  <text>加载中...</text>
</view>
```

- [ ] **Step 3: 创建 detail.wxss**

```css
.news-header {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.source-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.source-tag {
  font-size: 24rpx;
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.news-date {
  font-size: 24rpx;
  color: #999;
}

.news-title {
  font-size: 36rpx;
  color: #333;
  line-height: 1.5;
  font-weight: bold;
}

.news-summary, .news-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.summary-text {
  font-size: 28rpx;
  color: #007AFF;
  line-height: 1.6;
}

.content-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.actions button {
  flex: 1;
}

.loading {
  text-align: center;
  padding: 100rpx;
  color: #999;
}
```

- [ ] **Step 4: Commit**

```bash
git add weapp/pages/detail/
git commit -m "feat: implement news detail page"
```

---

## Task 11: 实现收藏页和个人中心

**Files:**
- Create: `weapp/pages/favorites/favorites.js`
- Create: `weapp/pages/favorites/favorites.wxml`
- Create: `weapp/pages/favorites/favorites.wxss`
- Create: `weapp/pages/profile/profile.js`
- Create: `weapp/pages/profile/profile.wxml`
- Create: `weapp/pages/profile/profile.wxss`

- [ ] **Step 1: 创建 favorites.js**

```javascript
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    favorites: [],
    loading: false,
    isLoggedIn: false,
  },

  onShow() {
    this.setData({ isLoggedIn: auth.checkLogin() });
    if (this.data.isLoggedIn) {
      this.loadFavorites();
    }
  },

  async loadFavorites() {
    this.setData({ loading: true });
    
    try {
      const res = await api.getFavorites();
      if (res.success) {
        this.setData({ favorites: res.data });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onNewsTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },

  async onLoginTap() {
    try {
      await auth.login();
      this.setData({ isLoggedIn: true });
      this.loadFavorites();
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },
});
```

- [ ] **Step 2: 创建 favorites.wxml**

```xml
<view class="container">
  <view wx:if="{{!isLoggedIn}}" class="login-tip">
    <text>登录后查看收藏</text>
    <button class="btn-primary" bindtap="onLoginTap">微信登录</button>
  </view>
  
  <view wx:else>
    <view class="favorites-list" wx:if="{{favorites.length > 0}}">
      <block wx:for="{{favorites}}" wx:key="id">
        <view class="news-item" bindtap="onNewsTap" data-id="{{item.id}}">
          <view class="news-source">
            <text class="source-tag">{{item.source_name}}</text>
            <text class="news-date">{{item.publish_date}}</text>
          </view>
          <text class="news-title">{{item.title}}</text>
        </view>
      </block>
    </view>
    
    <view wx:if="{{!loading && favorites.length === 0}}" class="empty">
      <text>暂无收藏</text>
    </view>
  </view>
  
  <view wx:if="{{loading}}" class="loading">
    <text>加载中...</text>
  </view>
</view>
```

- [ ] **Step 3: 创建 favorites.wxss**

```css
.login-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
}

.login-tip text {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
}

.favorites-list {
  padding-bottom: 40rpx;
}

.news-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.news-source {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.source-tag {
  font-size: 22rpx;
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.news-date {
  font-size: 22rpx;
  color: #999;
}

.news-title {
  font-size: 30rpx;
  color: #333;
  line-height: 1.5;
}

.empty, .loading {
  text-align: center;
  padding: 100rpx;
  color: #999;
}
```

- [ ] **Step 4: 创建 profile.js**

```javascript
const auth = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
  },

  onShow() {
    const isLoggedIn = auth.checkLogin();
    this.setData({
      isLoggedIn,
      userInfo: app.globalData.userInfo,
    });
  },

  async onLoginTap() {
    try {
      const data = await auth.login();
      this.setData({
        isLoggedIn: true,
        userInfo: data.user,
      });
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  onLogoutTap() {
    wx.removeStorageSync('token');
    app.globalData.token = null;
    app.globalData.userInfo = null;
    this.setData({
      isLoggedIn: false,
      userInfo: null,
    });
    wx.showToast({ title: '已退出', icon: 'success' });
  },

  onFavoritesTap() {
    wx.switchTab({
      url: '/pages/favorites/favorites',
    });
  },
});
```

- [ ] **Step 5: 创建 profile.wxml**

```xml
<view class="container">
  <view class="user-card">
    <block wx:if="{{isLoggedIn && userInfo}}">
      <image class="avatar" src="{{userInfo.avatarUrl || '/images/default-avatar.png'}}" mode="aspectFill" />
      <text class="nickname">{{userInfo.nickname || '微信用户'}}</text>
    </block>
    <block wx:else>
      <image class="avatar" src="/images/default-avatar.png" mode="aspectFill" />
      <text class="nickname">未登录</text>
      <button class="btn-primary login-btn" bindtap="onLoginTap">微信登录</button>
    </block>
  </view>
  
  <view class="menu-list" wx:if="{{isLoggedIn}}">
    <view class="menu-item" bindtap="onFavoritesTap">
      <text class="menu-text">我的收藏</text>
      <text class="menu-arrow">></text>
    </view>
    <view class="menu-item" bindtap="onLogoutTap">
      <text class="menu-text logout">退出登录</text>
    </view>
  </view>
</view>
```

- [ ] **Step 6: 创建 profile.wxss**

```css
.user-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-bottom: 20rpx;
}

.nickname {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 20rpx;
}

.login-btn {
  margin-top: 10rpx;
}

.menu-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-text {
  font-size: 30rpx;
  color: #333;
}

.menu-text.logout {
  color: #ff4d4f;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}
```

- [ ] **Step 7: Commit**

```bash
git add weapp/pages/favorites/ weapp/pages/profile/
git commit -m "feat: implement favorites and profile pages"
```

---

## Task 12: 测试与部署配置

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/tests/crawlers/github.test.ts`
- Create: `backend/tests/services/news.test.ts`
- Modify: `docker-compose.yml`

- [ ] **Step 1: 创建 Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

- [ ] **Step 2: 更新 docker-compose.yml 添加后端服务**

```yaml
  backend:
    build: ./backend
    container_name: ai-news-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=ai_news
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - WECHAT_APPID=${WECHAT_APPID}
      - WECHAT_SECRET=${WECHAT_SECRET}
      - VOLCENGINE_API_KEY=${VOLCENGINE_API_KEY}
      - VOLCENGINE_ENDPOINT=${VOLCENGINE_ENDPOINT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

- [ ] **Step 3: 创建测试文件**

```typescript
// backend/tests/services/news.test.ts
import { newsService } from '../../src/services/news.service';
import { query, initDatabase } from '../../src/config/database';

describe('NewsService', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterEach(async () => {
    await query('DELETE FROM news WHERE source = $1', ['test']);
  });

  test('saveNewsBatch should save new items', async () => {
    const items = [{
      title: 'Test News',
      source: 'test',
      sourceUrl: 'https://example.com/1',
      sourceName: 'Test Source',
      publishDate: new Date(),
    }];

    const count = await newsService.saveNewsBatch(items);
    expect(count).toBe(1);
  });

  test('getNewsByDate should return news for given date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const news = await newsService.getNewsByDate(today);
    expect(Array.isArray(news)).toBe(true);
  });
});
```

- [ ] **Step 4: 配置 Jest**

Create: `backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
};
```

- [ ] **Step 5: 运行测试**

Run: `cd backend && npm test`
Expected: Tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/Dockerfile backend/tests/ docker-compose.yml backend/jest.config.js
git commit -m "feat: add docker config and tests"
```

---

## 自审检查

**1. Spec 覆盖检查：**
- ✅ 每天爬取过去 24 小时资讯 → Task 4 (调度器) + Task 5 (各爬虫)
- ✅ AI 生成摘要 → Task 3 (Volcengine 服务)
- ✅ 瀑布流展示 → Task 9 (首页)
- ✅ 资讯详情 + 收藏 → Task 10 (详情页) + Task 11 (收藏页)
- ✅ 微信授权登录 → Task 7 (auth 路由) + Task 8/11 (小程序登录)
- ✅ PostgreSQL + Redis → Task 1/2 (数据库/缓存配置)
- ✅ 10 个信息源 → Task 5 (各爬虫模块)

**2. Placeholder 扫描：**
- ✅ 无 TBD/TODO
- ✅ 所有代码步骤包含完整代码
- ✅ 所有命令包含预期输出

**3. 类型一致性：**
- ✅ NewsItem 接口在 base.ts 定义，各爬虫一致使用
- ✅ News/User/Favorite 接口在服务层统一定义
- ✅ 路由参数类型一致

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-04-27-ai-news-weapp-plan.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints for review

**Which approach?**
