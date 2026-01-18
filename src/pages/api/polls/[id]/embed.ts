import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for embed endpoints
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: id as string },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
          include: { _count: { select: { votes: true } } }
        },
        _count: { select: { votes: true } }
      },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const totalVotes = poll._count.votes;

    // Get the base URL from headers or use a default
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:8610';
    const baseUrl = `${protocol}://${host}`;

    const embedData = {
      id: poll.id,
      question: poll.title,
      description: poll.description,
      options: poll.options.map(opt => {
        const votes = opt._count.votes;
        return {
          id: opt.id,
          text: opt.label,
          votes,
          percentage: totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0,
        };
      }),
      totalVotes,
      status: poll.status,
      isActive: poll.status === 'open',
      createdAt: poll.createdAt.toISOString(),
      embedUrl: `${baseUrl}/embed/polls/${poll.id}`,
      shareUrl: `${baseUrl}/polls/${poll.id}`,
      embedCode: `<iframe src="${baseUrl}/embed/polls/${poll.id}" width="100%" height="450" frameborder="0" style="border-radius: 12px; max-width: 500px; border: 1px solid #e5e7eb;"></iframe>`,
    };

    return res.status(200).json(embedData);
  } catch (error) {
    console.error('Failed to fetch poll for embed:', error);
    return res.status(500).json({ error: 'Failed to fetch poll' });
  }
}
