import { Router } from 'express';
import { newsService } from '../services/news.service';
import { generateDateKey } from '../utils/hash';
import { runCrawlers } from '../crawlers';
import { logger } from '../utils/logger';

const router = Router();

// 注意：/crawl 必须在 /:id 之前，否则会被当成 ID 参数
router.post('/crawl', async (req, res) => {
  try {
    res.json({ success: true, message: 'Crawl job started' });
    runCrawlers().catch(err => {
      console.error('Crawl error:', err);
      logger.error('Crawl job failed', err);
    });
  } catch (err) {
    console.error('Start crawl error:', err);
    res.status(500).json({ success: false, error: 'Failed to start crawl' });
  }
});

router.get('/sources', async (req, res) => {
  try {
    const sources = await newsService.getSources();
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch sources' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await newsService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const news = await newsService.getNewsById(id);

    if (!news) {
      res.status(404).json({ success: false, error: 'News not found' });
      return;
    }

    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

router.get('/', async (req, res) => {
  try {
    const date = req.query.date as string || generateDateKey(new Date());
    const news = await newsService.getNewsByDate(date);

    res.json({
      success: true,
      data: {
        date,
        count: news.length,
        items: news,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

export default router;
