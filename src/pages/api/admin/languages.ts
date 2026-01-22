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
      const { code, enabled, name, nativeName, flag } = req.body;

      // If toggling enabled status by code
      if (code && enabled !== undefined) {
        const language = await prisma.language.update({
          where: { code },
          data: { enabled }
        });
        return res.json(language);
      }

      // If creating a new language
      if (name && code) {
        const language = await prisma.language.create({
          data: { name, code, nativeName: nativeName || name, flag, enabled: enabled ?? true }
        });
        return res.json(language);
      }

      return res.status(400).json({ error: 'Invalid request' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update language' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
