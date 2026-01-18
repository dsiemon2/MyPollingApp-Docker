import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await prisma.customFunction.delete({ where: { id: String(id) } });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete function' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const fn = await prisma.customFunction.update({
        where: { id: String(id) },
        data: req.body
      });
      return res.json(fn);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update function' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
