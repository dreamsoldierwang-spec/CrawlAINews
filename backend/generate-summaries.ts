import { newsService } from './src/services/news.service';
import { generateSummary } from './src/services/summary.service';
import { logger } from './src/utils/logger';

async function generateAllSummaries() {
  logger.info('Starting batch summary generation...');
  
  const unsummarized = await newsService.getUnsummarizedNews(100);
  logger.info(`Found ${unsummarized.length} news without summary`);
  
  for (const news of unsummarized) {
    try {
      logger.info(`Generating summary for: ${news.title.substring(0, 50)}...`);
      const summary = await generateSummary(news.title, news.content || news.title);
      if (summary) {
        await newsService.updateSummary(news.id, summary);
        logger.info(`Summary saved for news ${news.id}`);
      } else {
        logger.warn(`Failed to generate summary for news ${news.id}`);
      }
    } catch (err) {
      logger.error(`Error generating summary for news ${news.id}:`, err);
    }
  }
  
  logger.info('Batch summary generation completed');
}

generateAllSummaries().catch(err => {
  logger.error('Batch summary generation failed:', err);
  process.exit(1);
});
