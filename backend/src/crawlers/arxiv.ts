import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class ArxivCrawler extends BaseCrawler {
  readonly name = 'arxiv';
  readonly sourceName = 'arXiv';

  async crawl(): Promise<NewsItem[]> {
    const response = await axios.get('http://export.arxiv.org/api/query', {
      params: {
        search_query: 'cat:cs.AI',
        start: 0,
        max_results: 15,
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      },
      timeout: 15000,
    });

    const parser = new (await import('xml2js')).Parser();
    const result = await parser.parseStringPromise(response.data);

    const entries = result.feed?.entry || [];

    const items = entries
      .filter((entry: any) => entry.title && entry.id)
      .map((entry: any) => ({
        title: `[论文] ${entry.title[0].trim()}`,
        source: this.name,
        sourceUrl: entry.id[0],
        sourceName: this.sourceName,
        publishDate: entry.published ? new Date(entry.published[0]) : new Date(),
        content: entry.summary ? entry.summary[0] : '',
        category: 'research',
      }));

    return this.filterAIItems(items);
  }
}
