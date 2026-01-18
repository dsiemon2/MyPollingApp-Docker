import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const languages = await prisma.language.findMany({
        orderBy: { name: 'asc' }
      });
      return res.json(languages);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch languages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, code, nativeName, flag, enabled } = req.body;
      const language = await prisma.language.create({
        data: { name, code, nativeName: nativeName || name, flag, enabled: enabled ?? true }
      });
      return res.json(language);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create language' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
