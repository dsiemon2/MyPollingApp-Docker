import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import logger from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow valid notification preference keys
    const validKeys = [
      'pollResultsEmail', 'pollResultsSms', 'pollResultsPush',
      'newPollInviteEmail', 'newPollInviteSms', 'newPollInvitePush',
      'pollClosingEmail', 'pollClosingSms', 'pollClosingPush',
      'subscriptionEmail', 'subscriptionSms', 'subscriptionPush',
      'paymentEmail', 'paymentSms', 'paymentPush',
      'securityEmail', 'securitySms', 'securityPush',
    ];

    const updates: Record<string, boolean> = {};
    for (const key of validKeys) {
      if (typeof req.body[key] === 'boolean') {
        updates[key] = req.body[key];
      }
    }

    const prefs = await prisma.userNotificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...updates,
      },
      update: updates,
    });

    res.json({ success: true, preferences: prefs });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Update notifications error:');
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
}
