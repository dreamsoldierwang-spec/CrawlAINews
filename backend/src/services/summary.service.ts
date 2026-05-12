import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function generateSummary(title: string, content: string): Promise<string | null> {
  if (!config.volcengine.apiKey || !config.volcengine.endpoint) {
    logger.warn('Volcengine config missing, skipping summary generation');
    return null;
  }

  try {
    logger.info(`Generating summary for: ${title.substring(0, 50)}...`);
    
    const response = await axios.post(
      config.volcengine.endpoint,
      {
        model: 'kimi-k2.6',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的 AI 资讯摘要生成助手。请用中文（简体）撰写摘要，2-3句话概括资讯的核心内容。无论原文是什么语言，摘要都必须用中文输出。语言简洁准确，只输出摘要内容，不要添加任何前缀、解释或思考过程。'
          },
          {
            role: 'user',
            content: `请用中文总结以下资讯：\n\n标题：${title}\n\n内容：${content.substring(0, 3000)}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.volcengine.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const choice = response.data.choices?.[0];
    const message = choice?.message;
    
    // 优先使用 content，如果没有则使用 reasoning_content
    let summary = message?.content?.trim();
    if (!summary && message?.reasoning_content) {
      summary = message.reasoning_content.trim();
    }
    
    if (summary) {
      // 清理可能的前缀
      summary = summary.replace(/^(用户要求|让我|我需要|分析|总结|摘要)\s*[:：]?\s*/i, '');
      logger.info(`Summary generated successfully: ${summary.substring(0, 100)}...`);
      return summary;
    } else {
      logger.warn('Summary response empty');
      return null;
    }
  } catch (err: any) {
    logger.error('Summary generation failed', err.message || err);
    if (err.response) {
      logger.error('API response error:', err.response.data);
    }
    return null;
  }
}
