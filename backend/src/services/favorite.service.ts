import { query } from '../config/database';
import { getCache, setCache, deleteCache } from '../config/redis';
import { News } from './news.service';

export interface Favorite {
  id: number;
  user_id: number;
  news_id: number;
  created_at: string;
}

export const favoriteService = {
  async addFavorite(userId: number, newsId: number): Promise<void> {
    await query(
      `INSERT INTO favorites (user_id, news_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, newsId]
    );

    await deleteCache(`favorites:${userId}`);
  },

  async removeFavorite(userId: number, newsId: number): Promise<void> {
    await query(
      'DELETE FROM favorites WHERE user_id = $1 AND news_id = $2',
      [userId, newsId]
    );

    await deleteCache(`favorites:${userId}`);
  },

  async getUserFavorites(userId: number): Promise<News[]> {
    const cacheKey = `favorites:${userId}`;
    const cached = await getCache<News[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const rows = await query<News>(
      `SELECT n.* FROM news n
       INNER JOIN favorites f ON n.id = f.news_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    await setCache(cacheKey, rows, 1800);
    return rows;
  },

  async isFavorited(userId: number, newsId: number): Promise<boolean> {
    const rows = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND news_id = $2',
      [userId, newsId]
    );
    return rows.length > 0;
  },
};
