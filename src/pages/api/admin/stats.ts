import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const [totalPolls, totalVotes, totalUsers, activePolls] = await Promise.all([
      prisma.poll.count(),
      prisma.vote.count(),
      prisma.user.count(),
      prisma.poll.count({ where: { status: 'open' } })
    ]);

    res.status(200).json({
      totalPolls,
      totalVotes,
      totalUsers,
      activePolls
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
}

export default withAuth(handler, ['SUPER_ADMIN', 'POLL_ADMIN']);
