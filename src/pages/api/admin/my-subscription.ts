import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const userId = (session.user as any).id;
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      include: { subscriptionPlan: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, subscription });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error fetching subscription:');
    return res.status(500).json({ success: false, error: 'Failed to fetch subscription' });
  }
}
