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
          limit: 15,
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

    const items = answers
      .filter((ans: any) => ans.content)
      .map((ans: any) => {
        const cheerio = require('cheerio');
        const $ = cheerio.load(ans.content);
        const text = $.text();

        return {
          title: `知乎 AI 讨论: ${text.substring(0, 50).trim()}...`,
          source: this.name,
          sourceUrl: `https://zhihu.com/question/19550517/answer/${ans.id}`,
          sourceName: this.sourceName,
          publishDate: new Date(ans.updated_time * 1000),
          content: text,
          category: 'news',
        };
      });

    return this.filterAIItems(items);
  }
}
