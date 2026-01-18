import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      // Return free plan for unauthenticated users
      return res.json({
        plan: 'FREE',
        status: 'ACTIVE',
        activePolls: 0,
      });
    }

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscription: true,
        polls: {
          where: { status: 'open' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count active polls
    const activePolls = user.polls.length;

    // Get or create subscription
    let subscription = user.subscription;

    if (!subscription) {
      // Create default free subscription
      subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });
    }

    return res.json({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
      trialEnd: subscription.trialEnd?.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      activePolls,
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
