import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rules = await prisma.logicRule.findMany({
        orderBy: { priority: 'asc' }
      });
      return res.json(rules);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch rules' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, trigger, action, priority } = req.body;
      const rule = await prisma.logicRule.create({
        data: { name, trigger, action, priority, enabled: true }
      });
      return res.json(rule);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create rule' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
