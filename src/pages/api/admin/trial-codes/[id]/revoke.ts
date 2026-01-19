import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    await prisma.trialCode.update({
      where: { id: id as string },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error revoking trial code:', err);
    return res.status(500).json({ success: false, error: 'Failed to revoke trial code' });
  }
}
