import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import logger from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        paymentMethods: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        notificationPrefs: true,
        devices: {
          orderBy: { lastSeenAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark current device based on IP
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const devices = user.devices.map(d => ({
      ...d,
      isCurrent: d.ipAddress === clientIp,
    }));

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      paymentMethods: user.paymentMethods,
      notificationPrefs: user.notificationPrefs,
      devices,
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Account API error:');
    res.status(500).json({ error: 'Failed to load account data' });
  }
}
