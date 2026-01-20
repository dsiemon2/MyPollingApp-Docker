import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const polls = await prisma.poll.findMany({
        where: { status: 'open' },
        include: {
          options: { orderBy: { orderIndex: 'asc' } },
          pollType: true,
          _count: { select: { votes: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(polls);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch polls' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, type, pollTypeId, options, config } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Build poll data
      const pollData: any = {
        title,
        description: description || null,
        type: type || 'single_choice',
        status: 'open',
        config: config ? JSON.stringify(config) : '{}'
      };

      // Connect to poll type if provided
      if (pollTypeId) {
        pollData.pollType = { connect: { id: pollTypeId } };
      }

      // Create options if provided (for choice-based polls)
      if (options && Array.isArray(options) && options.length > 0) {
        const validOptions = options.filter((opt: string) => opt && opt.trim());
        if (validOptions.length > 0) {
          pollData.options = {
            create: validOptions.map((opt: string, index: number) => ({
              label: opt.trim(),
              orderIndex: index
            }))
          };
        }
      }

      const poll = await prisma.poll.create({
        data: pollData,
        include: {
          options: true,
          pollType: true
        }
      });

      return res.json(poll);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to create poll:');
      return res.status(500).json({ error: 'Failed to create poll' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
