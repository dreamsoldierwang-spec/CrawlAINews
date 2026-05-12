import Parser from 'rss-parser';
import { BaseCrawler, NewsItem } from './base';

const rssParser = new Parser();

export class TechMediaCrawler extends BaseCrawler {
  readonly name = 'tech-media';
  readonly sourceName = '科技媒体';

  async crawl(): Promise<NewsItem[]> {
    const feeds = [
      { url: 'https://36kr.com/feed', name: '36氪' },
      { url: 'https://www.geekpark.net/rss', name: '极客公园' },
    ];

    const items: NewsItem[] = [];

    for (const feed of feeds) {
      try {
        const feedData = await rssParser.parseURL(feed.url);

        for (const item of feedData.items.slice(0, 15)) {
          if (item.title && item.link) {
            items.push({
              title: item.title,
              source: this.name,
              sourceUrl: item.link,
              sourceName: feed.name,
              publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              content: item.contentSnippet || item.content,
              category: 'news',
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
