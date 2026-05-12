import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';

export interface Comment {
  author: string;
  content: string;
  score?: number;
  time?: string;
}

export interface CommentResult {
  url: string;
  comments: Comment[];
  summary: string;
}

export async function fetchHNComments(itemId: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  try {
    const url = `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`;
    const response = await axios.get(url, { timeout: 15000 });
    const item = response.data;

    if (item && item.kids) {
      for (const kidId of item.kids.slice(0, 10)) {
        try {
          const commentResponse = await axios.get(
            `https://hacker-news.firebaseio.com/v0/item/${kidId}.json`,
            { timeout: 10000 }
          );
          const comment = commentResponse.data;
          if (comment && comment.text && comment.by) {
            comments.push({
              author: comment.by,
              content: comment.text.replace(/<[^>]*>/g, ''),
              score: comment.score,
              time: new Date(comment.time * 1000).toLocaleString(),
            });
          }
        } catch (err) {
          logger.warn(`Failed to fetch HN comment ${kidId}`);
        }
      }
    }
  } catch (err) {
    logger.warn(`Failed to fetch HN comments for item ${itemId}`);
  }
  return comments;
}

export async function fetchRedditComments(url: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  try {
    const match = url.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)/);
    if (!match) return comments;

    const [, subreddit, postId] = match;
    const apiUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;

    const response = await axios.get(apiUrl, {
      headers: { 'User-Agent': 'AI News Crawler' },
      timeout: 15000,
    });

    const data = response.data;
    if (data && data[1] && data[1].data && data[1].data.children) {
      for (const child of data[1].data.children.slice(0, 10)) {
        const comment = child.data;
        if (comment && comment.body && comment.author) {
          comments.push({
            author: comment.author,
            content: comment.body,
            score: comment.score,
            time: new Date(comment.created_utc * 1000).toLocaleString(),
          });
        }
      }
    }
  } catch (err) {
    logger.warn(`Failed to fetch Reddit comments for ${url}`);
  }
  return comments;
}

export async function summarizeComments(comments: Comment[]): Promise<string> {
  if (comments.length === 0) return '';

  const commentsText = comments.map(c => `${c.author}: ${c.content}`).join('\n\n');
  
  const prompt = `
请对以下社区评论进行总结，提取主要观点和讨论焦点。

评论内容：
${commentsText}

请用中文总结，不超过200字。
`.trim();

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOLCENGINE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'kimi-k2.6',
        messages: [
          { role: 'system', content: '你是一个专业的社区评论总结助手。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }
  } catch (err) {
    logger.warn('Failed to summarize comments');
  }

  return comments.slice(0, 3).map(c => c.content).join('；');
}

export async function getCommunityComments(url: string, source: string): Promise<CommentResult> {
  let comments: Comment[] = [];

  if (source === 'hackernews') {
    const match = url.match(/item\?id=(\d+)/);
    if (match) {
      comments = await fetchHNComments(match[1]);
    }
  } else if (source === 'reddit') {
    comments = await fetchRedditComments(url);
  }

  const summary = await summarizeComments(comments);

  return {
    url,
    comments,
    summary,
  };
}
