import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class JuejinCrawler extends BaseCrawler {
  readonly name = 'juejin';
  readonly sourceName = '稀土掘金';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed', {
      params: {
        aid: '2608',
        uuid: '',
        spider: '0',
        category_id: '6809637773935378440', // AI 分类
        cursor: '0',
        limit: 20,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const articles = response.data?.data || [];

    const items = articles
      .filter((article: any) => article.article_info?.title)
      .map((article: any) => ({
        title: article.article_info.title,
        source: this.name,
        sourceUrl: `https://juejin.cn/post/${article.article_id}`,
        sourceName: this.sourceName,
        publishDate: new Date(article.article_info.ctime * 1000),
        content: article.article_info.brief_content || '',
        category: 'tech',
      }));

    return this.filterAIItems(items);
  }
}
