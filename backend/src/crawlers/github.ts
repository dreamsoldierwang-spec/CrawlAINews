import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class GithubCrawler extends BaseCrawler {
  readonly name = 'github';
  readonly sourceName = 'GitHub';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('https://github.com/trending?since=daily', {
      headers: { 'Accept': 'text/html' },
      timeout: 15000,
    });

    const cheerio = await import('cheerio');
    const $ = cheerio.load(response.data);
    const items: NewsItem[] = [];

    $('article.Box-row').each((_, elem) => {
      const linkElem = $(elem).find('h2 a');
      const href = linkElem.attr('href');
      const title = linkElem.text().trim().replace(/\s+/g, ' ');
      const descElem = $(elem).find('p[class*="color-fg-muted"]');
      const description = descElem.text().trim();

      if (href && title) {
        items.push({
          title: `[GitHub Trending] ${title}`,
          source: this.name,
          sourceUrl: `https://github.com${href}`,
          sourceName: this.sourceName,
          publishDate: new Date(),
          content: description,
          category: 'product',
        });
      }
    });

    return this.filterAIItems(items).slice(0, 10);
  }
}
