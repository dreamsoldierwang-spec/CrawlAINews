import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class Jin10Crawler extends BaseCrawler {
  readonly name = 'jin10';
  readonly sourceName = '金十数据';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://www.jin10.com/flash', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const cheerio = await import('cheerio');
    const $ = cheerio.load(response.data);
    const items: NewsItem[] = [];

    $('.jin-flash-item').each((_, elem) => {
      const contentElem = $(elem).find('.jin-flash-text');
      const content = contentElem.text().trim();
      const timeElem = $(elem).find('.jin-flash-time');
      const timeText = timeElem.text().trim();

      if (content) {
        items.push({
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          source: this.name,
          sourceUrl: 'https://www.jin10.com/flash',
          sourceName: this.sourceName,
          publishDate: timeText ? new Date(`2026-${timeText}`) : new Date(),
          content,
          category: 'finance',
        });
      }
    });

    return this.filterAIItems(items).slice(0, 15);
  }
}
