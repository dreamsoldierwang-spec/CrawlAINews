import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class GelonghuiCrawler extends BaseCrawler {
  readonly name = 'gelonghui';
  readonly sourceName = '格隆汇';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://www.gelonghui.com/api/news', {
      params: {
        page: 1,
        size: 20,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const articles = response.data?.result?.items || [];

    const items = articles
      .filter((article: any) => article.title)
      .map((article: any) => ({
        title: article.title,
        source: this.name,
        sourceUrl: article.url || `https://www.gelonghui.com/p/${article.id}`,
        sourceName: this.sourceName,
        publishDate: article.createTime ? new Date(article.createTime) : new Date(),
        content: article.summary || '',
        category: 'finance',
      }));

    return this.filterAIItems(items);
  }
}
