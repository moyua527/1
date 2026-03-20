/**
 * LLM 服务 - 支持 OpenAI 兼容 API (OpenAI / DeepSeek / 本地模型)
 * 配置通过环境变量:
 *   LLM_API_URL  - API 地址 (默认 https://api.openai.com/v1/chat/completions)
 *   LLM_API_KEY  - API Key
 *   LLM_MODEL    - 模型名称 (默认 gpt-3.5-turbo)
 */

const LLM_API_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-3.5-turbo';

async function chat(messages, options = {}) {
  if (!LLM_API_KEY) {
    throw new Error('LLM_API_KEY 未配置。请在环境变量中设置 LLM_API_KEY。');
  }

  const body = {
    model: options.model || LLM_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1024,
  };

  const resp = await fetch(LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LLM API 错误 (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

module.exports = { chat };
