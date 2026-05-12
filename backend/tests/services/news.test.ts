import { newsService } from '../../src/services/news.service';
import { query, initDatabase } from '../../src/config/database';

describe('NewsService', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterEach(async () => {
    await query('DELETE FROM news WHERE source = $1', ['test']);
  });

  test('saveNewsBatch should save new items', async () => {
    const items = [{
      title: 'Test News',
      source: 'test',
      sourceUrl: 'https://example.com/1',
      sourceName: 'Test Source',
      publishDate: new Date(),
    }];

    const count = await newsService.saveNewsBatch(items);
    expect(count).toBe(1);
  });

  test('getNewsByDate should return news for given date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const news = await newsService.getNewsByDate(today);
    expect(Array.isArray(news)).toBe(true);
  });
});
