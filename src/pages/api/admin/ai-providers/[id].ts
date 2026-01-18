import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await prisma.aIProvider.delete({ where: { id: String(id) } });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete provider' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { isDefault, ...data } = req.body;

      // If setting as default, unset other defaults first
      if (isDefault) {
        await prisma.aIProvider.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      const provider = await prisma.aIProvider.update({
        where: { id: String(id) },
        data: { ...data, isDefault }
      });
      return res.json(provider);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update provider' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
