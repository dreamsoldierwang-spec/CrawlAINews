import { BaseCrawler, NewsItem } from './base';
import axios from 'axios';

export class TelegramCrawler extends BaseCrawler {
  readonly name = 'telegram';
  readonly sourceName = 'Telegram';

  private channels = [
    { name: 'AI前沿资讯', channel: 'AI_Frontier', url: 'https://t.me/s/AI_Frontier' },
    { name: '机器学习周刊', channel: 'ML_Weekly', url: 'https://t.me/s/ML_Weekly' },
    { name: 'DeepLearningAI', channel: 'DeepLearningAI', url: 'https://t.me/s/DeepLearningAI' },
    { name: 'AI科技评论', channel: 'AI_Tech_Review', url: 'https://t.me/s/AI_Tech_Review' },
    { name: 'ChatGPT中文', channel: 'ChatGPT_Chinese', url: 'https://t.me/s/ChatGPT_Chinese' },
  ];

  async crawl(): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];

    for (const channel of this.channels) {
      try {
        const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`, {
          params: {
            channel: channel.channel,
            limit: 20,
          },
          timeout: 15000,
        });

        const messages = response.data.result || [];
        for (const message of messages) {
          if (message.channel_post && message.channel_post.text) {
            const text = message.channel_post.text;
            const lines = text.split('\n');
            let title = lines[0] || '';
            let content = lines.slice(1).join('\n') || '';
            let sourceUrl = '';

            const urlMatch = text.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
              sourceUrl = urlMatch[0];
            }

            if (title.length > 10 && this.isAIRelated(title, content)) {
              allItems.push({
                title: title.trim(),
                source: this.name,
                sourceUrl: sourceUrl,
                sourceName: channel.name,
                publishDate: new Date(),
                content: content.trim() || undefined,
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Telegram crawler for ${channel.name} failed:`, err);
      }
    }

    return this.filterAIItems(allItems);
  }
}
