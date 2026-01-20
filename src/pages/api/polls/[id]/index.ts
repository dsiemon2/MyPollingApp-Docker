import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const poll = await prisma.poll.findUnique({
        where: { id: String(id) },
        include: {
          pollType: true,
          options: {
            orderBy: { orderIndex: 'asc' },
            include: { _count: { select: { votes: true } } }
          },
          _count: { select: { votes: true } }
        }
      });

      if (!poll) return res.status(404).json({ error: 'Poll not found' });

      const pollTypeCode = poll.pollType?.code || poll.type;

      // Base poll data
      const pollWithVotes: any = {
        ...poll,
        pollTypeCode,
        config: poll.config ? JSON.parse(poll.config) : {},
        options: poll.options.map(opt => ({
          ...opt,
          text: opt.label,
          votes: opt._count.votes
        })),
        totalVotes: poll._count.votes
      };

      // Add type-specific aggregations
      switch (pollTypeCode) {
        case 'rating_scale':
        case 'nps': {
          // Get all rating votes
          const ratingVotes = await prisma.vote.findMany({
            where: { pollId: String(id), rating: { not: null } }
          });

          if (ratingVotes.length > 0) {
            const ratings = ratingVotes.map(v => v.rating as number);
            const sum = ratings.reduce((a, b) => a + b, 0);
            pollWithVotes.averageRating = sum / ratings.length;
            pollWithVotes.ratingCount = ratings.length;

            // For NPS, calculate score
            if (pollTypeCode === 'nps') {
              const detractors = ratings.filter(r => r <= 6).length;
              const promoters = ratings.filter(r => r >= 9).length;
              const npsScore = Math.round(((promoters - detractors) / ratings.length) * 100);
              pollWithVotes.npsScore = npsScore;
              pollWithVotes.detractorCount = detractors;
              pollWithVotes.passiveCount = ratings.filter(r => r >= 7 && r <= 8).length;
              pollWithVotes.promoterCount = promoters;
            }
          }
          break;
        }

        case 'yes_no': {
          // Get yes/no/neutral counts
          const yesNoVotes = await prisma.vote.groupBy({
            by: ['value'],
            where: { pollId: String(id), value: { not: null } },
            _count: true
          });

          pollWithVotes.yesNoResults = {
            yes: 0,
            no: 0,
            neutral: 0
          };

          yesNoVotes.forEach(v => {
            if (v.value && pollWithVotes.yesNoResults.hasOwnProperty(v.value)) {
              pollWithVotes.yesNoResults[v.value] = v._count;
            }
          });

          pollWithVotes.totalVotes = Object.values(pollWithVotes.yesNoResults).reduce(
            (a: number, b: unknown) => a + (b as number), 0
          );
          break;
        }

        case 'ranked': {
          // Calculate points for ranked voting
          const config = poll.config ? JSON.parse(poll.config) : {};
          const pointSystem = config.pointSystem || [3, 2, 1];

          const rankedVotes = await prisma.vote.findMany({
            where: { pollId: String(id), rank: { not: null } }
          });

          // Calculate points per option
          const optionPoints: Record<string, number> = {};
          poll.options.forEach(opt => {
            optionPoints[opt.id] = 0;
          });

          rankedVotes.forEach(vote => {
            if (vote.optionId && vote.rank) {
              const points = pointSystem[vote.rank - 1] || 0;
              optionPoints[vote.optionId] = (optionPoints[vote.optionId] || 0) + points;
            }
          });

          pollWithVotes.options = pollWithVotes.options.map((opt: any) => ({
            ...opt,
            points: optionPoints[opt.id] || 0
          }));

          // Sort by points
          pollWithVotes.options.sort((a: any, b: any) => b.points - a.points);

          // Count unique voters
          const uniqueVoters = new Set(rankedVotes.map(v => v.voterFingerprint));
          pollWithVotes.totalVotes = uniqueVoters.size;
          break;
        }

        case 'open_text': {
          // Get text responses (limited for privacy)
          const textVotes = await prisma.vote.findMany({
            where: { pollId: String(id), value: { not: null } },
            select: { value: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 50
          });

          pollWithVotes.textResponses = textVotes.map(v => ({
            text: v.value,
            createdAt: v.createdAt
          }));
          pollWithVotes.totalVotes = await prisma.vote.count({
            where: { pollId: String(id) }
          });
          break;
        }

        case 'multiple_choice':
        case 'multiple': {
          // For multiple choice, count unique voters
          const multipleVotes = await prisma.vote.findMany({
            where: { pollId: String(id) },
            select: { voterFingerprint: true }
          });
          const uniqueVoters = new Set(multipleVotes.map(v => v.voterFingerprint));
          pollWithVotes.totalVoters = uniqueVoters.size;
          break;
        }
      }

      return res.json(pollWithVotes);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch poll:');
      return res.status(500).json({ error: 'Failed to fetch poll' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
