import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Device ID is required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify ownership
  const device = await prisma.userDevice.findFirst({
    where: { id, userId: user.id },
  });

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  try {
    await prisma.userDevice.delete({ where: { id } });
    return res.json({ success: true, message: 'Device signed out' });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Delete device error:');
    return res.status(500).json({ error: 'Failed to sign out device' });
  }
}
