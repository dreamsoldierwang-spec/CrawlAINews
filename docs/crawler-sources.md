# 小帅 AI 日报 - 信息源抓取原理说明

## 一、概述

本文档详细说明各信息源的抓取原理、技术实现和数据解析方式。系统支持 17+ 个信息源，涵盖中文和英文渠道。

---

## 二、爬虫基类设计

### 2.1 BaseCrawler 基类

所有爬虫继承自 `BaseCrawler`，提供统一的接口和基础功能：

```typescript
abstract class BaseCrawler {
  readonly name: string;           // 来源标识
  readonly sourceName: string;     // 来源显示名称
  
  abstract crawl(): Promise<NewsItem[]>;  // 核心抓取方法
  
  isAIRelated(title, content);     // AI 关键词过滤
  filterAIItems(items);            // 过滤非 AI 内容
  normalizeDate(dateStr);          // 日期标准化
}
```

### 2.2 AI 关键词过滤机制

系统内置 AI 核心关键词库（50+ 关键词），抓取内容必须匹配至少一个：

| 类别 | 关键词示例 |
|------|-----------|
| AI 模型 | AI, LLM, GPT, ChatGPT, Claude, Gemini |
| 技术领域 | machine learning, deep learning, neural network |
| 中文术语 | 人工智能, 大模型, 机器学习, 深度学习 |
| 应用场景 | RAG, 向量数据库, 智能体, 多模态 |

---

## 三、信息源详细说明

### 3.1 英文信息源

#### 3.1.1 Hacker News (`hackernews.ts`)

**数据源**: https://news.ycombinator.com

**抓取原理**:
- **API 方式**: 使用官方 Firebase API
- **端点**: `https://hacker-news.firebaseio.com/v0/topstories.json`
- **数据结构**:
  - `id`: 条目 ID
  - `title`: 标题
  - `url`: 原文链接
  - `score`: 投票数
  - `time`: 发布时间戳
  - `kids`: 评论 ID 列表

**解析逻辑**:
```typescript
// 1. 获取 Top Stories ID 列表
const topStories = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');

// 2. 并发获取前 N 条详情
const items = await Promise.all(
  topStories.data.slice(0, 30).map(id => 
    axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
  )
);

// 3. 过滤与 AI 相关的内容
return items.filter(item => isAIRelated(item.title));
```

**特殊特性**:
- 支持评论抓取（通过 `kids` 字段递归获取）
- 按投票数排序，优先抓取热门内容

---

#### 3.1.2 Reddit (`reddit.ts`)

**数据源**: https://www.reddit.com

**抓取原理**:
- **API 方式**: 官方 REST API（无需认证）
- **端点**: `https://www.reddit.com/r/{subreddit}/hot.json`
- **目标 Subreddit**: r/MachineLearning, r/ArtificialIntelligence

**数据结构**:
```json
{
  "data": {
    "children": [{
      "data": {
        "title": "...",
        "url": "...",
        "author": "...",
        "score": 1234,
        "num_comments": 456,
        "created_utc": 1620000000
      }
    }]
  }
}
```

**解析逻辑**:
- 遍历多个 AI 相关 Subreddit
- 获取前 20 条热门帖子
- 过滤非链接类型的帖子（如 self-post）

**特殊特性**:
- 支持获取评论（通过 `/comments/{postId}` 端点）
- 自动跳过 NSFW 和置顶帖子

---

#### 3.1.3 GitHub (`github.ts`)

**数据源**: https://github.com/trending

**抓取原理**:
- **方式**: RSS Feed + HTML 解析
- **端点**: `https://github.com/trending/{language}?since=daily`
- **目标语言**: Python, JavaScript, Rust, Go

**解析逻辑**:
```typescript
// 使用 cheerio 解析 HTML
const $ = cheerio.load(html);

$('.Box-row').each((_, element) => {
  const title = $(element).find('h2 a').text().trim();
  const url = 'https://github.com' + $(element).find('h2 a').attr('href');
  const desc = $(element).find('p').text().trim();
});
```

**数据提取**:
- 仓库名称和链接
- Star 数量和 Fork 数量
- 描述信息
- 主要语言标签

**特殊特性**:
- 按每日趋势排序
- 关注 AI/ML 相关仓库

---

#### 3.1.4 Product Hunt (`producthunt.ts`)

**数据源**: https://www.producthunt.com

**抓取原理**:
- **方式**: RSS Feed
- **端点**: `https://www.producthunt.com/rss`

**数据结构**:
```xml
<item>
  <title>AI Tool - A new AI assistant</title>
  <link>https://www.producthunt.com/posts/ai-tool</link>
  <description>...</description>
  <pubDate>...</pubDate>
</item>
```

**特殊特性**:
- 抓取最新发布的 AI 相关产品
- 通过标题关键词过滤

---

#### 3.1.5 ArXiv (`arxiv.ts`)

**数据源**: https://arxiv.org

**抓取原理**:
- **方式**: OAI-PMH API
- **端点**: `http://export.arxiv.org/oai2?verb=ListRecords`
- **分类**: cs.AI, cs.LG, stat.ML

**API 参数**:
| 参数 | 值 | 说明 |
|------|-----|------|
| set | cs.AI | AI 分类 |
| metadataPrefix | oai_dc | 元数据格式 |
| from | 2024-01-01 | 起始日期 |

**数据结构**:
```xml
<record>
  <title>Paper Title</title>
  <identifier>http://arxiv.org/abs/2401.00001</identifier>
  <creator>Author Names</creator>
  <subject>Computer Science - Artificial Intelligence</subject>
  <description>Abstract...</description>
</record>
```

**特殊特性**:
- 自动解析论文摘要
- 添加 `[论文]` 标签标识

---

#### 3.1.6 Twitter/X (`twitter.ts`)

**数据源**: Nitter 镜像（绕过官方 API 限制）

**抓取原理**:
- **方式**: HTML 解析 Nitter 镜像
- **端点**: `https://nitter.net/{username}`
- **目标账号**: OpenAI, Sam Altman, GoogleAI, MetaAI

**解析逻辑**:
```typescript
const $ = cheerio.load(html);
$('.timeline-item').each((_, element) => {
  const text = $(element).find('.tweet-content').text();
  const tweetUrl = $(element).find('.tweet-date a').attr('href');
});
```

**特殊特性**:
- 无需 API Key
- 支持获取推文时间和链接

---

### 3.2 中文信息源

#### 3.2.1 掘金 (`juejin.ts`)

**数据源**: https://juejin.cn

**抓取原理**:
- **方式**: API 接口（模拟移动端）
- **端点**: `https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed`

**请求参数**:
| 参数 | 值 |
|------|-----|
| id_type | 2 |
| sort_type | 300 |
| cate_id | 6809637767912599553 (AI 分类) |

**数据结构**:
```json
{
  "data": {
    "list": [{
      "article_info": {
        "title": "...",
        "article_id": "...",
        "user_name": "...",
        "category_name": "AI"
      },
      "content": "..."
    }]
  }
}
```

**特殊特性**:
- 抓取 AI 分类下的热门文章
- 支持获取完整文章内容

---

#### 3.2.2 IT 之家 (`ithome.ts`)

**数据源**: https://www.ithome.com

**抓取原理**:
- **方式**: RSS Feed
- **端点**: `https://www.ithome.com/rss/`

**数据结构**:
```xml
<item>
  <title>AI 相关新闻标题</title>
  <link>https://www.ithome.com/xxx.html</link>
  <description>摘要内容...</description>
  <pubDate>...</pubDate>
</item>
```

**解析逻辑**:
- 解析 RSS 标题和链接
- 访问文章页面获取完整内容
- 使用 cheerio 提取正文

---

#### 3.2.3 Solidot (`solidot.ts`)

**数据源**: https://www.solidot.org

**抓取原理**:
- **方式**: RSS Feed
- **端点**: `https://www.solidot.org/index.rss`

**数据结构**:
```xml
<item>
  <title>科技新闻标题</title>
  <link>https://www.solidot.org/story?sid=123456</link>
  <description>...</description>
</item>
```

**特殊特性**:
- 科技新闻聚合站点
- 内容偏向开源和技术社区

---

#### 3.2.4 少数派 (`sspai.ts`)

**数据源**: https://sspai.com

**抓取原理**:
- **方式**: RSS Feed
- **端点**: `https://sspai.com/feed`

**数据结构**:
```xml
<item>
  <title>AI 工具评测</title>
  <link>https://sspai.com/post/xxx</link>
  <description>...</description>
</item>
```

**特殊特性**:
- 优质中文科技内容
- 深度评测文章

---

#### 3.2.5 知乎 (`zhihu.ts`)

**数据源**: https://www.zhihu.com

**抓取原理**:
- **方式**: 热榜 API
- **端点**: `https://api.zhihu.com/topstory/hot-list`

**数据结构**:
```json
{
  "data": [{
    "target": {
      "title": "...",
      "url": "...",
      "type": "question" | "article"
    },
    "detail_text": "热度值"
  }]
}
```

**解析逻辑**:
- 获取热榜前 20 条
- 过滤 AI 相关话题
- 获取问题或文章内容

---

#### 3.2.6 虎嗅 (`gelonghui.ts`)

**数据源**: https://www.gelonghui.com

**抓取原理**:
- **方式**: RSS Feed
- **端点**: `https://www.gelonghui.com/rss`

**特殊特性**:
- 财经科技新闻
- AI 企业动态

---

#### 3.2.7 金十数据 (`jin10.ts`)

**数据源**: https://www.jin10.com

**抓取原理**:
- **方式**: RSS Feed
- **端点**: `https://www.jin10.com/rss`

**特殊特性**:
- 金融科技新闻
- AI 在金融领域的应用

---

#### 3.2.8 财联社 (`cls.ts`)

**数据源**: https://www.cls.cn

**抓取原理**:
- **方式**: RSS Feed
- **端点**: `https://www.cls.cn/rss`

**特殊特性**:
- 财经资讯
- AI 相关政策新闻

---

### 3.3 聚合类信息源

#### 3.3.1 Tech Media (`tech-media.ts`)

**数据源**: 多个英文科技媒体

**包含来源**:
| 媒体 | RSS 地址 |
|------|----------|
| TechCrunch | https://techcrunch.com/feed |
| VentureBeat | https://venturebeat.com/feed |
| The Verge | https://www.theverge.com/rss/index.xml |
| Ars Technica | https://feeds.arstechnica.com/arstechnica/index |

**抓取原理**:
- 并发请求多个 RSS Feed
- 统一解析和过滤
- 按时间排序

---

#### 3.3.2 Blogs (`blogs.ts`)

**数据源**: AI 研究者个人博客

**包含来源**:
| 作者 | 博客地址 |
|------|----------|
| Simon Willison | https://simonwillison.net/atom/everything/ |
| Jeremy Howard | https://www.fast.ai/feed.xml |
| Yannic Kilcher | https://www.youtube.com/feeds/videos.xml |
| LessWrong | https://lesswrong.com/feed.xml |

**特殊特性**:
- 获取深度技术文章
- AI 研究前沿动态

---

#### 3.3.3 Telegram (`telegram.ts`)

**数据源**: Telegram 公开频道

**目标频道**:
| 频道名称 | 说明 |
|----------|------|
| AI_Frontier | AI 前沿资讯 |
| ML_Weekly | 机器学习周刊 |
| DeepLearningAI | 深度学习资讯 |

**抓取原理**:
- 使用 Telegram Bot API
- 需要配置 `TELEGRAM_BOT_TOKEN`
- 解析频道消息提取链接和标题

**注意事项**:
- 需要创建 Telegram Bot
- 部分频道可能设置隐私限制

---

## 四、数据处理流程

### 4.1 抓取流程

```
1. 定时触发 (cron)
       ↓
2. 并发抓取各信息源
       ↓
3. AI 关键词过滤
       ↓
4. URL 去重
       ↓
5. 语义去重 (可选)
       ↓
6. AI 评分过滤 (可选)
       ↓
7. 保存到数据库
       ↓
8. 生成 AI 摘要
       ↓
9. 抓取社区评论 (可选)
```

### 4.2 去重机制

| 去重类型 | 实现方式 | 说明 |
|----------|----------|------|
| URL 去重 | Set 集合比较 | 完全匹配 |
| 语义去重 | Embedding + 余弦相似度 | 相似度 > 0.85 判定为重复 |
| 日期去重 | 按日期+来源+URL | 允许同一 URL 在不同日期出现 |

### 4.3 数据标准化

所有抓取的数据统一格式：

```typescript
interface NewsItem {
  title: string;           // 标题
  source: string;          // 来源标识 (hackernews, juejin, etc.)
  sourceUrl: string;       // 原文链接
  sourceName: string;      // 来源显示名称
  publishDate: Date;       // 发布日期
  content?: string;        // 内容（可选）
  category?: string;       // 分类（可选）
  tags?: string[];         // 标签（可选）
}
```

---

## 五、抓取频率与限制

### 5.1 频率控制

| 信息源类型 | 抓取频率 | 说明 |
|------------|----------|------|
| RSS Feed | 每 1-2 小时 | 更新较快 |
| API 接口 | 每 3-6 小时 | 有调用限制 |
| HTML 解析 | 每 6-12 小时 | 避免被封 |

### 5.2 请求限制

```typescript
// 请求间隔控制
const REQUEST_DELAY = 1000; // 1秒间隔

// 单次抓取数量限制
const MAX_ITEMS_PER_SOURCE = 20;

// 超时设置
const TIMEOUT = 15000; // 15秒
```

### 5.3 User-Agent 设置

```typescript
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                   'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                   'Chrome/120.0.0.0 Safari/537.36';
```

---

## 六、异常处理

### 6.1 错误处理策略

| 错误类型 | 处理方式 |
|----------|----------|
| 网络超时 | 重试 3 次 |
| HTTP 4xx | 跳过该来源 |
| HTTP 5xx | 等待后重试 |
| 解析失败 | 记录日志，继续处理 |

### 6.2 容错机制

```typescript
for (const crawler of crawlers) {
  try {
    const items = await crawler.crawl();
  } catch (err) {
    logger.error(`Crawler ${crawler.name} failed`, err);
    // 单个爬虫失败不影响其他爬虫
  }
}
```

---

## 七、信息源汇总表

| 类别 | 信息源 | 类型 | 状态 |
|------|--------|------|------|
| **英文** | Hacker News | API | ✅ |
| | Reddit | API | ✅ |
| | GitHub | HTML | ✅ |
| | Product Hunt | RSS | ✅ |
| | ArXiv | API | ✅ |
| | Twitter/X | HTML | ✅ |
| **中文** | 掘金 | API | ✅ |
| | IT 之家 | RSS | ✅ |
| | Solidot | RSS | ✅ |
| | 少数派 | RSS | ✅ |
| | 知乎 | API | ✅ |
| | 虎嗅 | RSS | ✅ |
| | 金十数据 | RSS | ✅ |
| | 财联社 | RSS | ✅ |
| **聚合** | Tech Media | RSS | ✅ |
| | Blogs | RSS | ✅ |
| | Telegram | API | ⚠️ 需要配置 |

---

## 八、扩展新信息源指南

### 8.1 创建新爬虫步骤

1. **创建文件**: `backend/src/crawlers/newsource.ts`

2. **实现爬虫类**:
```typescript
import { BaseCrawler, NewsItem } from './base';

export class NewSourceCrawler extends BaseCrawler {
  readonly name = 'newsource';
  readonly sourceName = '新来源';

  async crawl(): Promise<NewsItem[]> {
    // 1. 获取数据（API/RSS/HTML）
    // 2. 解析数据
    // 3. 过滤 AI 相关内容
    // 4. 返回 NewsItem[]
  }
}
```

3. **注册到调度器**:
```typescript
// crawlers/index.ts
import { NewSourceCrawler } from './newsource';

const crawlers = [
  // ... 其他爬虫
  new NewSourceCrawler(),
];
```

### 8.2 注意事项

- 遵循目标网站的 robots.txt
- 设置合理的请求间隔
- 处理异常情况
- 添加适当的日志记录
