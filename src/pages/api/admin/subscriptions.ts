import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin auth
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!admin || admin.role === 'USER') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // GET - List all subscriptions with user info
  if (req.method === 'GET') {
    try {
      const subscriptions = await prisma.subscription.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
              _count: {
                select: { polls: true }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return res.json(subscriptions);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch subscriptions:');
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  }

  // POST - Create or update subscription for a user
  if (req.method === 'POST') {
    try {
      const { userId, plan, status } = req.body;

      if (!userId || !plan) {
        return res.status(400).json({ error: 'userId and plan are required' });
      }

      // Check if subscription exists
      const existing = await prisma.subscription.findUnique({
        where: { userId }
      });

      let subscription;
      if (existing) {
        subscription = await prisma.subscription.update({
          where: { userId },
          data: {
            plan,
            status: status || existing.status,
            updatedAt: new Date()
          }
        });
      } else {
        subscription = await prisma.subscription.create({
          data: {
            userId,
            plan,
            status: status || 'ACTIVE'
          }
        });
      }

      return res.json(subscription);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to update subscription:');
      return res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
