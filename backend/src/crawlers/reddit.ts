import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class RedditCrawler extends BaseCrawler {
  readonly name = 'reddit';
  readonly sourceName = 'Reddit';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get(
      'https://www.reddit.com/r/artificial/hot.json?limit=20',
      {
        headers: { 'User-Agent': 'AI-News-Bot/1.0' },
        timeout: 15000,
      }
    );

    const posts = response.data?.data?.children || [];

    const items = posts
      .filter((post: any) => post.data?.title)
      .map((post: any) => ({
        title: post.data.title,
        source: this.name,
        sourceUrl: `https://reddit.com${post.data.permalink}`,
        sourceName: `${this.sourceName} r/artificial`,
        publishDate: new Date(post.data.created_utc * 1000),
        content: post.data.selftext || '',
        category: 'news',
      }));

    return this.filterAIItems(items);
  }
}
