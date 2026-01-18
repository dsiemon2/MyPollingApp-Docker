import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user || !['SUPER_ADMIN', 'POLL_ADMIN'].includes((session.user as any).role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { days = '30' } = req.query;
    const daysNum = parseInt(String(days)) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get votes over time
    const votes = await prisma.vote.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        pollId: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group votes by day
    const votesByDay: Record<string, number> = {};
    votes.forEach(vote => {
      const day = vote.createdAt.toISOString().split('T')[0];
      votesByDay[day] = (votesByDay[day] || 0) + 1;
    });

    // Fill in missing days with zeros
    const voteTrend: { date: string; votes: number }[] = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      voteTrend.push({
        date: dateStr,
        votes: votesByDay[dateStr] || 0
      });
    }

    // Get polls created over time
    const polls = await prisma.poll.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        type: true,
        status: true
      }
    });

    const pollsByDay: Record<string, number> = {};
    polls.forEach(poll => {
      const day = poll.createdAt.toISOString().split('T')[0];
      pollsByDay[day] = (pollsByDay[day] || 0) + 1;
    });

    const pollTrend: { date: string; polls: number }[] = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      pollTrend.push({
        date: dateStr,
        polls: pollsByDay[dateStr] || 0
      });
    }

    // Get poll type distribution
    const pollTypes = await prisma.poll.groupBy({
      by: ['type'],
      _count: { id: true }
    });

    const pollTypeDistribution = pollTypes.map(pt => ({
      type: pt.type,
      count: pt._count.id
    }));

    // Get top polls by votes
    const topPolls = await prisma.poll.findMany({
      take: 10,
      include: {
        _count: { select: { votes: true } },
        pollType: { select: { name: true } }
      },
      orderBy: {
        votes: { _count: 'desc' }
      }
    });

    // Get subscription distribution
    const subscriptions = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: { id: true }
    });

    const planDistribution = subscriptions.map(s => ({
      plan: s.plan,
      count: s._count.id
    }));

    // Get user registrations over time
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: { createdAt: true }
    });

    const usersByDay: Record<string, number> = {};
    users.forEach(user => {
      const day = user.createdAt.toISOString().split('T')[0];
      usersByDay[day] = (usersByDay[day] || 0) + 1;
    });

    const userTrend: { date: string; users: number }[] = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      userTrend.push({
        date: dateStr,
        users: usersByDay[dateStr] || 0
      });
    }

    // Summary stats
    const totalVotesInPeriod = votes.length;
    const totalPollsInPeriod = polls.length;
    const totalUsersInPeriod = users.length;
    const avgVotesPerDay = totalVotesInPeriod / daysNum;
    const avgPollsPerDay = totalPollsInPeriod / daysNum;

    return res.json({
      period: {
        days: daysNum,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      summary: {
        totalVotes: totalVotesInPeriod,
        totalPolls: totalPollsInPeriod,
        totalUsers: totalUsersInPeriod,
        avgVotesPerDay: Math.round(avgVotesPerDay * 100) / 100,
        avgPollsPerDay: Math.round(avgPollsPerDay * 100) / 100
      },
      trends: {
        votes: voteTrend,
        polls: pollTrend,
        users: userTrend
      },
      distributions: {
        pollTypes: pollTypeDistribution,
        plans: planDistribution
      },
      topPolls: topPolls.map(p => ({
        id: p.id,
        title: p.title,
        type: p.pollType?.name || p.type,
        votes: p._count.votes,
        status: p.status
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}
