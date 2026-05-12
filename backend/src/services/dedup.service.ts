import { NewsItem } from '../crawlers/base';
import { logger } from '../utils/logger';

export interface EmbeddingResult {
  text: string;
  embedding: number[];
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOLCENGINE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 500),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data?.[0]?.embedding || null;
    }
  } catch (err) {
    logger.warn('Failed to generate embedding');
  }
  return null;
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

export async function semanticDeduplicate(
  items: NewsItem[],
  threshold: number = 0.85
): Promise<NewsItem[]> {
  if (items.length <= 1) return items;

  const embeddingResults: { item: NewsItem; embedding: number[] }[] = [];
  
  for (const item of items) {
    const text = `${item.title} ${item.content || ''}`;
    const embedding = await generateEmbedding(text);
    if (embedding) {
      embeddingResults.push({ item, embedding });
    }
  }

  const uniqueItems: NewsItem[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < embeddingResults.length; i++) {
    if (usedIndices.has(i)) continue;

    const current = embeddingResults[i];
    uniqueItems.push(current.item);
    usedIndices.add(i);

    for (let j = i + 1; j < embeddingResults.length; j++) {
      if (usedIndices.has(j)) continue;

      const similarity = cosineSimilarity(current.embedding, embeddingResults[j].embedding);
      if (similarity >= threshold) {
        usedIndices.add(j);
        logger.debug(`Semantic duplicate found: "${current.item.title}" vs "${embeddingResults[j].item.title}" (similarity: ${similarity.toFixed(2)})`);
      }
    }
  }

  logger.info(`Semantic deduplication: ${items.length} -> ${uniqueItems.length}`);
  return uniqueItems;
}

export function urlDeduplicate(items: NewsItem[]): NewsItem[] {
  const seenUrls = new Set<string>();
  const uniqueItems: NewsItem[] = [];

  for (const item of items) {
    const normalizedUrl = item.sourceUrl.toLowerCase().replace(/\/$/, '');
    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      uniqueItems.push(item);
    }
  }

  logger.info(`URL deduplication: ${items.length} -> ${uniqueItems.length}`);
  return uniqueItems;
}

export async function deduplicate(items: NewsItem[]): Promise<NewsItem[]> {
  let uniqueItems = urlDeduplicate(items);
  
  if (process.env.ENABLE_SEMANTIC_DEDUP === 'true') {
    uniqueItems = await semanticDeduplicate(uniqueItems);
  }

  return uniqueItems;
}
