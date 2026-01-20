import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const trialCodes = await prisma.trialCode.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const stats = {
        pending: trialCodes.filter(tc => tc.status === 'PENDING').length,
        sent: trialCodes.filter(tc => tc.status === 'SENT').length,
        redeemed: trialCodes.filter(tc => tc.status === 'REDEEMED').length,
        expired: trialCodes.filter(tc => tc.status === 'EXPIRED').length,
        total: trialCodes.length,
      };

      return res.json({ success: true, trialCodes, stats });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error fetching trial codes:');
      return res.status(500).json({ success: false, error: 'Failed to fetch trial codes' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { email, phone, durationDays } = req.body;

      // Generate unique code
      const code = `MP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (parseInt(durationDays) || 14));

      const trialCode = await prisma.trialCode.create({
        data: {
          code,
          email: email || null,
          phone: phone || null,
          trialDays: parseInt(durationDays) || 14,
          status: 'PENDING',
          expiresAt,
        },
      });

      return res.json({ success: true, trialCode });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error creating trial code:');
      return res.status(500).json({ success: false, error: 'Failed to create trial code' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
