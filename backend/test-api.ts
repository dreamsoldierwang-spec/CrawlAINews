import axios from 'axios';

async function testAPI() {
  const apiKey = '02d86425-f15e-4d87-887c-fc9e687fda92';
  const endpoint = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

  console.log('Testing Volcengine API...');
  console.log('Endpoint:', endpoint);
  console.log('API Key:', apiKey.substring(0, 10) + '...');

  try {
    const response = await axios.post(
      endpoint,
      {
        model: 'Kimi-K2.6',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的 AI 资讯摘要生成助手。请用 2-3 句话概括以下资讯的核心内容，语言简洁准确。只输出摘要内容，不要添加任何前缀或解释。'
          },
          {
            role: 'user',
            content: '标题：OpenAI 发布 GPT-5\n\n内容：OpenAI 今日正式发布 GPT-5，性能大幅提升。'
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    const summary = response.data.choices?.[0]?.message?.content?.trim();
    console.log('Generated summary:', summary);
  } catch (err: any) {
    console.error('API call failed:', err.message);
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error data:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

testAPI();
