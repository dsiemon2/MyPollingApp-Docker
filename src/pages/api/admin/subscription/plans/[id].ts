import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    return res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return res.status(500).json({ error: 'Failed to fetch plan' });
  }
}
