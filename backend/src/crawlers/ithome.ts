import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class ITHomeCrawler extends BaseCrawler {
  readonly name = 'ithome';
  readonly sourceName = 'IT之家';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://api.ithome.com/json/newslist/news', {
      params: {
        r: '0',
        page: 1,
        count: 20,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const articles = response.data?.newslist || [];

    const items = articles
      .filter((article: any) => article.title)
      .map((article: any) => {
        // 修复链接格式：确保使用完整的 URL
        let sourceUrl: string;
        if (article.url && article.url.startsWith('http')) {
          sourceUrl = article.url;
        } else if (article.newsid) {
          // IT之家文章链接格式：https://www.ithome.com/0/xxx/xxx.htm
          const newsIdStr = String(article.newsid);
          if (newsIdStr.length >= 3) {
            const part1 = newsIdStr.substring(0, newsIdStr.length - 2);
            const part2 = newsIdStr;
            sourceUrl = `https://www.ithome.com/0/${part1}/${part2}.htm`;
          } else {
            sourceUrl = `https://www.ithome.com/0/${article.newsid}.htm`;
          }
        } else {
          sourceUrl = 'https://www.ithome.com';
        }

        return {
          title: article.title,
          source: this.name,
          sourceUrl,
          sourceName: this.sourceName,
          publishDate: article.postdate ? new Date(article.postdate) : new Date(),
          content: article.description || '',
          category: 'tech',
        };
      });

    return this.filterAIItems(items);
  }
}
