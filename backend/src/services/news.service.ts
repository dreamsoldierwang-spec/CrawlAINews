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
  community_comments: string | null;
  score: number;
  score_reason: string | null;
}

export const newsService = {
  async saveNewsBatch(items: NewsItem[]): Promise<number> {
    let saved = 0;
    // 使用本地时区（CST）的日期作为"今天"，避免 UTC 和本地时区不一致的问题
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (const item of items) {
      try {
        // 按日期+来源+URL去重，允许不同日期有相同资讯
        // 使用 CST 时区判断 crawled_at 的日期，与查询侧保持一致
        const existing = await query(
          `SELECT id FROM news WHERE source = $1 AND source_url = $2
           AND DATE(crawled_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') = $3`,
          [item.source, item.sourceUrl, today]
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

    await deleteCache(`news:${today}`);

    return saved;
  },

  async getNewsByDate(date: string): Promise<News[]> {
    const cacheKey = `news:${date}`;
    const cached = await getCache<News[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // 按抓取日期查询（crawled_at），而不是新闻发布日期
    // 使用 CST 时区判断日期，与保存侧保持一致
    const rows = await query<News>(
      `SELECT * FROM news WHERE DATE(crawled_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') = $1 ORDER BY crawled_at DESC`,
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

  async updateComments(id: number, comments: string): Promise<void> {
    await query(
      'UPDATE news SET community_comments = $1 WHERE id = $2',
      [comments, id]
    );
  },

  async getSources(): Promise<string[]> {
    const rows = await query<{ source: string }>(
      'SELECT DISTINCT source FROM news ORDER BY source'
    );
    return rows.map(r => r.source);
  },

  async getStats(): Promise<{
    total: number;
    withSummary: number;
    dateDistribution: { date: string; count: number }[];
  }> {
    const totalResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM news'
    );

    const withSummaryResult = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM news WHERE summary IS NOT NULL'
    );

    const dateDistributionResult = await query<{ date: string; count: number }>(
      `SELECT DATE(crawled_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') as date, COUNT(*) as count 
       FROM news 
       GROUP BY DATE(crawled_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') 
       ORDER BY date DESC`
    );

    return {
      total: totalResult[0]?.count || 0,
      withSummary: withSummaryResult[0]?.count || 0,
      dateDistribution: dateDistributionResult,
    };
  },
};
