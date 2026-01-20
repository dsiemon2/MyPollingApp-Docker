import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';
import { onPollClosed, emitWebhookEvent } from '@/services/webhooks';
import { onPollClosedRule } from '@/services/logicRules';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const poll = await prisma.poll.findUnique({
        where: { id: String(id) },
        include: {
          options: { orderBy: { orderIndex: 'asc' } },
          votes: true,
          messages: { orderBy: { createdAt: 'asc' } }
        }
      });
      if (!poll) return res.status(404).json({ error: 'Poll not found' });
      return res.json(poll);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch poll' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Get poll info before deleting for webhook
      const pollToDelete = await prisma.poll.findUnique({
        where: { id: String(id) },
        select: { id: true, title: true }
      });

      await prisma.poll.delete({ where: { id: String(id) } });

      // Emit webhook event for poll deletion
      if (pollToDelete) {
        emitWebhookEvent('poll.deleted', {
          pollId: pollToDelete.id,
          title: pollToDelete.title
        }).catch(err => logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Webhook error:'));
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete poll' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      // Check if this is a status change to closed
      const isClosing = req.body.status === 'closed';

      const poll = await prisma.poll.update({
        where: { id: String(id) },
        data: req.body,
        include: {
          options: true,
          _count: { select: { votes: true } }
        }
      });

      // Emit webhook and logic rules if poll was closed
      if (isClosing) {
        onPollClosed({
          id: poll.id,
          title: poll.title,
          totalVotes: poll._count.votes
        }).catch(err => logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Webhook error:'));

        onPollClosedRule({
          id: poll.id,
          title: poll.title,
          totalVotes: poll._count.votes
        }).catch(err => logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Logic rule error:'));
      }

      return res.json(poll);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update poll' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
