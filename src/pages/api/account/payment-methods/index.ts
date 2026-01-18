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
    const paymentMethods = await prisma.userPaymentMethod.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ paymentMethods });
  }

  if (req.method === 'POST') {
    const { cardType, cardLast4, cardHolderName, expiryMonth, expiryYear, isDefault, gateway, gatewayCustomerId, gatewayPaymentMethodId } = req.body;

    if (!cardType || !cardLast4 || !cardHolderName || !expiryMonth || !expiryYear) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // If this is set as default, remove default from others
      if (isDefault) {
        await prisma.userPaymentMethod.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      // Check if this is the first payment method
      const existingCount = await prisma.userPaymentMethod.count({
        where: { userId: user.id },
      });

      const paymentMethod = await prisma.userPaymentMethod.create({
        data: {
          userId: user.id,
          cardType,
          cardLast4,
          cardHolderName,
          expiryMonth: parseInt(expiryMonth),
          expiryYear: parseInt(expiryYear),
          isDefault: isDefault || existingCount === 0,
          gateway,
          gatewayCustomerId,
          gatewayPaymentMethodId,
        },
      });

      return res.status(201).json({ paymentMethod });
    } catch (error) {
      console.error('Add payment method error:', error);
      return res.status(500).json({ error: 'Failed to add payment method' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
