import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

const defaultConfig = {
  systemPrompt: '',
  temperature: '0.7',
  maxTokens: '1024',
  topP: '1.0',
  frequencyPenalty: '0',
  presencePenalty: '0'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const configs = await prisma.aIConfig.findMany();
      const configObj: Record<string, string> = { ...defaultConfig };
      configs.forEach(c => { configObj[c.key] = c.value; });
      return res.json(configObj);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch config' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      for (const [key, value] of Object.entries(data)) {
        await prisma.aIConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      }
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save config' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
