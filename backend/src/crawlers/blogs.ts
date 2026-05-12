import Parser from 'rss-parser';
import { BaseCrawler, NewsItem } from './base';

const rssParser = new Parser();

export class BlogsCrawler extends BaseCrawler {
  readonly name = 'blogs';
  readonly sourceName = '官方博客';

  async crawl(): Promise<NewsItem[]> {
    const feeds = [
      { url: 'https://blog.google/technology/ai/rss/', name: 'Google AI Blog' },
      { url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog' },
    ];

    const items: NewsItem[] = [];

    for (const feed of feeds) {
      try {
        const feedData = await rssParser.parseURL(feed.url);

        for (const item of feedData.items.slice(0, 8)) {
          if (item.title && item.link) {
            items.push({
              title: item.title,
              source: this.name,
              sourceUrl: item.link,
              sourceName: feed.name,
              publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              content: item.contentSnippet || item.content,
              category: 'research',
            });
          }
        }
      } catch (err) {
        console.error(`RSS feed failed: ${feed.url}`, err);
      }
    }

    return this.filterAIItems(items);
  }
}
