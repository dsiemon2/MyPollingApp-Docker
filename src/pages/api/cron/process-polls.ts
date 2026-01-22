import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';

/**
 * Cron endpoint for processing poll scheduling
 *
 * This endpoint should be called periodically (e.g., every minute) by an external
 * cron service, Vercel Cron, or similar.
 *
 * It handles:
 * 1. Opening scheduled polls when their scheduledAt time has passed
 * 2. Closing open polls when their closedAt time has passed
 *
 * Security: Optional CRON_SECRET header verification
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Verify cron secret for security
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const providedSecret = req.headers['x-cron-secret'] || req.query.secret;
    if (providedSecret !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const now = new Date();
  const results = {
    opened: 0,
    closed: 0,
    errors: [] as string[]
  };

  try {
    // 1. Open scheduled polls that should now be open
    const pollsToOpen = await prisma.poll.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: now
        }
      },
      select: { id: true, title: true }
    });

    if (pollsToOpen.length > 0) {
      for (const poll of pollsToOpen) {
        try {
          await prisma.poll.update({
            where: { id: poll.id },
            data: { status: 'open' }
          });
          results.opened++;
          logger.info({ pollId: poll.id, title: poll.title }, 'Poll auto-opened');
        } catch (error) {
          const errorMsg = `Failed to open poll ${poll.id}: ${error instanceof Error ? error.message : String(error)}`;
          results.errors.push(errorMsg);
          logger.error({ pollId: poll.id, error: error instanceof Error ? error.message : String(error) }, 'Failed to auto-open poll');
        }
      }
    }

    // 2. Close open polls that should now be closed
    const pollsToClose = await prisma.poll.findMany({
      where: {
        status: 'open',
        closedAt: {
          lte: now
        }
      },
      select: { id: true, title: true }
    });

    if (pollsToClose.length > 0) {
      for (const poll of pollsToClose) {
        try {
          await prisma.poll.update({
            where: { id: poll.id },
            data: { status: 'closed' }
          });
          results.closed++;
          logger.info({ pollId: poll.id, title: poll.title }, 'Poll auto-closed');
        } catch (error) {
          const errorMsg = `Failed to close poll ${poll.id}: ${error instanceof Error ? error.message : String(error)}`;
          results.errors.push(errorMsg);
          logger.error({ pollId: poll.id, error: error instanceof Error ? error.message : String(error) }, 'Failed to auto-close poll');
        }
      }
    }

    logger.info({ opened: results.opened, closed: results.closed }, 'Cron job completed');

    return res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      pollsOpened: results.opened,
      pollsClosed: results.closed,
      errors: results.errors.length > 0 ? results.errors : undefined
    });

  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Cron job failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to process polls',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
