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

    const { planId } = req.query;
    const userId = (session.user as any).id;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await prisma.subscription.create({
      data: {
        userId,
        planId: planId as string,
        status: 'trialing',
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error starting trial:', err);
    return res.status(500).json({ success: false, error: 'Failed to start trial' });
  }
}
