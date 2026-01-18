import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const webhooks = await prisma.webhook.findMany({
        include: { logs: { take: 5, orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(webhooks);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, url, events, secret } = req.body;
      const webhook = await prisma.webhook.create({
        data: { name, url, events, secret, enabled: true }
      });
      return res.json(webhook);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create webhook' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
