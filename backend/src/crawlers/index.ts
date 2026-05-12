import cron from 'node-cron';
import { BaseCrawler, NewsItem } from './base';
import { GithubCrawler } from './github';
import { HackerNewsCrawler } from './hackernews';
import { ProductHuntCrawler } from './producthunt';
import { RedditCrawler } from './reddit';
import { ZhihuCrawler } from './zhihu';
import { TechMediaCrawler } from './tech-media';
import { BlogsCrawler } from './blogs';
import { ArxivCrawler } from './arxiv';
import { JuejinCrawler } from './juejin';
import { ITHomeCrawler } from './ithome';
import { CLS_Crawler } from './cls';
import { GelonghuiCrawler } from './gelonghui';
import { SolidotCrawler } from './solidot';
import { Jin10Crawler } from './jin10';
import { SSPaiCrawler } from './sspai';
import { TelegramCrawler } from './telegram';
import { TwitterCrawler } from './twitter';
import { newsService } from '../services/news.service';
import { generateSummary } from '../services/summary.service';
import { generateScore, shouldFilterByScore } from '../services/score.service';
import { getCommunityComments } from '../services/comments.service';
import { deduplicate } from '../services/dedup.service';
import { logger } from '../utils/logger';
import { config } from '../config';

const crawlers: BaseCrawler[] = [
  new GithubCrawler(),
  new HackerNewsCrawler(),
  new ProductHuntCrawler(),
  new RedditCrawler(),
  new ZhihuCrawler(),
  new TechMediaCrawler(),
  new BlogsCrawler(),
  new ArxivCrawler(),
  new JuejinCrawler(),
  new ITHomeCrawler(),
  new CLS_Crawler(),
  new GelonghuiCrawler(),
  new SolidotCrawler(),
  new Jin10Crawler(),
  new SSPaiCrawler(),
  new TelegramCrawler(),
  new TwitterCrawler(),
];

export async function runCrawlers(): Promise<void> {
  logger.info('Starting daily crawl job');

  const results = await Promise.allSettled(
    crawlers.map(async (crawler) => {
      try {
        logger.info(`Crawling ${crawler.name}...`);
        const items = await crawler.crawl();
        logger.info(`Crawled ${items.length} items from ${crawler.name}`);
        return { crawler: crawler.name, items };
      } catch (err) {
        logger.error(`Crawler ${crawler.name} failed`, err);
        return { crawler: crawler.name, items: [] };
      }
    })
  );

  let allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value.items);
    }
  }

  logger.info(`Total crawled items: ${allItems.length}`);

  if (allItems.length > 0) {
    allItems = await deduplicate(allItems);
    logger.info(`After deduplication: ${allItems.length} items`);
  }

  if (config.crawler.enableScoring === 'true') {
    logger.info('AI scoring enabled, filtering low-score items...');
    const scoredItems = await Promise.all(
      allItems.map(async (item) => {
        const scoreResult = await generateScore(item.title, item.content);
        return { ...item, score: scoreResult.score, scoreReason: scoreResult.reason, tags: scoreResult.tags };
      })
    );
    
    allItems = scoredItems.filter(item => shouldFilterByScore(item.score as number));
    logger.info(`After AI scoring filter: ${allItems.length} items`);
  }

  const savedCount = await newsService.saveNewsBatch(allItems);
  logger.info(`Saved ${savedCount} new items`);

  const unsummarized = await newsService.getUnsummarizedNews(20);
  for (const news of unsummarized) {
    const summary = await generateSummary(news.title, news.content || news.title);
    if (summary) {
      await newsService.updateSummary(news.id, summary);
    }

    if (news.source === 'hackernews' || news.source === 'reddit') {
      const commentsResult = await getCommunityComments(news.source_url, news.source);
      if (commentsResult.summary) {
        await newsService.updateComments(news.id, commentsResult.summary);
      }
    }
  }
}

export function startCrawlerScheduler(): void {
  logger.info(`Crawler scheduler started with cron: ${config.crawler.cronSchedule}`);
  logger.info(`AI scoring enabled: ${config.crawler.enableScoring}`);
  cron.schedule(config.crawler.cronSchedule, runCrawlers);
}
