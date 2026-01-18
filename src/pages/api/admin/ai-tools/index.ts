import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const tools = await prisma.aITool.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(tools);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch tools' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, displayName, description, type, endpoint } = req.body;
      const tool = await prisma.aITool.create({
        data: { name, displayName, description, type, endpoint, enabled: true }
      });
      return res.json(tool);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create tool' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
