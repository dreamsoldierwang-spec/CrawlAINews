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

    const items = await Promise.all(
      response.data.hits
        .filter((hit: any) => hit.title && hit.url)
        .slice(0, 15)
        .map(async (hit: any) => {
          let content = hit.story_text || '';
          
          // 如果 story_text 为空，尝试获取 HN 评论作为内容
          if (!content && hit.objectID) {
            try {
              const itemResponse = await axios.get(
                `https://hacker-news.firebaseio.com/v0/item/${hit.objectID}.json`,
                { timeout: 10000 }
              );
              const itemData = itemResponse.data;
              if (itemData.text) {
                // HN API 返回的 text 是 HTML，需要清理
                content = itemData.text
                  .replace(/<[^>]*>/g, ' ')  // 移除 HTML 标签
                  .replace(/\s+/g, ' ')      // 合并多余空格
                  .trim();
              }
            } catch (err) {
              // 忽略获取失败的错误
            }
          }
          
          return {
            title: hit.title,
            source: this.name,
            sourceUrl: hit.url,
            sourceName: this.sourceName,
            publishDate: new Date(hit.created_at),
            content: content || hit.title, // 如果仍然没有内容，使用标题作为内容
            category: 'news',
          };
        })
    );

    return this.filterAIItems(items);
  }
}
