import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const functions = await prisma.customFunction.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(functions);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch functions' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, displayName, description, code } = req.body;
      const fn = await prisma.customFunction.create({
        data: { name, displayName, description, code, enabled: true }
      });
      return res.json(fn);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create function' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
