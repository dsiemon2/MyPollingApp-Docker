import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user || !['SUPER_ADMIN', 'POLL_ADMIN'].includes((session.user as any).role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, apiKey, model } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider and API key are required' });
  }

  try {
    let success = false;
    let message = '';

    switch (provider) {
      case 'openai':
        success = await testOpenAI(apiKey, model);
        message = success ? 'OpenAI connection successful' : 'OpenAI connection failed';
        break;

      case 'anthropic':
        success = await testAnthropic(apiKey, model);
        message = success ? 'Anthropic connection successful' : 'Anthropic connection failed';
        break;

      case 'google':
        success = await testGoogle(apiKey, model);
        message = success ? 'Google AI connection successful' : 'Google AI connection failed';
        break;

      case 'huggingface':
        success = await testHuggingFace(apiKey, model);
        message = success ? 'Hugging Face connection successful' : 'Hugging Face connection failed';
        break;

      case 'groq':
        success = await testGroq(apiKey, model);
        message = success ? 'Groq connection successful' : 'Groq connection failed';
        break;

      case 'deepseek':
        success = await testDeepSeek(apiKey, model);
        message = success ? 'DeepSeek connection successful' : 'DeepSeek connection failed';
        break;

      case 'mistral':
        success = await testMistral(apiKey, model);
        message = success ? 'Mistral AI connection successful' : 'Mistral AI connection failed';
        break;

      case 'grok':
        success = await testGrok(apiKey, model);
        message = success ? 'Grok (xAI) connection successful' : 'Grok connection failed';
        break;

      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    return res.json({ success, message });
  } catch (error: any) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, `AI provider test error (${provider}):`);
    return res.json({
      success: false,
      message: error.message || 'Connection test failed'
    });
  }
}

async function testOpenAI(apiKey: string, model?: string): Promise<boolean> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  return response.ok;
}

async function testAnthropic(apiKey: string, model?: string): Promise<boolean> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    })
  });
  return response.ok || response.status === 400; // 400 means API key is valid but request was bad
}

async function testGoogle(apiKey: string, model?: string): Promise<boolean> {
  const modelId = model || 'gemini-1.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${modelId}?key=${apiKey}`
  );
  return response.ok;
}

async function testHuggingFace(apiKey: string, model?: string): Promise<boolean> {
  const response = await fetch('https://huggingface.co/api/whoami', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  return response.ok;
}

async function testGroq(apiKey: string, model?: string): Promise<boolean> {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  return response.ok;
}

async function testDeepSeek(apiKey: string, model?: string): Promise<boolean> {
  const response = await fetch('https://api.deepseek.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  return response.ok;
}

async function testMistral(apiKey: string, model?: string): Promise<boolean> {
  const response = await fetch('https://api.mistral.ai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  return response.ok;
}

async function testGrok(apiKey: string, model?: string): Promise<boolean> {
  const response = await fetch('https://api.x.ai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  return response.ok;
}
