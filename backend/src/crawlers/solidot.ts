import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class SolidotCrawler extends BaseCrawler {
  readonly name = 'solidot';
  readonly sourceName = '奇客资讯';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://www.solidot.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const cheerio = await import('cheerio');
    const $ = cheerio.load(response.data);
    const items: NewsItem[] = [];

    $('.block_m').each((_, elem) => {
      const titleElem = $(elem).find('.bg_htit a');
      const title = titleElem.text().trim();
      const href = titleElem.attr('href');
      const contentElem = $(elem).find('.p_mainnew');
      const content = contentElem.text().trim();

      if (title && href) {
        // 修复链接拼接：如果 href 已经包含域名，直接使用；否则拼接域名
        let sourceUrl: string;
        if (href.startsWith('http')) {
          sourceUrl = href;
        } else if (href.startsWith('//')) {
          sourceUrl = `https:${href}`;
        } else if (href.startsWith('/')) {
          sourceUrl = `https://www.solidot.org${href}`;
        } else {
          // 相对路径，如 story?sid=xxx
          sourceUrl = `https://www.solidot.org/${href}`;
        }

        items.push({
          title,
          source: this.name,
          sourceUrl,
          sourceName: this.sourceName,
          publishDate: new Date(),
          content,
          category: 'tech',
        });
      }
    });

    return this.filterAIItems(items).slice(0, 15);
  }
}
