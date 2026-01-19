import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const trialCodes = await prisma.trialCode.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const stats = {
        pending: trialCodes.filter(tc => tc.status === 'pending').length,
        sent: trialCodes.filter(tc => tc.status === 'sent').length,
        redeemed: trialCodes.filter(tc => tc.status === 'redeemed').length,
        expired: trialCodes.filter(tc => tc.status === 'expired').length,
        total: trialCodes.length,
      };

      return res.json({ success: true, trialCodes, stats });
    } catch (err) {
      console.error('Error fetching trial codes:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch trial codes' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { firstName, lastName, email, phone, organization, deliveryMethod, durationDays } = req.body;

      // Generate unique code
      const code = `MP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (parseInt(durationDays) || 14));

      const trialCode = await prisma.trialCode.create({
        data: {
          code,
          requesterFirstName: firstName,
          requesterLastName: lastName,
          requesterEmail: email,
          requesterPhone: phone || null,
          requesterOrganization: organization || null,
          deliveryMethod: deliveryMethod || 'email',
          durationDays: parseInt(durationDays) || 14,
          status: 'pending',
          expiresAt,
        },
      });

      return res.json({ success: true, trialCode });
    } catch (err) {
      console.error('Error creating trial code:', err);
      return res.status(500).json({ success: false, error: 'Failed to create trial code' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
