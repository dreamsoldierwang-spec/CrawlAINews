import dotenv from 'dotenv';
import path from 'path';

// 从项目根目录加载 .env（当前文件在 backend/src/config，需要回到项目根目录）
const projectRoot = path.resolve(__dirname, '../../../');
const envPath = path.join(projectRoot, '.env');
dotenv.config({ path: envPath });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'ai_news',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },

  volcengine: {
    apiKey: process.env.VOLCENGINE_API_KEY || '',
    endpoint: process.env.VOLCENGINE_ENDPOINT || '',
  },

  crawler: {
    cronSchedule: process.env.CRON_SCHEDULE || '0 2 * * *',
    enableScoring: process.env.ENABLE_SCORING || 'false',
    scoreThreshold: parseFloat(process.env.SCORE_THRESHOLD || '6.0'),
  },
};
