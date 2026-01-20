import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { firstName, lastName, email } = req.body;
    const userId = (session.user as any).id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: `${firstName} ${lastName}`.trim(),
        email,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error updating account:');
    return res.status(500).json({ success: false, error: 'Failed to update account' });
  }
}
