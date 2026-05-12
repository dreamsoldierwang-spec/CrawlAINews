import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class SSPaiCrawler extends BaseCrawler {
  readonly name = 'sspai';
  readonly sourceName = '少数派';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://sspai.com/api/v1/articles', {
      params: {
        offset: 0,
        limit: 20,
        type: 'recommend',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const articles = response.data?.data || [];

    const items = articles
      .filter((article: any) => article.title)
      .map((article: any) => ({
        title: article.title,
        source: this.name,
        sourceUrl: `https://sspai.com/post/${article.id}`,
        sourceName: this.sourceName,
        publishDate: article.created_at ? new Date(article.created_at) : new Date(),
        content: article.summary || article.content || '',
        category: 'tech',
      }));

    return this.filterAIItems(items);
  }
}
