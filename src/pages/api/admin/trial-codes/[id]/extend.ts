import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    const trialCode = await prisma.trialCode.findUnique({ where: { id: id as string } });
    if (!trialCode) {
      return res.status(404).json({ success: false, error: 'Trial code not found' });
    }

    const newExpiresAt = new Date(trialCode.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + 14);

    await prisma.trialCode.update({
      where: { id: id as string },
      data: {
        expiresAt: newExpiresAt,
        extensionCount: { increment: 1 },
      },
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error extending trial code:');
    return res.status(500).json({ success: false, error: 'Failed to extend trial code' });
  }
}
