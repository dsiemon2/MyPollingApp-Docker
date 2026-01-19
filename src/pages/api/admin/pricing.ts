import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    let currentPlanId = null;
    const session = await getServerSession(req, res, authOptions);
    if (session?.user) {
      const userId = (session.user as any).id;
      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (subscription) {
        currentPlanId = subscription.planId;
      }
    }

    return res.json({ success: true, plans, currentPlanId });
  } catch (err) {
    console.error('Error fetching pricing:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch pricing' });
  }
}
