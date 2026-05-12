import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class CLS_Crawler extends BaseCrawler {
  readonly name = 'cls';
  readonly sourceName = '财联社';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://www.cls.cn/api/telegraph', {
      params: {
        app: 'CailianpressWeb',
        os: 'web',
        sv: '8.4.6',
        sign: '',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const articles = response.data?.data?.roll_data || [];

    const items = articles
      .filter((article: any) => article.title || article.content)
      .map((article: any) => ({
        title: article.title || article.content.substring(0, 50),
        source: this.name,
        sourceUrl: article.uri || 'https://www.cls.cn/telegraph',
        sourceName: this.sourceName,
        publishDate: article.ctime ? new Date(article.ctime * 1000) : new Date(),
        content: article.content || '',
        category: 'finance',
      }));

    return this.filterAIItems(items);
  }
}
