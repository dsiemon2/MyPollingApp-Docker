import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const userId = (session.user as any).id;

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'canceled' },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          canceledAt: null,
        },
      });
    }

    return res.json({ success: true, message: 'Subscription resumed' });
  } catch (err) {
    console.error('Error resuming subscription:', err);
    return res.status(500).json({ success: false, error: 'Failed to resume subscription' });
  }
}
