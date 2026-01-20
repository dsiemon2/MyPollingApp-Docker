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

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Payment method ID is required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify ownership
  const paymentMethod = await prisma.userPaymentMethod.findFirst({
    where: { id, userId: user.id },
  });

  if (!paymentMethod) {
    return res.status(404).json({ error: 'Payment method not found' });
  }

  try {
    // Remove default from all others
    await prisma.userPaymentMethod.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });

    // Set this one as default
    const updated = await prisma.userPaymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });

    return res.json({ success: true, paymentMethod: updated });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Set default payment method error:');
    return res.status(500).json({ error: 'Failed to set default payment method' });
  }
}
