import axios from 'axios';
import { BaseCrawler, NewsItem } from './base';

export class ProductHuntCrawler extends BaseCrawler {
  readonly name = 'producthunt';
  readonly sourceName = 'Product Hunt';

  async crawl(): Promise<NewsItem[]> {
    const today = new Date().toISOString().split('T')[0];

    const response = await axios.post(
      'https://www.producthunt.com/frontend/graphql',
      {
        operationName: 'HomePage',
        variables: { date: today },
        query: `
          query HomePage($date: Date!) {
            posts(date: $date) {
              edges {
                node {
                  name
                  tagline
                  url
                  createdAt
                  description
                }
              }
            }
          }
        `
      },
      { timeout: 15000 }
    );

    const edges = response.data?.data?.posts?.edges || [];

    const items = edges
      .filter((edge: any) => edge.node?.name)
      .slice(0, 10)
      .map((edge: any) => ({
        title: `${edge.node.name}: ${edge.node.tagline || ''}`,
        source: this.name,
        sourceUrl: edge.node.url,
        sourceName: this.sourceName,
        publishDate: new Date(edge.node.createdAt),
        content: edge.node.description || edge.node.tagline || '',
        category: 'product',
      }));

    return this.filterAIItems(items);
  }
}
