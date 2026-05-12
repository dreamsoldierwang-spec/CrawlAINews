export interface NewsItem {
  title: string;
  source: string;
  sourceUrl: string;
  sourceName: string;
  publishDate: Date;
  content?: string;
  category?: string;
  tags?: string[];
}

// AI 核心关键词（必须匹配至少一个）
const AI_CORE_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
  'llm', 'large language model', 'gpt', 'chatgpt', 'claude', 'gemini', 'copilot',
  'openai', 'anthropic', 'google ai', 'meta ai', 'microsoft ai', 'deepseek',
  '生成式', '大模型', '人工智能', '机器学习', '深度学习', '神经网络',
  '自然语言处理', 'nlp', '计算机视觉', 'cv', '强化学习', 'rl',
  'transformer', 'diffusion', 'stable diffusion', 'midjourney', 'dall-e',
  'rag', '向量数据库', 'embedding', 'fine-tuning', 'prompt', '提示词',
  '自动驾驶', '智能体', 'agent', '多模态', 'multimodal',
  'cuda', 'gpu', 'tpu', '推理', '训练', '微调', '具身智能',
  '论文', 'arxiv', 'research', '模型', '算法', '神经网络',
  'chatbot', '聊天机器人', 'aigc', '生成式ai', '大语言模型',
  '语义理解', '知识图谱', '智能推荐', '语音识别', '图像生成',
];

// 排除关键词（如果包含这些，可能是非AI内容）
const EXCLUDE_KEYWORDS = [
  '尼安德特人', '恐龙', '化石', '考古', '古生物',
  '星座', '运势', '塔罗', '占卜',
  '菜谱', '烹饪', '美食', '餐厅',
  '旅游攻略', '酒店', '景点',
  '美妆', '护肤', '穿搭', '时尚',
  '宠物', '猫', '狗', '萌宠',
  '明星', '娱乐', '八卦', '绯闻',
  '体育', '足球', '篮球', '比赛',
  '房产', '楼市', '房价', '装修',
  '汽车评测', '车型', '油耗', '试驾',
];

export abstract class BaseCrawler {
  abstract readonly name: string;
  abstract readonly sourceName: string;

  abstract crawl(): Promise<NewsItem[]>;

  protected normalizeDate(dateStr: string): Date {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  }

  // 检查内容是否与 AI 相关
  protected isAIRelated(title: string, content?: string): boolean {
    const text = `${title} ${content || ''}`.toLowerCase();
    
    // 先检查排除关键词
    const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    // 如果包含排除关键词，直接返回 false
    if (hasExcludeKeyword) {
      return false;
    }
    
    // 检查是否包含核心AI关键词
    return AI_CORE_KEYWORDS.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  // 过滤非 AI 相关内容
  protected filterAIItems(items: NewsItem[]): NewsItem[] {
    return items.filter(item => this.isAIRelated(item.title, item.content));
  }
}
