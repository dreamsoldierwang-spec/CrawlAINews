import { BaseCrawler, NewsItem } from './base';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class TwitterCrawler extends BaseCrawler {
  readonly name = 'twitter';
  readonly sourceName = 'Twitter/X';

  private accounts = [
    { name: 'OpenAI', username: 'OpenAI' },
    { name: 'Sam Altman', username: 'sama' },
    { name: 'Elon Musk', username: 'elonmusk' },
    { name: 'Google AI', username: 'GoogleAI' },
    { name: 'Meta AI', username: 'MetaAI' },
    { name: 'DeepLearningAI', username: 'DeepLearningAI' },
    { name: 'AI Memo', username: 'ai_mem0' },
    { name: 'Andrew Ng', username: 'AndrewYNg' },
  ];

  async crawl(): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    for (const account of this.accounts) {
      try {
        const url = `https://nitter.net/${account.username}`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 15000,
        });

        const $ = cheerio.load(response.data);
        const tweets = $('.timeline-item');

        tweets.each((_, element) => {
          const tweetElement = $(element);
          const text = tweetElement.find('.tweet-content').text().trim();
          const timeElement = tweetElement.find('.tweet-date a');
          const tweetUrl = timeElement.attr('href');
          const timestamp = timeElement.attr('title');

          if (text && text.length > 10) {
            const lines = text.split('\n');
            let title = lines.slice(0, 2).join(' ') || text.substring(0, 100);
            let content = text;

            if (title.length > 100) {
              title = title.substring(0, 100) + '...';
            }

            if (this.isAIRelated(title, content)) {
              allItems.push({
                title: title.trim(),
                source: this.name,
                sourceUrl: tweetUrl ? `https://nitter.net${tweetUrl}` : '',
                sourceName: account.name,
                publishDate: timestamp ? this.normalizeDate(timestamp) : new Date(),
                content: content.trim() || undefined,
              });
            }
          }
        });
      } catch (err) {
        console.warn(`Twitter crawler for ${account.name} failed:`, err);
      }
    }

    return this.filterAIItems(allItems);
  }
}
