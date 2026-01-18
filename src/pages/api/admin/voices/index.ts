import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const voices = await prisma.voice.findMany({
        orderBy: { name: 'asc' }
      });
      return res.json(voices);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch voices' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, voiceId, provider, language, gender, description, isDefault } = req.body;

      // If setting as default, unset other defaults first
      if (isDefault) {
        await prisma.voice.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      const voice = await prisma.voice.create({
        data: { name, voiceId, provider, language, gender, description, isDefault }
      });
      return res.json(voice);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create voice' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
