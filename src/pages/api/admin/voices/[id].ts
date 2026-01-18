import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await prisma.voice.delete({ where: { id: String(id) } });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete voice' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { isDefault, enabled, ...data } = req.body;

      // If setting as default, unset other defaults first
      if (isDefault) {
        await prisma.voice.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      const voice = await prisma.voice.update({
        where: { id: String(id) },
        data: { ...data, isDefault, enabled }
      });
      return res.json(voice);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update voice' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
