import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';
import { canAcceptVote, getPlanFeatures, PlanType } from '@/config/plans';
import { onVoteCast } from '@/services/webhooks';
import { onVoteCastRule } from '@/services/logicRules';
import { canAcceptVotes } from '@/lib/pollStatus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Check if visitor has already voted
  if (req.method === 'GET') {
    const { visitorId } = req.query;

    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId required' });
    }

    try {
      const existingVotes = await prisma.vote.findMany({
        where: {
          pollId: String(id),
          voterFingerprint: String(visitorId)
        },
        orderBy: { rank: 'asc' }
      });

      if (existingVotes.length === 0) {
        return res.json({
          hasVoted: false,
          votedOptionId: null,
          votedOptionIds: [],
          votedValue: null,
          votedRating: null,
          votedRankings: {}
        });
      }

      // Build response based on vote data
      const response: any = {
        hasVoted: true,
        votedOptionId: existingVotes[0]?.optionId || null,
        votedOptionIds: existingVotes.filter(v => v.optionId).map(v => v.optionId),
        votedValue: existingVotes[0]?.value || null,
        votedRating: existingVotes[0]?.rating || null,
        votedRankings: {}
      };

      // Build rankings map
      existingVotes.forEach(vote => {
        if (vote.rank && vote.optionId) {
          response.votedRankings[vote.rank] = vote.optionId;
        }
      });

      return res.json(response);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to check vote status:');
      return res.status(500).json({ error: 'Failed to check vote status' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        optionId,       // For single choice
        optionIds,      // For multiple choice
        visitorId,
        value,          // For yes/no or open text
        rating,         // For rating/nps
        rankings        // For ranked { 1: optionId, 2: optionId, ... }
      } = req.body;

      // Check if poll exists and is open, including creator's subscription
      const poll = await prisma.poll.findUnique({
        where: { id: String(id) },
        include: {
          pollType: true,
          creator: {
            include: { subscription: true }
          },
          _count: { select: { votes: true } }
        }
      });

      if (!poll) return res.status(404).json({ error: 'Poll not found' });

      // Check if poll can accept votes (considers scheduling)
      if (!canAcceptVotes({ status: poll.status, scheduledAt: poll.scheduledAt, closedAt: poll.closedAt })) {
        if (poll.status === 'scheduled') {
          return res.status(400).json({ error: 'Poll is not open yet', code: 'POLL_NOT_OPEN' });
        }
        return res.status(400).json({ error: 'Poll is not accepting votes', code: 'POLL_CLOSED' });
      }

      // Check vote limit based on poll creator's subscription
      const creatorPlan: PlanType = (poll.creator?.subscription?.plan as PlanType) || 'FREE';
      const currentVotes = poll._count.votes;

      if (!canAcceptVote(creatorPlan, currentVotes)) {
        const features = getPlanFeatures(creatorPlan);
        return res.status(403).json({
          error: `This poll has reached its vote limit of ${features.maxVotesPerPoll}. The poll creator needs to upgrade their plan to accept more votes.`,
          code: 'VOTE_LIMIT_REACHED'
        });
      }

      // Check for existing vote by visitor
      const existingVote = await prisma.vote.findFirst({
        where: {
          pollId: String(id),
          voterFingerprint: visitorId
        }
      });

      if (existingVote) {
        return res.status(400).json({ error: 'Already voted' });
      }

      const pollTypeCode = poll.pollType?.code || poll.type;

      // Handle different poll types
      switch (pollTypeCode) {
        case 'single_choice':
        case 'single':
          // Single option vote
          await prisma.vote.create({
            data: {
              pollId: String(id),
              optionId,
              voterFingerprint: visitorId
            }
          });
          break;

        case 'multiple_choice':
        case 'multiple':
          // Multiple options vote - create multiple vote records
          if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
            return res.status(400).json({ error: 'optionIds required for multiple choice' });
          }
          await prisma.vote.createMany({
            data: optionIds.map((oid: string) => ({
              pollId: String(id),
              optionId: oid,
              voterFingerprint: visitorId
            }))
          });
          break;

        case 'yes_no':
          // Store the yes/no/neutral value
          await prisma.vote.create({
            data: {
              pollId: String(id),
              voterFingerprint: visitorId,
              value: value // 'yes', 'no', or 'neutral'
            }
          });
          break;

        case 'rating_scale':
        case 'nps':
          // Store rating value
          if (rating === undefined || rating === null) {
            return res.status(400).json({ error: 'rating required' });
          }
          await prisma.vote.create({
            data: {
              pollId: String(id),
              voterFingerprint: visitorId,
              rating: Number(rating)
            }
          });
          break;

        case 'ranked':
          // Store ranked votes with rank
          if (!rankings || typeof rankings !== 'object') {
            return res.status(400).json({ error: 'rankings required for ranked choice' });
          }
          const rankEntries = Object.entries(rankings);
          if (rankEntries.length === 0) {
            return res.status(400).json({ error: 'At least one ranking required' });
          }
          await prisma.vote.createMany({
            data: rankEntries.map(([rank, oid]) => ({
              pollId: String(id),
              optionId: oid as string,
              voterFingerprint: visitorId,
              rank: Number(rank)
            }))
          });
          break;

        case 'open_text':
          // Store text response
          if (!value || typeof value !== 'string') {
            return res.status(400).json({ error: 'text value required' });
          }
          await prisma.vote.create({
            data: {
              pollId: String(id),
              voterFingerprint: visitorId,
              value: value
            }
          });
          break;

        default:
          // Default to single choice behavior
          await prisma.vote.create({
            data: {
              pollId: String(id),
              optionId,
              voterFingerprint: visitorId
            }
          });
      }

      // Emit webhook event for vote cast
      onVoteCast({
        pollId: String(id),
        optionId: optionId || optionIds?.[0],
        value: value || (rating !== undefined ? String(rating) : undefined)
      }).catch(err => logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Webhook error:'));

      // Evaluate logic rules for vote cast
      onVoteCastRule(
        { id: String(id), title: poll.title },
        { optionId, value, rating }
      ).catch(err => logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Logic rule error:'));

      return res.json({ success: true });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to submit vote:');
      return res.status(500).json({ error: 'Failed to submit vote' });
    }
  }

  // Reset vote for testing
  if (req.method === 'DELETE') {
    try {
      const { visitorId } = req.body;

      await prisma.vote.deleteMany({
        where: {
          pollId: String(id),
          voterFingerprint: visitorId
        }
      });

      return res.json({ success: true });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to reset vote:');
      return res.status(500).json({ error: 'Failed to reset vote' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
