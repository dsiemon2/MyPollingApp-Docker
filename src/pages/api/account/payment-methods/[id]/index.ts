import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (req.method === 'DELETE') {
    try {
      await prisma.userPaymentMethod.delete({ where: { id } });

      // If this was the default, make the most recent one default
      if (paymentMethod.isDefault) {
        const newest = await prisma.userPaymentMethod.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });
        if (newest) {
          await prisma.userPaymentMethod.update({
            where: { id: newest.id },
            data: { isDefault: true },
          });
        }
      }

      return res.json({ success: true, message: 'Payment method removed' });
    } catch (error) {
      console.error('Delete payment method error:', error);
      return res.status(500).json({ error: 'Failed to remove payment method' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
