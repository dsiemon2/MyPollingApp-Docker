import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const [greetingSetting, businessNameSetting] = await Promise.all([
        prisma.systemSetting.findFirst({ where: { key: 'ai_greeting' } }),
        prisma.systemSetting.findFirst({ where: { key: 'business_name' } })
      ]);

      const businessName = businessNameSetting?.value || 'PoligoPro';

      return res.json({
        greeting: greetingSetting?.value || `Hello! Welcome to ${businessName}. I'm your AI assistant and I'm here to help you with polls, voting, and getting feedback. How can I assist you today?`
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch greeting' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { greeting } = req.body;

      if (!greeting || typeof greeting !== 'string') {
        return res.status(400).json({ error: 'Greeting message is required' });
      }

      await prisma.systemSetting.upsert({
        where: { key: 'ai_greeting' },
        update: { value: greeting },
        create: { key: 'ai_greeting', value: greeting, category: 'ai', type: 'string' }
      });

      return res.json({ success: true, greeting });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save greeting' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
