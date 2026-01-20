import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    const devices = await prisma.userDevice.findMany({
      where: { userId: user.id },
      orderBy: { lastSeenAt: 'desc' },
    });

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const devicesWithCurrent = devices.map(d => ({
      ...d,
      isCurrent: d.ipAddress === clientIp,
    }));

    return res.json({ devices: devicesWithCurrent });
  }

  if (req.method === 'DELETE') {
    // Sign out all devices except current
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
      await prisma.userDevice.deleteMany({
        where: {
          userId: user.id,
          NOT: { ipAddress: clientIp as string },
        },
      });

      return res.json({ success: true, message: 'Signed out of all other devices' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Sign out all devices error:');
      return res.status(500).json({ error: 'Failed to sign out devices' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
