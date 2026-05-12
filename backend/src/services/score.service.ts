import { config } from '../config';
import { logger } from '../utils/logger';

export interface ScoreResult {
  score: number;
  reason: string;
  tags: string[];
  summary: string;
}

export async function generateScore(title: string, content?: string): Promise<ScoreResult> {
  const text = content ? `${title}\n\n${content}` : title;
  
  const prompt = `
你是一个 AI 内容评分专家。请对以下科技新闻内容进行评分（0-10分）。

评分标准：
- 9-10分 (重大突破): 范式转变、重大技术突破、行业颠覆、开创性研究
- 7-8分 (重要进展): 重要技术进展、新工具/库发布、有影响力的研究论文
- 5-6分 (值得关注): 值得了解但不紧急、有趣的技术分享、产品更新
- 3-4分 (次要内容): 常规更新、重复信息、边缘话题
- 0-2分 (噪音): 不相关内容、广告、标题党、低质量内容

请分析以下内容：
${text}

请输出 JSON 格式，包含以下字段：
- score: 数字，0-10 的分数
- reason: 字符串，评分理由（中文）
- tags: 字符串数组，相关标签（如 ["AI", "LLM", "GPT"]）
- summary: 字符串，一句话摘要（中文）
`.trim();

  try {
    const response = await fetch(config.volcengine.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.volcengine.apiKey}`,
      },
      body: JSON.stringify({
        model: 'kimi-k2.6',
        messages: [
          { role: 'system', content: '你是一个专业的科技新闻评分助手，擅长评估 AI 和技术相关内容的重要性。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || '';
    
    try {
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      logger.warn('Failed to parse score JSON, using fallback');
    }

    return {
      score: 5,
      reason: '无法解析评分结果，使用默认分数',
      tags: ['AI', 'Tech'],
      summary: title.substring(0, 100) + '...',
    };
  } catch (err) {
    logger.error('Score generation failed', err);
    return {
      score: 5,
      reason: '评分服务不可用，使用默认分数',
      tags: ['AI', 'Tech'],
      summary: title.substring(0, 100) + '...',
    };
  }
}

export function shouldFilterByScore(score: number): boolean {
  const threshold = parseFloat(process.env.SCORE_THRESHOLD || '6.0');
  return score >= threshold;
}
