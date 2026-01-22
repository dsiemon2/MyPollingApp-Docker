import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { canCreatePoll, canUsePollType, getPlanFeatures, PlanType } from '@/config/plans';
import { onPollCreated } from '@/services/webhooks';
import { onPollCreatedRule } from '@/services/logicRules';
import { determineInitialStatus } from '@/lib/pollStatus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [polls, total] = await Promise.all([
        prisma.poll.findMany({
          include: {
            options: true,
            pollType: true,
            _count: { select: { votes: true, messages: true, options: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.poll.count()
      ]);

      return res.json({
        polls,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch polls:');
      return res.status(500).json({ error: 'Failed to fetch polls' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);

      // Get user subscription
      let userPlan: PlanType = 'FREE';
      let userId: string | null = null;

      if (session?.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            subscription: true,
            polls: { where: { status: 'open' } }
          }
        });

        if (user) {
          userId = user.id;
          userPlan = (user.subscription?.plan as PlanType) || 'FREE';

          // Check poll limit
          const activePolls = user.polls.length;
          if (!canCreatePoll(userPlan, activePolls)) {
            const features = getPlanFeatures(userPlan);
            return res.status(403).json({
              error: `Poll limit reached. Your ${userPlan} plan allows ${features.maxActivePolls} active polls. Please upgrade your plan or close existing polls.`,
              code: 'POLL_LIMIT_REACHED'
            });
          }
        }
      }

      const { title, description, type, pollTypeId, options, config, scheduledAt, closedAt } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Parse scheduling dates
      const scheduledAtDate = scheduledAt ? new Date(scheduledAt) : null;
      const closedAtDate = closedAt ? new Date(closedAt) : null;

      // Validate dates
      if (scheduledAtDate && closedAtDate && scheduledAtDate >= closedAtDate) {
        return res.status(400).json({ error: 'Scheduled open time must be before close time' });
      }

      // Check if poll type is allowed for this plan
      const pollTypeCode = type || 'single_choice';
      if (!canUsePollType(userPlan, pollTypeCode)) {
        return res.status(403).json({
          error: `The ${pollTypeCode} poll type requires a Starter plan or higher. Please upgrade to access this feature.`,
          code: 'POLL_TYPE_NOT_ALLOWED'
        });
      }

      // Determine initial status based on scheduling
      const initialStatus = determineInitialStatus(scheduledAtDate);

      // Build poll data
      const pollData: any = {
        title,
        description: description || null,
        type: pollTypeCode,
        status: initialStatus,
        config: config ? JSON.stringify(config) : '{}',
        scheduledAt: scheduledAtDate,
        closedAt: closedAtDate
      };

      // Connect to creator if logged in
      if (userId) {
        pollData.creator = { connect: { id: userId } };
      }

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

      // Emit webhook event for poll creation
      onPollCreated({
        id: poll.id,
        title: poll.title,
        type: poll.type,
        creatorId: userId || 'anonymous'
      }).catch(err => logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Webhook error:'));

      // Evaluate logic rules for poll creation
      onPollCreatedRule({
        id: poll.id,
        title: poll.title,
        type: poll.type
      }).catch(err => logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Logic rule error:'));

      return res.json(poll);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to create poll:');
      return res.status(500).json({ error: 'Failed to create poll' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
