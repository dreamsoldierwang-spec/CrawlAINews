import { Pool } from 'pg';
import { config } from './index';
import { logger } from '../utils/logger';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        source VARCHAR(100) NOT NULL,
        source_url TEXT NOT NULL,
        source_name VARCHAR(200),
        publish_date DATE NOT NULL,
        crawled_at TIMESTAMP DEFAULT NOW(),
        summary TEXT,
        content TEXT,
        category VARCHAR(50),
        tags TEXT[],
        is_featured BOOLEAN DEFAULT FALSE,
        community_comments TEXT,
        score INTEGER DEFAULT 5,
        score_reason TEXT,
        UNIQUE(source, source_url)
      );

      CREATE INDEX IF NOT EXISTS idx_news_date ON news(publish_date DESC);
      CREATE INDEX IF NOT EXISTS idx_news_source ON news(source);

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        openid VARCHAR(100) UNIQUE NOT NULL,
        nickname VARCHAR(100),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, news_id)
      );

      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    `);
    logger.info('Database initialized');
  } finally {
    client.release();
  }
}
